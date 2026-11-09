import { ActivityType, ClassificationResult, ExtractedFeatures, PoseLandmark } from '../types';

/**
 * Calculates joint angle at point B formed by AB and BC.
 * Returns angle in degrees [0, 180].
 */
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((rad * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

export class HarFeatureExtractor {
  private ankleHistory: Array<{ x: number; y: number; time: number }> = [];
  private hipHistory: Array<{ x: number; y: number; time: number }> = [];
  private readonly bufferSize = 12;

  public reset() {
    this.ankleHistory = [];
    this.hipHistory = [];
  }

  public extract(
    landmarks: PoseLandmark[] | null | undefined,
    isStaticImage: boolean = false
  ): ExtractedFeatures {
    if (!landmarks || landmarks.length < 29) {
      return {
        personDetected: false,
        leftKneeAngle: 0,
        rightKneeAngle: 0,
        avgKneeAngle: 0,
        leftHipAngle: 0,
        rightHipAngle: 0,
        avgHipAngle: 0,
        torsoAlignmentAngle: 0,
        torsoHeight: 0,
        displacementVelocity: 0,
        oscillationCadence: 0,
        postureRatio: 0,
        strideSpread: 0,
        isStaticImage,
      };
    }

    // MediaPipe Pose Landmark Indices:
    // 11: Left Shoulder, 12: Right Shoulder
    // 23: Left Hip,      24: Right Hip
    // 25: Left Knee,     26: Right Knee
    // 27: Left Ankle,    28: Right Ankle
    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];
    const lk = landmarks[25];
    const rk = landmarks[26];
    const la = landmarks[27];
    const ra = landmarks[28];

    // Check visibility/validity
    const personDetected = (lh.visibility ?? 1) > 0.4 || (rh.visibility ?? 1) > 0.4 || (ls.visibility ?? 1) > 0.4;

    const leftKneeAngle = calculateAngle(lh, lk, la);
    const rightKneeAngle = calculateAngle(rh, rk, ra);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftHipAngle = calculateAngle(ls, lh, lk);
    const rightHipAngle = calculateAngle(rs, rh, rk);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    // Torso vector
    const midShoulder = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const midHip = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
    const midAnkle = { x: (la.x + ra.x) / 2, y: (la.y + ra.y) / 2 };

    const torsoHeight = Math.hypot(midHip.x - midShoulder.x, midHip.y - midShoulder.y);
    const legLength = Math.hypot(midAnkle.x - midHip.x, midAnkle.y - midHip.y);
    const postureRatio = torsoHeight / (legLength || 0.001);

    // Stride spread: inter-ankle distance normalized by torso height
    const interAnkleDist = Math.hypot(ra.x - la.x, ra.y - la.y);
    const strideSpread = Number((interAnkleDist / Math.max(torsoHeight, 0.1)).toFixed(2));

    // Torso angle relative to vertical axis (0 deg is upright vertical)
    const torsoDy = midHip.y - midShoulder.y;
    const torsoDx = midHip.x - midShoulder.x;
    const torsoAlignmentAngle = Math.abs((Math.atan2(Math.abs(torsoDx), Math.abs(torsoDy)) * 180) / Math.PI);

    // Track motion over rolling window (only if video/live stream)
    let displacementVelocity = 0;
    if (!isStaticImage) {
      const now = performance.now();
      this.ankleHistory.push({ x: midAnkle.x, y: midAnkle.y, time: now });
      this.hipHistory.push({ x: midHip.x, y: midHip.y, time: now });

      if (this.ankleHistory.length > this.bufferSize) {
        this.ankleHistory.shift();
        this.hipHistory.shift();
      }

      if (this.ankleHistory.length >= 4) {
        let sumDist = 0;
        for (let i = 1; i < this.ankleHistory.length; i++) {
          const p1 = this.ankleHistory[i - 1];
          const p2 = this.ankleHistory[i];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          sumDist += dist;
        }
        // Normalize by torso height to be invariant to distance from camera
        const normFactor = Math.max(torsoHeight, 0.1);
        displacementVelocity = (sumDist / (this.ankleHistory.length - 1)) / normFactor * 10;
      }
    } else {
      // In static photo, proxy motion using stride spread
      displacementVelocity = strideSpread >= 0.8 ? 2.3 : strideSpread >= 0.35 ? 1.2 : 0.1;
    }

    return {
      personDetected,
      leftKneeAngle: Math.round(leftKneeAngle),
      rightKneeAngle: Math.round(rightKneeAngle),
      avgKneeAngle: Math.round(avgKneeAngle),
      leftHipAngle: Math.round(leftHipAngle),
      rightHipAngle: Math.round(rightHipAngle),
      avgHipAngle: Math.round(avgHipAngle),
      torsoAlignmentAngle: Math.round(torsoAlignmentAngle),
      torsoHeight: Number(torsoHeight.toFixed(3)),
      displacementVelocity: Number(displacementVelocity.toFixed(2)),
      oscillationCadence: Number((displacementVelocity * 1.4).toFixed(1)),
      postureRatio: Number(postureRatio.toFixed(2)),
      strideSpread,
      isStaticImage,
    };
  }
}

export class HarClassifier {
  /**
   * Rule-based classifier with confidence estimation.
   * Can be directly swapped or hybridized with an ML model.
   */
  public classify(features: ExtractedFeatures): ClassificationResult {
    const timestamp = new Date().toLocaleTimeString();

    if (!features.personDetected) {
      return {
        activity: 'No Person',
        confidence: 0,
        reason: 'No human pose landmarks detected in input',
        ruleMatched: 'Rule 0: Landmark visibility < 0.4',
        timestamp,
        features,
      };
    }

    const { avgKneeAngle, avgHipAngle, displacementVelocity, strideSpread, isStaticImage } = features;

    // Rule 1: Sitting Posture
    // Sitting is characterized by bent knees (< 138 deg) and bent hips (< 148 deg)
    if (avgKneeAngle < 138 && avgHipAngle < 148) {
      const bendFactor = Math.max(0, Math.min(1, (138 - avgKneeAngle) / 45));
      const confidence = Math.round(78 + bendFactor * 18); // 78% to 96%
      return {
        activity: 'Sitting',
        confidence,
        reason: `Bent knees (${avgKneeAngle}°) & seated hip flexion (${avgHipAngle}°)`,
        ruleMatched: 'Rule 1: avgKneeAngle < 138° AND avgHipAngle < 148°',
        timestamp,
        features,
      };
    }

    // Static Photo Analysis Pathway
    // In a single photo, temporal velocity is zero/unavailable, so spatial stride spread is used!
    if (isStaticImage) {
      if (strideSpread >= 0.8 || features.torsoAlignmentAngle >= 15) {
        const conf = Math.min(95, Math.round(80 + (strideSpread - 0.8) * 15));
        return {
          activity: 'Running',
          confidence: conf,
          reason: `Wide stride spread (${strideSpread}× torso) & dynamic posture in photo`,
          ruleMatched: 'Rule 2 (Image): strideSpread >= 0.80 OR torsoIncline >= 15°',
          timestamp,
          features,
        };
      }

      if (strideSpread >= 0.35) {
        return {
          activity: 'Walking',
          confidence: 88,
          reason: `Moderate ambulatory stride separation (${strideSpread}× torso) in photo`,
          ruleMatched: 'Rule 3 (Image): 0.35 <= strideSpread < 0.80',
          timestamp,
          features,
        };
      }

      const kneeExtension = Math.min(1, Math.max(0, (avgKneeAngle - 140) / 40));
      return {
        activity: 'Standing',
        confidence: Math.round(82 + kneeExtension * 12),
        reason: `Upright vertical stance with narrow foot stance (${strideSpread}× torso) in photo`,
        ruleMatched: 'Rule 4 (Image): strideSpread < 0.35 AND avgKneeAngle >= 138°',
        timestamp,
        features,
      };
    }

    // Video / Stream Analysis Pathway (Kinematic Velocity)
    // Rule 2: Running
    // Upright body with high kinetic displacement velocity (v >= 2.0)
    if (displacementVelocity >= 2.0) {
      const vBonus = Math.min(22, (displacementVelocity - 2.0) * 10);
      const confidence = Math.round(Math.min(96, 74 + vBonus));
      return {
        activity: 'Running',
        confidence,
        reason: `High dynamic stride velocity (${displacementVelocity.toFixed(2)} units)`,
        ruleMatched: 'Rule 2: displacementVelocity >= 2.0 units',
        timestamp,
        features,
      };
    }

    // Rule 3: Walking
    // Upright body with moderate cyclic velocity (0.65 <= v < 2.0)
    if (displacementVelocity >= 0.65) {
      const walkFit = 1 - Math.abs(displacementVelocity - 1.3) / 1.3;
      const confidence = Math.round(70 + Math.max(0, walkFit * 22));
      return {
        activity: 'Walking',
        confidence,
        reason: `Moderate ambulatory movement velocity (${displacementVelocity.toFixed(2)} units)`,
        ruleMatched: 'Rule 3: 0.65 <= displacementVelocity < 2.0 units',
        timestamp,
        features,
      };
    }

    // Rule 4: Standing
    // Extended knees (>= 142 deg) with low displacement velocity (< 0.65)
    const kneeExtension = Math.min(1, Math.max(0, (avgKneeAngle - 140) / 40));
    const stillness = Math.min(1, Math.max(0, (0.65 - displacementVelocity) / 0.65));
    const confidence = Math.round(72 + kneeExtension * 14 + stillness * 10); // 72% to 96%

    return {
      activity: 'Standing',
      confidence,
      reason: `Extended legs (${avgKneeAngle}°) and stationary posture (v = ${displacementVelocity.toFixed(2)})`,
      ruleMatched: 'Rule 4: avgKneeAngle >= 138° AND displacementVelocity < 0.65',
      timestamp,
      features,
    };
  }
}
