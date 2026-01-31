import cv2
import mediapipe as mp
import numpy as np
import math
from typing import Tuple, Dict, List
import logging
from datetime import datetime, timedelta
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import urllib.request
import os

# --- MediaPipe Initialization ---
model_path = 'face_landmarker_v2_with_blendshapes.task'
if not os.path.exists(model_path):
    print("Downloading face landmarker model...")
    try:
        url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
        urllib.request.urlretrieve(url, model_path)
        print("Model downloaded successfully.")
    except Exception as e:
        print(f"Error downloading model: {e}")
        exit()

BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True,
    running_mode=VisionRunningMode.IMAGE,
    num_faces=2) # Allow detecting up to 2 faces

face_landmarker = FaceLandmarker.create_from_options(options)
# --------------------------------

class EyeAspectRatio:
    @staticmethod
    def calculate_ear(eye_landmarks: np.ndarray) -> float:
        v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        return (v1 + v2) / (2 * h) if h > 0 else 0.0

class GazeTracker:
    @staticmethod
    def get_gaze_ratio(eye_points, facial_landmarks):
        eye_region = np.array([(facial_landmarks[p].x, facial_landmarks[p].y) for p in eye_points])
        eye_center = eye_region.mean(axis=0)

        pupil_landmark = facial_landmarks[468] # Left eye pupil, 473 for right
        pupil = np.array([pupil_landmark.x, pupil_landmark.y])

        # Simple ratio of pupil position within the eye bounding box
        min_x, min_y = eye_region.min(axis=0)
        max_x, max_y = eye_region.max(axis=0)

        if max_x - min_x == 0: return 0.5 # Avoid division by zero

        ratio = (pupil[0] - min_x) / (max_x - min_x)
        return ratio

class HeadPoseEstimator:
    @staticmethod
    def get_head_pose(results, frame_shape):
        if not results.facial_transformation_matrixes:
            return None, None, None
        
        matrix = results.facial_transformation_matrixes[0]
        
        # Decompose the transformation matrix
        sy = math.sqrt(matrix[0,0] * matrix[0,0] +  matrix[1,0] * matrix[1,0])
        singular = sy < 1e-6

        if not singular:
            x = math.atan2(matrix[2,1] , matrix[2,2])
            y = math.atan2(-matrix[2,0], sy)
            z = math.atan2(matrix[1,0], matrix[0,0])
        else:
            x = math.atan2(-matrix[1,2], matrix[1,1])
            y = math.atan2(-matrix[2,0], sy)
            z = 0

        # Convert to degrees
        pitch = math.degrees(x)
        yaw = math.degrees(y)
        roll = math.degrees(z)

        return pitch, yaw, roll

class ProctoringSystem:
    def __init__(self, ear_threshold: float = 0.23, gaze_away_duration: int = 5, drowsiness_duration: int = 300, head_yaw_threshold: int = 25, head_pitch_threshold: int = 20, max_warnings: int = 3, warning_cooldown: int = 15):
        self.ear_threshold = ear_threshold
        self.gaze_away_duration = timedelta(seconds=gaze_away_duration)
        self.drowsiness_duration = timedelta(seconds=drowsiness_duration)
        self.head_yaw_threshold = head_yaw_threshold
        self.head_pitch_threshold = head_pitch_threshold
        self.max_warnings = max_warnings
        self.warning_cooldown = timedelta(seconds=warning_cooldown)

        self.ear_calculator = EyeAspectRatio()
        self.gaze_tracker = GazeTracker()
        self.head_pose_estimator = HeadPoseEstimator()
        self.logger = logging.getLogger(__name__)

        self.reset_state()

        self.LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
        self.LEFT_IRIS_INDICES = [469, 470, 471, 472]
        self.RIGHT_IRIS_INDICES = [474, 475, 476, 477]

    def reset_state(self):
        self.warning_count = 0
        self.violation_start_time = None
        self.drowsiness_start_time = None
        self.test_terminated = False
        self.last_warning_time = None
        self.last_drowsiness_alert_time = None
        self.logger.info("Proctoring state has been reset.")

    def process_frame(self, frame: np.ndarray) -> List[Dict]:
        if self.test_terminated:
            return []

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        results = face_landmarker.detect(mp_image)
        
        events = []

        # --- Multiple Face Detection Logic ---
        if len(results.face_landmarks) > 1:
            multi_face_event = self._issue_warning("Multiple faces detected. Please ensure you are alone.")
            if multi_face_event:
                events.append(multi_face_event)
                if self.test_terminated:
                    return events  # Stop processing if test is terminated
        
        if not results.face_landmarks:
            return [self._create_event('status_update', 'No face detected.')]

        landmarks = results.face_landmarks[0]
        pitch, yaw, roll = self.head_pose_estimator.get_head_pose(results, frame.shape)

        # --- Head Pose Logic ---
        head_turned = yaw is not None and (abs(yaw) > self.head_yaw_threshold or pitch > self.head_pitch_threshold)

        if head_turned:
            if self.violation_start_time is None:
                self.violation_start_time = datetime.now()
            if datetime.now() - self.violation_start_time > self.gaze_away_duration:
                gaze_event = self._issue_warning("Please face the screen.")
                if gaze_event:
                    events.append(gaze_event)
                    if self.test_terminated:
                        return events  # Stop processing if test is terminated
        else:
            self.violation_start_time = None

        # --- Drowsiness Logic ---
        left_eye_lm = np.array([[landmarks[p].x, landmarks[p].y] for p in self.LEFT_EYE_INDICES])
        right_eye_lm = np.array([[landmarks[p].x, landmarks[p].y] for p in self.RIGHT_EYE_INDICES])
        ear_avg = (self.ear_calculator.calculate_ear(left_eye_lm) + self.ear_calculator.calculate_ear(right_eye_lm)) / 2

        if ear_avg < self.ear_threshold:
            if self.drowsiness_start_time is None:
                self.drowsiness_start_time = datetime.now()
            if datetime.now() - self.drowsiness_start_time > self.drowsiness_duration:
                if self.last_drowsiness_alert_time is None or datetime.now() - self.last_drowsiness_alert_time > timedelta(minutes=1):
                    self.last_drowsiness_alert_time = datetime.now()
                    events.append(self._create_event('alert', 'Drowsiness detected. Please stay alert.'))
        else:
            self.drowsiness_start_time = None

        if not events:
            status = 'Attentive' if not head_turned else 'Looking Away'
            events.append(self._create_event('status_update', f'Status: {status}'))

        return events

    def _issue_warning(self, reason: str):
        """Issues a warning, logs it, and terminates the test if max warnings are exceeded."""
        now = datetime.now()
        if self.last_warning_time and now - self.last_warning_time < self.warning_cooldown:
            return None

        self.warning_count += 1
        self.last_warning_time = now
        self.violation_start_time = None

        if self.warning_count >= self.max_warnings:
            self.test_terminated = True
            message = f"Test terminated after {self.max_warnings} warnings. Final violation: {reason}"
            self.logger.error(message)
            return self._create_event('test_terminated', message)
        else:
            message = f"Warning [{self.warning_count}/{self.max_warnings}]: {reason}"
            self.logger.warning(message)
            return self._create_event('warning', message)

    def _create_event(self, event_type: str, message: str) -> Dict:
        return {
            'type': event_type,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'warning_count': self.warning_count
        }