"""
Real-Time Heart Hands Detection Script
Uses trained SVM model to detect heart gesture made with two hands.
Press Q to quit.
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import joblib
import os
import urllib.request
from collections import deque

# File paths
MODEL_FILE = "heart_hands_svm.joblib"
SCALER_FILE = "heart_hands_scaler.joblib"
HAND_MODEL_PATH = "hand_landmarker.task"
HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

# Detection parameters
SMOOTHING_WINDOW = 10
HEART_THRESHOLD = 0.80

def download_model():
    """Download the hand landmarker model if not present."""
    if not os.path.exists(HAND_MODEL_PATH):
        print(f"Downloading hand landmarker model...")
        urllib.request.urlretrieve(HAND_MODEL_URL, HAND_MODEL_PATH)
        print("Model downloaded successfully!")

def create_detector():
    """Create and return the hand landmarker detector."""
    download_model()
    base_options = python.BaseOptions(model_asset_path=HAND_MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )
    return vision.HandLandmarker.create_from_options(options)

def normalize_landmarks(hand_landmarks):
    """
    Normalize landmarks:
    - Translate so wrist (landmark 0) is at origin
    - Scale by wrist to middle finger MCP distance
    """
    landmarks = []
    for lm in hand_landmarks:
        landmarks.append([lm.x, lm.y])
    landmarks = np.array(landmarks)
    
    # Wrist is landmark 0
    wrist = landmarks[0]
    
    # Middle finger MCP is landmark 9
    middle_mcp = landmarks[9]
    
    # Calculate scale factor (distance from wrist to middle MCP)
    scale = np.linalg.norm(middle_mcp - wrist)
    if scale < 1e-6:
        scale = 1e-6  # Avoid division by zero
    
    # Translate to origin (wrist) and scale
    normalized = (landmarks - wrist) / scale
    
    return normalized.flatten()

def draw_landmarks(frame, hand_landmarks_list):
    """Draw hand landmarks on the frame."""
    h, w = frame.shape[:2]
    
    # Landmark connections for hand
    HAND_CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),  # thumb
        (0, 5), (5, 6), (6, 7), (7, 8),  # index
        (0, 9), (9, 10), (10, 11), (11, 12),  # middle
        (0, 13), (13, 14), (14, 15), (15, 16),  # ring
        (0, 17), (17, 18), (18, 19), (19, 20),  # pinky
        (5, 9), (9, 13), (13, 17)  # palm
    ]
    
    for hand_landmarks in hand_landmarks_list:
        # Draw connections
        for connection in HAND_CONNECTIONS:
            start_idx, end_idx = connection
            start = hand_landmarks[start_idx]
            end = hand_landmarks[end_idx]
            start_point = (int(start.x * w), int(start.y * h))
            end_point = (int(end.x * w), int(end.y * h))
            cv2.line(frame, start_point, end_point, (255, 255, 255), 2)
        
        # Draw landmarks
        for lm in hand_landmarks:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx, cy), 4, (0, 255, 0), -1)

def extract_features(hand_landmarks_list, handedness_list):
    """
    Extract and combine features from both hands.
    Returns None if fewer than 2 hands detected.
    """
    if not hand_landmarks_list or len(hand_landmarks_list) < 2:
        return None
    
    # Get handedness to sort hands (Left first, then Right)
    hand_data = []
    for idx, (hand_landmarks, handedness) in enumerate(
        zip(hand_landmarks_list, handedness_list)
    ):
        hand_type = handedness[0].category_name  # "Left" or "Right"
        normalized = normalize_landmarks(hand_landmarks)
        hand_data.append((hand_type, normalized))
    
    # Sort: Left hand first, Right hand second
    hand_data.sort(key=lambda x: (0 if x[0] == "Left" else 1))
    
    # Combine features from both hands
    features = np.concatenate([h[1] for h in hand_data])
    
    return features

def load_model():
    """Load trained model and scaler."""
    if not os.path.exists(MODEL_FILE):
        print(f"Error: Model file '{MODEL_FILE}' not found!")
        print("Please run train_model.py first to train the model.")
        return None, None
    
    if not os.path.exists(SCALER_FILE):
        print(f"Error: Scaler file '{SCALER_FILE}' not found!")
        print("Please run train_model.py first to train the model.")
        return None, None
    
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    
    return model, scaler

def main():
    print("=" * 50)
    print("Heart Hands Real-Time Detector")
    print("=" * 50)
    print("Press Q to quit")
    print("=" * 50)
    
    # Load model
    print("\nLoading model...")
    model, scaler = load_model()
    
    if model is None:
        return
    
    print("Model loaded successfully!")
    
    # Create hand detector
    detector = create_detector()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Cannot open webcam")
        return
    
    # Smoothing buffer for predictions
    prediction_buffer = deque(maxlen=SMOOTHING_WINDOW)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Cannot read frame")
            break
        
        # Flip frame horizontally for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        results = detector.detect(mp_image)
        
        # Draw hand landmarks
        if results.hand_landmarks:
            draw_landmarks(frame, results.hand_landmarks)
        
        # Extract features
        features = extract_features(results.hand_landmarks, results.handedness)
        
        if features is not None:
            # Scale features and predict
            features_scaled = scaler.transform([features])
            probability = model.predict_proba(features_scaled)[0][1]
            
            # Add to smoothing buffer
            prediction_buffer.append(probability)
            
            # Calculate smoothed probability
            avg_probability = np.mean(prediction_buffer)
            
            # Determine if heart is detected
            is_heart = avg_probability >= HEART_THRESHOLD
            
            # Display result
            if is_heart:
                label = "HEART"
                # Draw heart emoji using Unicode (may not render in all systems)
                display_text = "HEART <3"
                color = (0, 0, 255)  # Red for heart
                bg_color = (255, 255, 255)
            else:
                display_text = "NO HEART"
                color = (100, 100, 100)
                bg_color = (200, 200, 200)
            
            # Draw background rectangle for text
            text_size = cv2.getTextSize(display_text, cv2.FONT_HERSHEY_SIMPLEX, 2, 4)[0]
            text_x = (frame.shape[1] - text_size[0]) // 2
            text_y = 80
            
            cv2.rectangle(frame, 
                         (text_x - 20, text_y - text_size[1] - 20),
                         (text_x + text_size[0] + 20, text_y + 20),
                         bg_color, -1)
            
            # Draw main text
            cv2.putText(frame, display_text, (text_x, text_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2, color, 4)
            
            # Draw probability bar
            bar_width = 300
            bar_height = 30
            bar_x = (frame.shape[1] - bar_width) // 2
            bar_y = frame.shape[0] - 80
            
            # Background bar
            cv2.rectangle(frame, (bar_x, bar_y), 
                         (bar_x + bar_width, bar_y + bar_height),
                         (100, 100, 100), -1)
            
            # Probability fill
            fill_width = int(bar_width * avg_probability)
            bar_color = (0, 255, 0) if avg_probability >= HEART_THRESHOLD else (0, 165, 255)
            cv2.rectangle(frame, (bar_x, bar_y),
                         (bar_x + fill_width, bar_y + bar_height),
                         bar_color, -1)
            
            # Bar border
            cv2.rectangle(frame, (bar_x, bar_y),
                         (bar_x + bar_width, bar_y + bar_height),
                         (255, 255, 255), 2)
            
            # Probability text
            prob_text = f"Confidence: {avg_probability:.1%}"
            cv2.putText(frame, prob_text, 
                       (bar_x, bar_y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Threshold line
            threshold_x = bar_x + int(bar_width * HEART_THRESHOLD)
            cv2.line(frame, (threshold_x, bar_y - 5),
                    (threshold_x, bar_y + bar_height + 5),
                    (0, 0, 255), 2)
            
        else:
            # Not enough hands detected
            prediction_buffer.clear()
            
            num_hands = len(results.hand_landmarks) if results.hand_landmarks else 0
            display_text = "NO HEART"
            info_text = f"Need 2 hands (detected: {num_hands})"
            
            # Draw main text
            text_size = cv2.getTextSize(display_text, cv2.FONT_HERSHEY_SIMPLEX, 2, 4)[0]
            text_x = (frame.shape[1] - text_size[0]) // 2
            text_y = 80
            
            cv2.rectangle(frame,
                         (text_x - 20, text_y - text_size[1] - 20),
                         (text_x + text_size[0] + 20, text_y + 20),
                         (200, 200, 200), -1)
            
            cv2.putText(frame, display_text, (text_x, text_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 2, (100, 100, 100), 4)
            
            # Info text
            info_size = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
            info_x = (frame.shape[1] - info_size[0]) // 2
            cv2.putText(frame, info_text, (info_x, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # Instructions
        cv2.putText(frame, "Press Q to quit", (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
        
        # Show frame
        cv2.imshow("Heart Hands Detector", frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("\nDetector closed.")

if __name__ == "__main__":
    main()
