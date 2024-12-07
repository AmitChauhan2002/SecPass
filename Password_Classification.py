import numpy as np
import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report
import joblib  # for saving the model

# Load dataset (add your dataset path here)
data = pd.read_csv("C:/Users/Amit Chauhan/Downloads/data.csv/data.csv", on_bad_lines='skip')
data = data.dropna(subset=['password'])

# Feature extraction function
def extract_features(password: str):
    features = {
        'length': len(password),
        'uppercase': sum(1 for char in password if char.isupper()),
        'lowercase': sum(1 for char in password if char.islower()),
        'digits': sum(1 for char in password if char.isdigit()),
        'special_chars': sum(1 for char in password if not char.isalnum())
    }
    return features

# Apply feature extraction
features_df = pd.DataFrame([{'strength': data['strength'].iloc[i], **extract_features(data['password'].iloc[i])} for i in range(len(data))])

# Separate features and target
X = features_df[['length', 'uppercase', 'lowercase', 'digits', 'special_chars']]
y = features_df['strength']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define and train models
lr_model = LogisticRegression(max_iter=500)
dt_model = DecisionTreeClassifier()
rf_model = RandomForestClassifier()

# Ensemble model
ensemble_model = VotingClassifier(estimators=[
    ('lr', lr_model),
    ('dt', dt_model),
    ('rf', rf_model)
], voting='soft')

# Train the ensemble model
ensemble_model.fit(X_train, y_train)

# Save the trained model
joblib.dump(ensemble_model, 'password_strength_model.pkl')
print("Model saved successfully!")
