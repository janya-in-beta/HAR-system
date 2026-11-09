import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { PoseLandmark } from '../types';

let poseLandmarkerInstance: PoseLandmarker | null = null;
let imagePoseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let isInitializingImage = false;

export async function initPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarkerInstance) return poseLandmarkerInstance;
  if (isInitializing) return null;

  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return poseLandmarkerInstance;
  } catch (error) {
    console.warn('MediaPipe GPU load fallback to CPU or simulation:', error);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      return poseLandmarkerInstance;
    } catch (e2) {
      console.warn('Could not initialize MediaPipe PoseLandmarker model remotely:', e2);
      return null;
    }
  } finally {
    isInitializing = false;
  }
}

export async function detectPoseInImage(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<PoseLandmark[] | null> {
  if (!imagePoseLandmarkerInstance && !isInitializingImage) {
    isInitializingImage = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      imagePoseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.35,
      });
    } catch {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        imagePoseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
        });
      } catch (err) {
        console.warn('Could not initialize MediaPipe Image PoseLandmarker:', err);
      }
    } finally {
      isInitializingImage = false;
    }
  }

  if (imagePoseLandmarkerInstance) {
    try {
      const result = imagePoseLandmarkerInstance.detect(imageSource);
      if (result.landmarks && result.landmarks.length > 0) {
        return result.landmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 1,
        }));
      }
    } catch (err) {
      console.warn('Error detecting pose in image:', err);
    }
  }
  return null;
}

export function detectPoseInVideo(
  videoElement: HTMLVideoElement,
  timestampMs: number
): PoseLandmark[] | null {
  if (!poseLandmarkerInstance || videoElement.readyState < 2) {
    return null;
  }

  try {
    const result = poseLandmarkerInstance.detectForVideo(videoElement, timestampMs);
    if (result.landmarks && result.landmarks.length > 0) {
      return result.landmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 1,
      }));
    }
  } catch (err) {
    // Graceful frame skip
  }
  return null;
}

/**
 * Procedural Kinematic Simulator:
 * Generates exact 33-landmark MediaPipe-compliant coordinates for test activities:
 * Standing, Sitting, Walking, Running.
 * Perfect for offline viva demonstration, testing without camera, or controlled validation.
 */
export function generateSyntheticPose(
  activity: 'Standing' | 'Sitting' | 'Walking' | 'Running',
  tSec: number
): PoseLandmark[] {
  const landmarks: PoseLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  // Base center point in normalized coords [0, 1]
  let midHipX = 0.5;
  let midHipY = 0.55;

  if (activity === 'Standing') {
    // Upright stance with subtle breathing and sway
    const sway = Math.sin(tSec * 1.2) * 0.003;
    midHipX += sway;
    midHipY = 0.52;

    // Head
    landmarks[0] = { x: midHipX, y: 0.16, visibility: 0.99 }; // Nose
    landmarks[11] = { x: midHipX - 0.09, y: 0.28, visibility: 0.99 }; // L Shoulder
    landmarks[12] = { x: midHipX + 0.09, y: 0.28, visibility: 0.99 }; // R Shoulder
    landmarks[13] = { x: midHipX - 0.12, y: 0.42, visibility: 0.95 }; // L Elbow
    landmarks[14] = { x: midHipX + 0.12, y: 0.42, visibility: 0.95 }; // R Elbow
    landmarks[15] = { x: midHipX - 0.13, y: 0.54, visibility: 0.95 }; // L Wrist
    landmarks[16] = { x: midHipX + 0.13, y: 0.54, visibility: 0.95 }; // R Wrist

    // Hips
    landmarks[23] = { x: midHipX - 0.06, y: 0.52, visibility: 0.99 }; // L Hip
    landmarks[24] = { x: midHipX + 0.06, y: 0.52, visibility: 0.99 }; // R Hip

    // Knees (Straight, angle ~175 deg)
    landmarks[25] = { x: midHipX - 0.06, y: 0.70, visibility: 0.98 }; // L Knee
    landmarks[26] = { x: midHipX + 0.06, y: 0.70, visibility: 0.98 }; // R Knee

    // Ankles
    landmarks[27] = { x: midHipX - 0.06, y: 0.88, visibility: 0.98 }; // L Ankle
    landmarks[28] = { x: midHipX + 0.06, y: 0.88, visibility: 0.98 }; // R Ankle
  } else if (activity === 'Sitting') {
    // Seated posture: lower hips, knees bent ~90 deg, torso upright or slightly leaning
    midHipX = 0.48;
    midHipY = 0.62;

    landmarks[0] = { x: midHipX, y: 0.28, visibility: 0.99 }; // Nose
    landmarks[11] = { x: midHipX - 0.08, y: 0.38, visibility: 0.99 }; // L Shoulder
    landmarks[12] = { x: midHipX + 0.08, y: 0.38, visibility: 0.99 }; // R Shoulder
    landmarks[13] = { x: midHipX - 0.12, y: 0.50, visibility: 0.95 }; // L Elbow
    landmarks[14] = { x: midHipX + 0.12, y: 0.50, visibility: 0.95 }; // R Elbow
    landmarks[15] = { x: midHipX - 0.05, y: 0.59, visibility: 0.95 }; // L Wrist on thigh
    landmarks[16] = { x: midHipX + 0.05, y: 0.59, visibility: 0.95 }; // R Wrist on thigh

    // Hips seated
    landmarks[23] = { x: midHipX - 0.06, y: 0.62, visibility: 0.99 }; // L Hip
    landmarks[24] = { x: midHipX + 0.06, y: 0.62, visibility: 0.99 }; // R Hip

    // Knees forward horizontally (Angle ~95-105 deg)
    landmarks[25] = { x: midHipX + 0.16, y: 0.66, visibility: 0.98 }; // L Knee
    landmarks[26] = { x: midHipX + 0.18, y: 0.66, visibility: 0.98 }; // R Knee

    // Ankles under knees
    landmarks[27] = { x: midHipX + 0.16, y: 0.88, visibility: 0.98 }; // L Ankle
    landmarks[28] = { x: midHipX + 0.18, y: 0.88, visibility: 0.98 }; // R Ankle
  } else if (activity === 'Walking') {
    // Bipedal gait cycle: frequency ~1.2 Hz
    const freq = 1.2;
    const phase = tSec * freq * 2 * Math.PI;
    const legSwing = Math.sin(phase) * 0.12;
    const legLift = Math.abs(Math.sin(phase)) * 0.04;
    const armSwing = Math.cos(phase) * 0.10;

    midHipX = 0.5 + Math.sin(tSec * 0.5) * 0.04;
    midHipY = 0.52 + Math.abs(Math.sin(phase * 2)) * 0.015;

    landmarks[0] = { x: midHipX, y: 0.17, visibility: 0.99 };
    landmarks[11] = { x: midHipX - 0.09, y: 0.29, visibility: 0.99 };
    landmarks[12] = { x: midHipX + 0.09, y: 0.29, visibility: 0.99 };

    // Arms counter-swinging
    landmarks[13] = { x: midHipX - 0.11 - armSwing * 0.5, y: 0.42, visibility: 0.95 };
    landmarks[14] = { x: midHipX + 0.11 + armSwing * 0.5, y: 0.42, visibility: 0.95 };
    landmarks[15] = { x: midHipX - 0.12 - armSwing, y: 0.54, visibility: 0.95 };
    landmarks[16] = { x: midHipX + 0.12 + armSwing, y: 0.54, visibility: 0.95 };

    landmarks[23] = { x: midHipX - 0.06, y: 0.52, visibility: 0.99 };
    landmarks[24] = { x: midHipX + 0.06, y: 0.52, visibility: 0.99 };

    // Legs swinging opposition
    landmarks[25] = { x: midHipX - 0.06 + legSwing * 0.5, y: 0.70 - legLift * 0.5, visibility: 0.98 };
    landmarks[26] = { x: midHipX + 0.06 - legSwing * 0.5, y: 0.70, visibility: 0.98 };

    landmarks[27] = { x: midHipX - 0.06 + legSwing, y: 0.88 - legLift, visibility: 0.98 };
    landmarks[28] = { x: midHipX + 0.06 - legSwing, y: 0.88, visibility: 0.98 };
  } else if (activity === 'Running') {
    // High-cadence running cycle: frequency ~2.4 Hz
    const freq = 2.4;
    const phase = tSec * freq * 2 * Math.PI;
    const legSwing = Math.sin(phase) * 0.22;
    const kneeBend = Math.max(0, Math.sin(phase)) * 0.12;
    const armSwing = Math.cos(phase) * 0.18;
    const bounce = Math.abs(Math.sin(phase)) * 0.04;

    midHipX = 0.5 + Math.sin(tSec * 1.5) * 0.08;
    midHipY = 0.51 - bounce;

    landmarks[0] = { x: midHipX + 0.03, y: 0.18 - bounce, visibility: 0.99 }; // Lean slightly forward
    landmarks[11] = { x: midHipX - 0.09, y: 0.29 - bounce, visibility: 0.99 };
    landmarks[12] = { x: midHipX + 0.09, y: 0.29 - bounce, visibility: 0.99 };

    // Vigorously pumping elbows
    landmarks[13] = { x: midHipX - 0.12 - armSwing * 0.7, y: 0.38 - bounce, visibility: 0.95 };
    landmarks[14] = { x: midHipX + 0.12 + armSwing * 0.7, y: 0.38 - bounce, visibility: 0.95 };
    landmarks[15] = { x: midHipX - 0.15 - armSwing, y: 0.48 - bounce, visibility: 0.95 };
    landmarks[16] = { x: midHipX + 0.15 + armSwing, y: 0.48 - bounce, visibility: 0.95 };

    landmarks[23] = { x: midHipX - 0.06, y: 0.52 - bounce, visibility: 0.99 };
    landmarks[24] = { x: midHipX + 0.06, y: 0.52 - bounce, visibility: 0.99 };

    // Pronounced knee flexion and flight phase
    landmarks[25] = { x: midHipX - 0.06 + legSwing * 0.7, y: 0.68 - kneeBend - bounce, visibility: 0.98 };
    landmarks[26] = { x: midHipX + 0.06 - legSwing * 0.7, y: 0.70 - bounce, visibility: 0.98 };

    landmarks[27] = { x: midHipX - 0.06 + legSwing, y: 0.86 - kneeBend * 1.6 - bounce, visibility: 0.98 };
    landmarks[28] = { x: midHipX + 0.06 - legSwing, y: 0.88 - bounce, visibility: 0.98 };
  }

  return landmarks;
}

// MediaPipe Pose connection pairs for skeletal rendering
export const POSE_CONNECTIONS: [number, number][] = [
  // Head & Torso
  [11, 12], // L Shoulder - R Shoulder
  [11, 23], // L Shoulder - L Hip
  [12, 24], // R Shoulder - R Hip
  [23, 24], // L Hip - R Hip
  // Left Arm
  [11, 13],
  [13, 15],
  // Right Arm
  [12, 14],
  [14, 16],
  // Left Leg
  [23, 25],
  [25, 27],
  // Right Leg
  [24, 26],
  [26, 28],
];
