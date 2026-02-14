"""
Model Training Script for Heart Hands Gesture Recognition
Trains an SVM classifier on collected landmark data.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import joblib
import os

# File paths
CSV_FILE = "heart_hands_dataset.csv"
MODEL_FILE = "heart_hands_svm.joblib"
SCALER_FILE = "heart_hands_scaler.joblib"

def load_data():
    """Load dataset from CSV file."""
    if not os.path.exists(CSV_FILE):
        print(f"Error: Dataset file '{CSV_FILE}' not found!")
        print("Please run collect_data.py first to collect training data.")
        return None, None
    
    df = pd.read_csv(CSV_FILE)
    
    if len(df) == 0:
        print("Error: Dataset is empty!")
        return None, None
    
    # Separate features and labels
    X = df.drop('label', axis=1).values
    y = df['label'].values
    
    return X, y

def train_model(X, y):
    """Train SVM classifier with RBF kernel."""
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    print(f"Heart samples in training: {sum(y_train == 1)}")
    print(f"Not-heart samples in training: {sum(y_train == 0)}")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train SVM with RBF kernel and probability enabled
    print("\nTraining SVM classifier...")
    svm_model = SVC(
        kernel='rbf',
        probability=True,
        C=1.0,
        gamma='scale',
        random_state=42
    )
    svm_model.fit(X_train_scaled, y_train)
    
    # Evaluate on test set
    y_pred = svm_model.predict(X_test_scaled)
    y_prob = svm_model.predict_proba(X_test_scaled)[:, 1]
    
    return svm_model, scaler, X_test_scaled, y_test, y_pred, y_prob

def evaluate_model(y_test, y_pred):
    """Print evaluation metrics."""
    print("\n" + "=" * 50)
    print("MODEL EVALUATION")
    print("=" * 50)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"\nAccuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=['Not Heart', 'Heart']))
    
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  TN: {cm[0][0]}  FP: {cm[0][1]}")
    print(f"  FN: {cm[1][0]}  TP: {cm[1][1]}")
    
    return accuracy, precision, recall, f1

def save_model(model, scaler):
    """Save trained model and scaler to files."""
    joblib.dump(model, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)
    print(f"\nModel saved to: {MODEL_FILE}")
    print(f"Scaler saved to: {SCALER_FILE}")

def main():
    print("=" * 50)
    print("Heart Hands Gesture Model Training")
    print("=" * 50)
    
    # Load data
    print("\nLoading dataset...")
    X, y = load_data()
    
    if X is None:
        return
    
    print(f"Total samples: {len(X)}")
    print(f"Heart samples: {sum(y == 1)}")
    print(f"Not-heart samples: {sum(y == 0)}")
    
    # Check if we have enough data
    if len(X) < 20:
        print("\nWarning: Very small dataset. Consider collecting more samples.")
    
    if sum(y == 1) < 5 or sum(y == 0) < 5:
        print("\nError: Need at least 5 samples of each class!")
        return
    
    # Train model
    model, scaler, X_test, y_test, y_pred, y_prob = train_model(X, y)
    
    # Evaluate
    evaluate_model(y_test, y_pred)
    
    # Save model
    save_model(model, scaler)
    
    print("\n" + "=" * 50)
    print("Training complete!")
    print("You can now run detect_realtime.py for inference.")
    print("=" * 50)

if __name__ == "__main__":
    main()
