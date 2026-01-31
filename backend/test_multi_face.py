import cv2
import urllib.request
import numpy as np
import os
import sys
import traceback

def run_test():
    """Tests the multiple-face detection feature."""
    image_url = "https://upload.wikimedia.org/wikipedia/commons/8/8d/A_group_including_a_man%2C_a_woman_and_five_children_NLW3364706.jpg"
    image_path = "test_image_multiple_faces.jpg"

    print("--- Multiple-Face Detection Test ---")

    try:
        # Import must be inside the try block to catch import errors
        from app.cv_processor import ProctoringSystem

        # --- Test Setup ---
        if not os.path.exists(image_path):
            print(f"Downloading test image from {image_url}...")
            urllib.request.urlretrieve(image_url, image_path)
            print("Test image downloaded successfully.")

        frame = cv2.imread(image_path)
        if frame is None:
            print("Failed to load the test image.")
            return

        # --- System Initialization ---
        print("Initializing the proctoring system...")
        proctoring_system = ProctoringSystem()
        print("System initialized. Processing frame...")

        # --- Run Test ---
        events = proctoring_system.process_frame(frame)

        # --- Verification ---
        test_passed = False
        if events:
            for event in events:
                print(f"Generated event: {event}")
                if event.get('type') == 'test_terminated' and "Multiple faces detected" in event.get('message', ''):
                    test_passed = True
                    break
        
        if test_passed:
            print("\n[SUCCESS] Test passed. The system correctly detected multiple faces and terminated the session.")
        else:
            print("\n[FAILURE] Test failed. The system did not generate the expected 'test_terminated' event for multiple faces.")

    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred during the test:")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {e}")
        print("Traceback:")
        traceback.print_exc()

    finally:
        # --- Cleanup ---
        if os.path.exists(image_path):
            os.remove(image_path)
            print(f"Cleaned up test image: {image_path}")

if __name__ == "__main__":
    run_test()

