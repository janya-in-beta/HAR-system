"""
College Project: Design and Development of Human Activity Recognition System
Module: activity_detection.py
Description:
    Processes video frames, extracts human pose landmarks via MediaPipe Pose,
    computes geometric/kinematic features, and classifies activities
    (Standing, Sitting, Walking, Running).

Pipeline:
    Webcam Frame -> Person Detection -> Pose Landmarks -> Feature Extraction -> Rule-Based Classification
"""

import math
from collections import deque
import cv2
import mediapipe as mp
import numpy as np


class PoseFeatureExtractor:
    """
    Module 1: Feature Extraction
    Calculates joint angles, body ratios, and motion velocities.
    """

    def __init__(self, history_len: int = 15):
        # Buffer to keep track of recent landmark coordinates for velocity calculation
        self.history_len = history_len
        self.ankle_history = deque(maxlen=history_len)
        self.hip_history = deque(maxlen=history_len)

    @staticmethod
    def calculate_angle(p1, p2, p3):
        """
        Calculates the angle at p2 (vertex) between lines (p1-p2) and (p3-p2) in degrees.
        p1, p2, p3 are tuples or lists of (x, y).
        """
        a = np.array(p1)  # First point
        b = np.array(p2)  # Mid point (vertex)
        c = np.array(p3)  # End point

        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)

        if angle > 180.0:
            angle = 360.0 - angle

        return angle

    def extract_features(self, landmarks, frame_w, frame_h):
        """
        Extract key geometric & kinematic features from MediaPipe Pose landmarks.
        """
        # Landmark indices from MediaPipe Pose:
        # 11: Left Shoulder, 12: Right Shoulder
        # 23: Left Hip,      24: Right Hip
        # 25: Left Knee,     26: Right Knee
        # 27: Left Ankle,    28: Right Ankle

        def get_coords(idx):
            lm = landmarks[idx]
            return (lm.x * frame_w, lm.y * frame_h), lm.visibility

        left_shoulder, v_ls = get_coords(11)
        right_shoulder, v_rs = get_coords(12)
        left_hip, v_lh = get_coords(23)
        right_hip, v_rh = get_coords(24)
        left_knee, v_lk = get_coords(25)
        right_knee, v_rk = get_coords(26)
        left_ankle, v_la = get_coords(27)
        right_ankle, v_ra = get_coords(28)

        # Average left & right sides for robustness
        avg_knee_angle = (
            self.calculate_angle(left_hip, left_knee, left_ankle)
            + self.calculate_angle(right_hip, right_knee, right_ankle)
        ) / 2.0

        avg_hip_angle = (
            self.calculate_angle(left_shoulder, left_hip, left_knee)
            + self.calculate_angle(right_shoulder, right_hip, right_knee)
        ) / 2.0

        # Torso height vs leg length proxy
        torso_height = abs((left_hip[1] + right_hip[1]) / 2.0 - (left_shoulder[1] + right_shoulder[1]) / 2.0)
        leg_length = abs((left_ankle[1] + right_ankle[1]) / 2.0 - (left_hip[1] + right_hip[1]) / 2.0)
        torso_leg_ratio = torso_height / (leg_length + 1e-5)

        # Stride spread: inter-ankle Euclidean distance normalized by torso height
        inter_ankle_dist = math.hypot(right_ankle[0] - left_ankle[0], right_ankle[1] - left_ankle[1])
        stride_spread = inter_ankle_dist / (torso_height + 1e-5)

        # Kinematic velocity (ankle and hip displacement over recent frames)
        mid_ankle = ((left_ankle[0] + right_ankle[0]) / 2.0, (left_ankle[1] + right_ankle[1]) / 2.0)
        mid_hip = ((left_hip[0] + right_hip[0]) / 2.0, (left_hip[1] + right_hip[1]) / 2.0)

        self.ankle_history.append(mid_ankle)
        self.hip_history.append(mid_hip)

        # Calculate average displacement per frame in pixels normalized by torso height
        motion_index = 0.0
        if len(self.ankle_history) >= 4 and torso_height > 10:
            diffs = []
            for i in range(1, len(self.ankle_history)):
                dx = self.ankle_history[i][0] - self.ankle_history[i - 1][0]
                dy = self.ankle_history[i][1] - self.ankle_history[i - 1][1]
                diffs.append(math.sqrt(dx * dx + dy * dy))
            raw_velocity = np.mean(diffs)
            motion_index = raw_velocity / (torso_height * 0.1)  # Normalized motion index

        features = {
            "knee_angle": round(float(avg_knee_angle), 1),
            "hip_angle": round(float(avg_hip_angle), 1),
            "torso_leg_ratio": round(float(torso_leg_ratio), 2),
            "stride_spread": round(float(stride_spread), 2),
            "motion_index": round(float(motion_index), 2),
            "landmarks_detected": True,
        }
        return features


class ActivityClassifier:
    """
    Module 2: Activity Classification
    Classifies human activities based on extracted geometric & kinematic features.
    Can be replaced or extended with a machine-learning model (e.g., Random Forest or SVM).
    """

    def __init__(self):
        # Activity classes
        self.CLASSES = ["Standing", "Sitting", "Walking", "Running"]

    def classify(self, features: dict, is_static_image: bool = False):
        """
        Decision rule tree:
        1. Sitting:
           Knee angle is bent (< 138°) and hip angle is bent (< 148°).
        2. Static Image Analysis:
           - Stride spread >= 0.80 -> Running
           - Stride spread >= 0.35 -> Walking
           - Stride spread < 0.35 -> Standing
        3. Video Stream Analysis:
           - Running: motion_index >= 2.3
           - Walking: 0.75 <= motion_index < 2.3
           - Standing: motion_index < 0.75 and knee extension
        """
        if not features or not features.get("landmarks_detected", False):
            return {"activity": "No Person Detected", "confidence": 0.0, "reason": "No landmarks visible"}

        knee_angle = features.get("knee_angle", 180.0)
        hip_angle = features.get("hip_angle", 180.0)
        motion = features.get("motion_index", 0.0)
        stride_spread = features.get("stride_spread", 0.0)

        # 1. Check for Sitting (applies to both photos and video)
        if knee_angle < 138.0 and hip_angle < 148.0:
            bend_factor = (140.0 - knee_angle) / 50.0
            confidence = min(0.96, max(0.72, 0.78 + bend_factor * 0.18))
            return {
                "activity": "Sitting",
                "confidence": round(confidence * 100, 1),
                "reason": f"Knee flexed ({knee_angle}°) & Hip seated ({hip_angle}°)",
            }

        # 2. Static Image Pathway (Using spatial stride spread)
        if is_static_image:
            if stride_spread >= 0.80:
                conf = min(0.95, 0.80 + (stride_spread - 0.80) * 0.15)
                return {
                    "activity": "Running",
                    "confidence": round(conf * 100, 1),
                    "reason": f"Wide dynamic stride spread in photo ({stride_spread}× torso)",
                }
            if stride_spread >= 0.35:
                return {
                    "activity": "Walking",
                    "confidence": 88.0,
                    "reason": f"Moderate ambulatory foot separation in photo ({stride_spread}× torso)",
                }
            knee_straightness = max(0.0, (knee_angle - 140.0) / 40.0)
            return {
                "activity": "Standing",
                "confidence": round((0.82 + knee_straightness * 0.12) * 100, 1),
                "reason": f"Upright vertical stance with narrow foot base ({stride_spread}× torso)",
            }

        # 3. Video Stream Pathway (Using temporal displacement velocity)
        if motion >= 2.3:
            conf = min(0.94, 0.70 + (motion - 2.3) * 0.08)
            return {
                "activity": "Running",
                "confidence": round(conf * 100, 1),
                "reason": f"High kinetic velocity index ({motion})",
            }

        if motion >= 0.75:
            conf = min(0.92, 0.68 + (motion - 0.75) * 0.12)
            return {
                "activity": "Walking",
                "confidence": round(conf * 100, 1),
                "reason": f"Moderate rhythmic foot displacement ({motion})",
            }

        knee_straightness = max(0.0, (knee_angle - 140.0) / 40.0)
        stillness = max(0.0, (0.75 - motion) / 0.75)
        conf = 0.72 + (knee_straightness * 0.15) + (stillness * 0.10)
        return {
            "activity": "Standing",
            "confidence": round(min(0.95, conf) * 100, 1),
            "reason": f"Upright extension (Knee: {knee_angle}°) with low velocity ({motion})",
        }


class HumanActivityRecognitionSystem:
    """
    Main Computer Vision Pipeline:
    Webcam / Video -> MediaPipe Pose -> Feature Extractor -> Classifier
    """

    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=1,
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.feature_extractor = PoseFeatureExtractor()
        self.classifier = ActivityClassifier()

    def process_frame(self, frame):
        """
        Process a single BGR OpenCV frame.
        Returns:
            annotated_frame: Frame with drawn skeleton landmarks and activity banner.
            results_dict: Dictionary with detection metadata, activity, and confidence.
        """
        h, w, _ = frame.shape
        # Convert BGR image to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False

        results = self.pose.process(rgb_frame)

        rgb_frame.flags.writeable = True
        annotated_frame = frame.copy()

        if results.pose_landmarks:
            # Draw pose landmarks
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
            )

            # Extract features
            features = self.feature_extractor.extract_features(results.pose_landmarks.landmark, w, h)
            # Classify
            classification = self.classifier.classify(features)

            # Annotate with banner
            activity_text = f"{classification['activity']} ({classification['confidence']}%)"
            cv2.putText(
                annotated_frame,
                activity_text,
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

            return annotated_frame, {
                "person_detected": True,
                "activity": classification["activity"],
                "confidence": classification["confidence"],
                "reason": classification["reason"],
                "features": features,
            }
        else:
            cv2.putText(
                annotated_frame,
                "No Person Detected",
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )
            return annotated_frame, {
                "person_detected": False,
                "activity": "None",
                "confidence": 0.0,
                "reason": "Looking for human pose landmarks...",
                "features": {},
            }

    def process_image(self, image_path_or_array):
        """
        Process a static input image (file path or numpy array).
        Extracts pose landmarks, measures joint angles and spatial stride spread,
        and outputs the predicted activity.
        """
        if isinstance(image_path_or_array, str):
            image = cv2.imread(image_path_or_array)
            if image is None:
                raise ValueError(f"Could not load image from path: {image_path_or_array}")
        else:
            image = image_path_or_array

        h, w, _ = image.shape
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_image)

        annotated_image = image.copy()
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                annotated_image,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
            )
            features = self.feature_extractor.extract_features(results.pose_landmarks.landmark, w, h)
            # Classify using static image heuristics (stride spread)
            classification = self.classifier.classify(features, is_static_image=True)

            activity_text = f"{classification['activity']} ({classification['confidence']}%)"
            cv2.putText(
                annotated_image,
                activity_text,
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

            return annotated_image, {
                "person_detected": True,
                "activity": classification["activity"],
                "confidence": classification["confidence"],
                "reason": classification["reason"],
                "features": features,
            }
        else:
            cv2.putText(
                annotated_image,
                "No Person Detected",
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )
            return annotated_image, {
                "person_detected": False,
                "activity": "None",
                "confidence": 0.0,
                "reason": "Could not identify human pose skeleton in the image",
                "features": {},
            }

