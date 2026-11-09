"""
College Project: Human Activity Recognition System
Script: test_image.py
Usage:
    python test_image.py sample.jpg
Description:
    Loads a static human image, processes pose landmarks using MediaPipe Pose,
    extracts spatial features (knee flexion angle and normalized stride spread),
    and outputs the identified human activity with confidence score.
"""

import sys
import os
import cv2
from activity_detection import HumanActivityRecognitionSystem

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_image.py <path_to_image>")
        print("Example: python test_image.py test_runner.jpg")
        return

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        return

    print(f"[*] Initializing Human Activity Recognition System...")
    har_system = HumanActivityRecognitionSystem()

    print(f"[*] Processing image: {image_path}")
    try:
        annotated_img, results = har_system.process_image(image_path)
    except Exception as e:
        print(f"[!] Error processing image: {e}")
        return

    print("\n" + "=" * 55)
    print("      HUMAN ACTIVITY RECOGNITION (IMAGE RESULT)")
    print("=" * 55)
    print(f" Person Detected : {results['person_detected']}")
    print(f" Detected Activity: {results['activity']}")
    print(f" Confidence Score : {results['confidence']}%")
    print(f" Decision Reason  : {results['reason']}")
    
    if results.get("features"):
        feats = results["features"]
        print("-" * 55)
        print(" Extracted Kinematic Features:")
        print(f"  • Avg Knee Flexion Angle : {feats.get('knee_angle')}°")
        print(f"  • Avg Hip Flexion Angle  : {feats.get('hip_angle')}°")
        print(f"  • Normalized Stride Spread: {feats.get('stride_spread')}x torso")
        print(f"  • Torso-to-Leg Ratio     : {feats.get('torso_leg_ratio')}")
    print("=" * 55)

    output_path = "output_classified.jpg"
    cv2.imwrite(output_path, annotated_img)
    print(f"\n[+] Annotated image saved successfully to '{output_path}'")

if __name__ == "__main__":
    main()
