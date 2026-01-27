from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import cv2
import numpy as np
import base64
import json
import logging
from datetime import datetime
import asyncio
from typing import Dict, Any
from .cv_processor import ProctoringSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Only console logging
    ]
)

app = FastAPI(title="AI Proctoring System", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global proctoring system instance
proctoring_system = ProctoringSystem(
    ear_threshold=0.23,
    gaze_away_duration=5,
    drowsiness_duration=10,
    head_yaw_threshold=25,
    head_pitch_threshold=20
)

# Connection manager for WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection already closed
                pass

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "AI Proctoring System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/process_frame")
async def process_frame_endpoint(frame_data: Dict[str, Any]):
    """
    Process a single frame via HTTP POST
    Useful for testing or when WebSocket is not available
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(frame_data["image"])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"error": "Invalid image data"}
        
        # Process frame
        result = proctoring_system.process_frame(frame)
        
        # Log violation if detected
        if result.get("violation"):
            logging.warning(f"Violation detected: {result['violation']} at {result['timestamp']}")
        
        return result
        
    except Exception as e:
        logging.error(f"Error processing frame: {str(e)}")
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected.")
    try:
        while not proctoring_system.test_terminated:
            data = await websocket.receive_bytes()
            frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            
            # Process the frame and get events
            events = proctoring_system.process_frame(frame)
            
            # Send each event to the client
            for event in events:
                await websocket.send_json(event)
                if event.get('type') == 'test_terminated':
                    break
            
            
    except WebSocketDisconnect:
        print("Client disconnected.")
        proctoring_system.reset_state() # Reset state on disconnect
    except Exception as e:
        print(f"An error occurred in WebSocket: {e}")
        proctoring_system.reset_state()


@app.post("/reset_proctoring")
def reset_proctoring_state():
    """Resets the entire state of the proctoring system."""
    proctoring_system.reset_state()
    return {"message": "Proctoring state has been reset."}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
