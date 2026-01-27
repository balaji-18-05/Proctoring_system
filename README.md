# AI-Powered Online Proctoring System MVP

## Project Structure
```
d:\KAIP\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI server
│   │   └── cv_processor.py      # Computer vision logic
│   ├── logs/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   └── utils/
    └── package.json
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd d:\KAIP\backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:

   Before running the server, you must activate the virtual environment. In the same terminal, run:

   ```bash
   # On Windows
   .\venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

4. **Install Dependencies**:

   Once the virtual environment is activated, install the required packages:

   ```bash
   pip install -r requirements.txt
   ```

5. **Start the backend server:**
   ```bash
   python -m app.main
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd d:\KAIP\frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### WebSocket Connection
- **URL:** `ws://localhost:8000/ws`
- **Usage:** Real-time video processing

### HTTP Endpoints
- `GET /` - API status
- `GET /health` - Health check
- `POST /process_frame` - Process single frame
- `POST /reset` - Reset counters
- `GET /stats` - Get current statistics
- `POST /update_thresholds` - Update detection thresholds

## Configuration

### Detection Thresholds (Backend)
- **EAR Threshold:** 0.25 (eyes closed below this value)
- **EAR Consecutive Frames:** 20 (~1 second at 20fps)
- **Gaze Threshold:** 0.15 (distance from center)
- **Gaze Consecutive Frames:** 30 (~1.5 seconds at 20fps)

### Adjustable Parameters
You can update thresholds via API:
```bash
curl -X POST http://localhost:8000/update_thresholds \
  -H "Content-Type: application/json" \
  -d '{"ear_threshold": 0.3, "gaze_threshold": 0.2}'
```

## How It Works

1. **Frontend** captures webcam frames using `react-webcam`
2. Frames are sent to **backend** via WebSocket at ~30fps
3. **Backend** processes frames using MediaPipe Face Mesh
4. **Eye Aspect Ratio (EAR)** calculated for drowsiness detection
5. **Gaze tracking** determines if user looks away from screen
6. Results sent back to frontend for real-time display

## Testing

1. Start both backend and frontend servers
2. Open browser to `http://localhost:3000`
3. Allow camera access when prompted
4. System will start monitoring automatically

## Troubleshooting

### Common Issues

1. **Camera not working:**
   - Check browser permissions
   - Ensure no other app is using the camera
   - Try different browser (Chrome recommended)

2. **Backend connection failed:**
   - Verify backend is running on port 8000
   - Check firewall settings
   - Ensure CORS is properly configured

3. **High CPU usage:**
   - Reduce frame rate in frontend
   - Adjust detection thresholds to be less sensitive
   - Close unnecessary applications

4. **MediaPipe initialization errors:**
   - Ensure all dependencies are installed
   - Try restarting the backend server
   - Check system requirements (OpenCV compatibility)

## Performance Tips

- **Frame Rate:** Send 5-10 frames per second instead of 30 for better performance
- **Resolution:** Use lower resolution (640x480) for faster processing
- **Thresholds:** Adjust based on your specific requirements and lighting conditions

## Security Notes

- This MVP is for demonstration purposes
- In production, add authentication and authorization
- Implement proper session management
- Add encryption for video data transmission
- Consider GDPR compliance for biometric data
