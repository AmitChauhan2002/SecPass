from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load the pre-trained model
model = joblib.load('password_strength_model.pkl')  # Ensure this file path is correct

def extract_features(password: str):
    features = {
        'length': len(password),
        'uppercase': sum(1 for char in password if char.isupper()),
        'lowercase': sum(1 for char in password if char.islower()),
        'digits': sum(1 for char in password if char.isdigit()),
        'special_chars': sum(1 for char in password if not char.isalnum())
    }
    return features

@app.route('/evaluate_password', methods=['POST'])
def evaluate_password():
    data = request.json
    password = data.get("password")
    if password:
        features = extract_features(password)
        features_df = pd.DataFrame([features])
        strength = model.predict(features_df)[0]
        strength_labels = {0: "Weak", 1: "Mediocre", 2: "Strong"}
        return jsonify({"strength": strength_labels[strength]})
    else:
        return jsonify({"error": "Password not provided"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)  # Changed port to 5001
