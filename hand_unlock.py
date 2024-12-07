import sys
import json
import cv2
import mediapipe as mp
import time

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)
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
    number = abs(number)  
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


def validate_gesture(stored_gesture, captured_gesture):
    """
    Validate the captured hand gesture against the stored gesture without tolerance.
    """
    return stored_gesture == captured_gesture


def capture_gestures_for_duration(stored_gesture, duration=10):
    """Capture hand gestures continuously for a specified duration."""
    cap = cv2.VideoCapture(0)
    start_time = time.time()
    match_found = False

    while cap.isOpened() and (time.time() - start_time) < duration:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                gesture = [
                    (lm.x, lm.y)
                    for lm in [
                        hand_landmarks.landmark[mp_hands.HandLandmark.WRIST],
                        hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP],
                        hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP],
                    ]
                ]
                normalized_gesture = normalize_gesture(gesture)
                reduced_gesture = reduce_to_first_digits(normalized_gesture)

                if validate_gesture(stored_gesture, reduced_gesture):
                    match_found = True
                    cap.release()
                    cv2.destroyAllWindows()
                    return match_found

                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HandLandmark.WRIST)

        cv2.imshow("Hand Gesture Verification", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    return match_found


if __name__ == "__main__":
    try:
        stored_gesture = json.loads(sys.argv[1])    

        match = capture_gestures_for_duration(stored_gesture, duration=10)

        if match:
            print("success", end="")  
        else:
            print("fail", end="")

    except Exception as e:
        print(f"error: {e}")
        sys.exit(1)
