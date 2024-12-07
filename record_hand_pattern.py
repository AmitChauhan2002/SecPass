import os
import sys
import cv2
import mediapipe as mp
import json

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

def normalize_gesture(gesture):
    """Normalize the gesture based on the wrist as the reference point."""
    if not gesture or len(gesture) < 2:
        return []

    ref_x, ref_y = gesture[0] 
    normalized_gesture = [(p[0] - ref_x, p[1] - ref_y) for p in gesture]

    max_distance = max((x**2 + y**2)**0.5 for x, y in normalized_gesture)
    if max_distance > 0:
        normalized_gesture = [(x / max_distance, y / max_distance) for x, y in normalized_gesture]

    return normalized_gesture

def extract_first_decimal_digit(number):
    """Extract the first digit after the decimal point of a float."""
    number = abs(number)  # Ensure positive
    first_decimal_digit = int(abs(number) * 10) % 10
    return first_decimal_digit


def reduce_to_first_digits(gesture):
    """
    Reduce the gesture to only the first digit after the decimal point
    for each coordinate.
    """
    return [
        [extract_first_decimal_digit(coord[0]), extract_first_decimal_digit(coord[1])]
        for coord in gesture
    ]

class HandPatternRecorder:
    def __init__(self):
        self.hands = mp_hands.Hands(
            model_complexity=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )

    def detect_pattern(self, hand_landmarks):
        """Extract and normalize landmarks."""
        try:
            fingertips = [
                hand_landmarks.landmark[mp_hands.HandLandmark.WRIST],
                hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP],
                hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP],
            ]
            gesture = [(pt.x, pt.y) for pt in fingertips]
            normalized = normalize_gesture(gesture)
            return reduce_to_first_digits(normalized)
        except IndexError:
            return None

    def record_pattern(self):
        """Capture video from the webcam to record the hand pattern."""
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Failed to open webcam.", file=sys.stderr)
            return None

        steady_counter = 0
        previous_pattern = None
        final_pattern = None

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.hands.process(rgb_frame)

            if result.multi_hand_landmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    detected_pattern = self.detect_pattern(hand_landmarks)

                    if detected_pattern:
                        if previous_pattern and self.is_similar_pattern(detected_pattern, previous_pattern):
                            steady_counter += 1
                        else:
                            steady_counter = 0

                        if steady_counter >= 60: 
                            final_pattern = detected_pattern
                            cap.release()
                            cv2.destroyAllWindows() 
                            return final_pattern

                        previous_pattern = detected_pattern

            cv2.imshow("Recording Hand Pattern", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
        return None

    def is_similar_pattern(self, pattern1, pattern2):
        """Check if two patterns are identical."""
        return pattern1 == pattern2

if __name__ == "__main__":
    recorder = HandPatternRecorder()
    pattern = recorder.record_pattern()
    if pattern:
        print(pattern)  
    else:
        print("error")  
