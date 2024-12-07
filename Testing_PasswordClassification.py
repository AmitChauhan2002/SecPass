import joblib
import pandas as pd

# Define the feature extraction function
def extract_features(password: str):
    features = {
        'length': len(password),
        'uppercase': sum(1 for char in password if char.isupper()),
        'lowercase': sum(1 for char in password if char.islower()),
        'digits': sum(1 for char in password if char.isdigit()),
        'special_chars': sum(1 for char in password if not char.isalnum())
    }
    return features

# Load the model
model = joblib.load('password_strength_model.pkl')

# Function to evaluate password strength in real-time
def evaluate_password_strength(password: str):
    features = extract_features(password)
    features_df = pd.DataFrame([features])  # Convert to DataFrame for prediction
    strength = model.predict(features_df)[0]
    return strength

# Example Usage
password = "My$ecureP@ss123"
strength = evaluate_password_strength(password)
strength_labels = {0: "Weak", 1: "Mediocre", 2: "Strong"}
print(f"The password strength is: {strength_labels[strength]}")
