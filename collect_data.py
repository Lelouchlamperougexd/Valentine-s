"""
Data Collection Script for Heart Hands Gesture Recognition
Press H to save frame as heart gesture (label 1)
Press N to save frame as not-heart gesture (label 0)
Press Q to quit
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import csv
import os
import urllib.request
import time

# Model file path
MODEL_PATH = "hand_landmarker.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

# CSV file path
CSV_FILE = "heart_hands_dataset.csv"

def download_model():
    """Download the hand landmarker model if not present."""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading hand landmarker model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Model downloaded successfully!")

def create_detector():
    """Create and return the hand landmarker detector."""
    download_model()
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.6,
        min_tracking_confidence=0.4
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

def init_csv():
    """Initialize CSV file with header if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            # 21 landmarks * 2 coords * 2 hands = 84 features + 1 label
            header = [f"feature_{i}" for i in range(84)] + ["label"]
            writer.writerow(header)

def save_sample(features, label):
    """Save a feature vector with its label to CSV."""
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        row = list(features) + [label]
        writer.writerow(row)

def main():
    # Initialize detector and CSV
    detector = create_detector()
    init_csv()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Cannot open webcam")
        return
    
    print("=" * 50)
    print("Heart Hands Data Collection")
    print("=" * 50)
    print("Controls:")
    print("  H - Save as HEART gesture (label 1)")
    print("  N - Save as NOT-HEART gesture (label 0)")
    print("  A - Label AUTO sample as HEART (label 1)")
    print("  D - Label AUTO sample as NOT-HEART gesture (label 0)")
    print("  Q - Quit")
    print("=" * 50)
    
    heart_count = 0
    not_heart_count = 0
    two_hands_start_time = None
    pending_sample = False
    captured_features = None
    auto_sample_status = "Show 2 hands to start auto-capture"
    
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
        
        # Auto-capture logic: require 2 hands for 3 seconds
        if features is not None:
            if not pending_sample:
                if two_hands_start_time is None:
                    two_hands_start_time = time.time()
                elapsed = time.time() - two_hands_start_time
                if elapsed >= 3.0 and not pending_sample:
                    captured_features = features.copy()
                    pending_sample = True
                    auto_sample_status = "Sample captured! Press A=Heart, D=Not-Heart"
                else:
                    remaining = max(0.0, 3.0 - elapsed)
                    auto_sample_status = f"Hold both hands steady: {remaining:.1f}s"
        else:
            if not pending_sample:
                two_hands_start_time = None
                auto_sample_status = "Show 2 hands to start auto-capture"
        
        # Display status
        if features is not None:
            status = "2 HANDS DETECTED - Ready to capture"
            color = (0, 255, 0)
        else:
            num_hands = len(results.hand_landmarks) if results.hand_landmarks else 0
            status = f"Need 2 hands (detected: {num_hands})"
            color = (0, 0, 255)
        
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, auto_sample_status, (10, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 255, 200), 2)
        cv2.putText(frame, f"Heart samples: {heart_count}", (10, 90), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"Not-heart samples: {not_heart_count}", (10, 120), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "H/N: instant | A/D: label auto | Q: Quit", 
                (10, frame.shape[0] - 20), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
        
        cv2.imshow("Heart Hands Data Collection", frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q') or key == ord('Q'):
            break
        elif key == ord('h') or key == ord('H'):
            if features is not None:
                save_sample(features, 1)
                heart_count += 1
                print(f"Saved HEART sample #{heart_count}")
            else:
                print("Cannot save: Need 2 hands!")
        elif key == ord('n') or key == ord('N'):
            if features is not None:
                save_sample(features, 0)
                not_heart_count += 1
                print(f"Saved NOT-HEART sample #{not_heart_count}")
            else:
                print("Cannot save: Need 2 hands!")
        elif key == ord('a') or key == ord('A'):
            if pending_sample and captured_features is not None:
                save_sample(captured_features, 1)
                heart_count += 1
                print(f"Saved AUTO HEART sample #{heart_count}")
                pending_sample = False
                captured_features = None
                two_hands_start_time = None
                auto_sample_status = "Last sample saved as HEART"
            else:
                print("No auto-captured sample to label.")
        elif key == ord('d') or key == ord('D'):
            if pending_sample and captured_features is not None:
                save_sample(captured_features, 0)
                not_heart_count += 1
                print(f"Saved AUTO NOT-HEART sample #{not_heart_count}")
                pending_sample = False
                captured_features = None
                two_hands_start_time = None
                auto_sample_status = "Last sample saved as NOT-HEART"
            else:
                print("No auto-captured sample to label.")
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n" + "=" * 50)
    print(f"Data collection complete!")
    print(f"Total HEART samples: {heart_count}")
    print(f"Total NOT-HEART samples: {not_heart_count}")
    print(f"Data saved to: {CSV_FILE}")
    print("=" * 50)

if __name__ == "__main__":
    main()
