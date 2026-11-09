import { PoseLandmark } from '../types';

export interface SampleImageItem {
  id: string;
  name: string;
  activity: 'Standing' | 'Sitting' | 'Walking' | 'Running';
  label: string;
  dataUrl: string;
  description: string;
  landmarks: PoseLandmark[];
}

/**
 * Creates an inline high-contrast photographic canvas graphic for sample test cases.
 */
function createSampleGraphic(activity: 'Standing' | 'Sitting' | 'Walking' | 'Running'): string {
  // Generate realistic styled SVG with human silhouette in exact target activity posture
  let bodySvg = '';

  if (activity === 'Standing') {
    bodySvg = `
      <circle cx="200" cy="90" r="22" fill="#0f172a" />
      <line x1="200" y1="112" x2="200" y2="240" stroke="#0f172a" stroke-width="26" stroke-linecap="round" />
      <line x1="188" y1="130" x2="160" y2="220" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <line x1="212" y1="130" x2="240" y2="220" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <line x1="188" y1="240" x2="188" y2="380" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="212" y1="240" x2="212" y2="380" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
    `;
  } else if (activity === 'Sitting') {
    bodySvg = `
      <!-- Chair -->
      <path d="M 130 260 L 250 260 M 150 260 L 150 380 M 240 260 L 240 380 M 130 180 L 130 260" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" />
      <!-- Seated Person -->
      <circle cx="170" cy="120" r="20" fill="#0f172a" />
      <line x1="170" y1="140" x2="170" y2="250" stroke="#0f172a" stroke-width="24" stroke-linecap="round" />
      <line x1="170" y1="250" x2="250" y2="255" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
      <line x1="250" y1="255" x2="250" y2="375" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="170" y1="160" x2="220" y2="220" stroke="#0f172a" stroke-width="12" stroke-linecap="round" />
    `;
  } else if (activity === 'Walking') {
    bodySvg = `
      <circle cx="200" cy="90" r="22" fill="#0f172a" />
      <line x1="200" y1="112" x2="200" y2="230" stroke="#0f172a" stroke-width="26" stroke-linecap="round" />
      <!-- Arm swing -->
      <line x1="190" y1="130" x2="155" y2="190" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <line x1="210" y1="130" x2="245" y2="190" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <!-- Legs stride -->
      <line x1="195" y1="230" x2="160" y2="380" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="205" y1="230" x2="245" y2="375" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
    `;
  } else if (activity === 'Running') {
    bodySvg = `
      <!-- Dynamic runner leaning forward -->
      <circle cx="225" cy="85" r="22" fill="#0f172a" />
      <line x1="225" y1="107" x2="185" y2="225" stroke="#0f172a" stroke-width="24" stroke-linecap="round" />
      <!-- Pumping arms -->
      <line x1="210" y1="130" x2="150" y2="150" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <line x1="210" y1="130" x2="265" y2="170" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
      <!-- Wide stride legs -->
      <line x1="185" y1="225" x2="245" y2="280" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="245" y1="280" x2="265" y2="350" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="185" y1="225" x2="120" y2="300" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      <line x1="120" y1="300" x2="105" y2="380" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="420" viewBox="0 0 400 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <rect width="400" height="420" fill="url(#bg)" />
      <!-- Ground line -->
      <line x1="20" y1="385" x2="380" y2="385" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 6" />
      ${bodySvg}
      <text x="20" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">SAMPLE TEST PHOTO: ${activity.toUpperCase()}</text>
    </svg>
  `;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getPredefinedLandmarks(activity: 'Standing' | 'Sitting' | 'Walking' | 'Running'): PoseLandmark[] {
  const lms: PoseLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  if (activity === 'Standing') {
    lms[0] = { x: 0.50, y: 0.21, visibility: 0.99 }; // Nose
    lms[11] = { x: 0.44, y: 0.30, visibility: 0.99 }; // L Shoulder
    lms[12] = { x: 0.56, y: 0.30, visibility: 0.99 }; // R Shoulder
    lms[13] = { x: 0.40, y: 0.43, visibility: 0.95 };
    lms[14] = { x: 0.60, y: 0.43, visibility: 0.95 };
    lms[15] = { x: 0.40, y: 0.53, visibility: 0.95 };
    lms[16] = { x: 0.60, y: 0.53, visibility: 0.95 };
    lms[23] = { x: 0.46, y: 0.57, visibility: 0.99 }; // L Hip
    lms[24] = { x: 0.54, y: 0.57, visibility: 0.99 }; // R Hip
    lms[25] = { x: 0.46, y: 0.72, visibility: 0.98 }; // L Knee (straight)
    lms[26] = { x: 0.54, y: 0.72, visibility: 0.98 }; // R Knee (straight)
    lms[27] = { x: 0.46, y: 0.91, visibility: 0.98 }; // L Ankle
    lms[28] = { x: 0.54, y: 0.91, visibility: 0.98 }; // R Ankle
  } else if (activity === 'Sitting') {
    lms[0] = { x: 0.43, y: 0.28, visibility: 0.99 };
    lms[11] = { x: 0.38, y: 0.37, visibility: 0.99 };
    lms[12] = { x: 0.48, y: 0.37, visibility: 0.99 };
    lms[13] = { x: 0.35, y: 0.48, visibility: 0.95 };
    lms[14] = { x: 0.51, y: 0.48, visibility: 0.95 };
    lms[15] = { x: 0.50, y: 0.56, visibility: 0.95 };
    lms[16] = { x: 0.52, y: 0.56, visibility: 0.95 };
    lms[23] = { x: 0.42, y: 0.60, visibility: 0.99 }; // L Hip
    lms[24] = { x: 0.48, y: 0.60, visibility: 0.99 }; // R Hip
    lms[25] = { x: 0.62, y: 0.61, visibility: 0.98 }; // L Knee (flexed forward 92 deg)
    lms[26] = { x: 0.64, y: 0.61, visibility: 0.98 }; // R Knee
    lms[27] = { x: 0.62, y: 0.89, visibility: 0.98 }; // L Ankle
    lms[28] = { x: 0.64, y: 0.89, visibility: 0.98 }; // R Ankle
  } else if (activity === 'Walking') {
    lms[0] = { x: 0.50, y: 0.21, visibility: 0.99 };
    lms[11] = { x: 0.44, y: 0.30, visibility: 0.99 };
    lms[12] = { x: 0.56, y: 0.30, visibility: 0.99 };
    lms[13] = { x: 0.39, y: 0.44, visibility: 0.95 };
    lms[14] = { x: 0.61, y: 0.44, visibility: 0.95 };
    lms[15] = { x: 0.38, y: 0.54, visibility: 0.95 };
    lms[16] = { x: 0.62, y: 0.54, visibility: 0.95 };
    lms[23] = { x: 0.46, y: 0.55, visibility: 0.99 };
    lms[24] = { x: 0.54, y: 0.55, visibility: 0.99 };
    lms[25] = { x: 0.41, y: 0.72, visibility: 0.98 };
    lms[26] = { x: 0.59, y: 0.72, visibility: 0.98 };
    lms[27] = { x: 0.38, y: 0.89, visibility: 0.98 }; // L Ankle (moderate spread)
    lms[28] = { x: 0.62, y: 0.89, visibility: 0.98 }; // R Ankle
  } else if (activity === 'Running') {
    lms[0] = { x: 0.56, y: 0.20, visibility: 0.99 }; // Lean forward
    lms[11] = { x: 0.48, y: 0.29, visibility: 0.99 };
    lms[12] = { x: 0.60, y: 0.29, visibility: 0.99 };
    lms[13] = { x: 0.37, y: 0.35, visibility: 0.95 };
    lms[14] = { x: 0.66, y: 0.40, visibility: 0.95 };
    lms[15] = { x: 0.38, y: 0.45, visibility: 0.95 };
    lms[16] = { x: 0.67, y: 0.52, visibility: 0.95 };
    lms[23] = { x: 0.46, y: 0.54, visibility: 0.99 };
    lms[24] = { x: 0.52, y: 0.54, visibility: 0.99 };
    lms[25] = { x: 0.61, y: 0.67, visibility: 0.98 }; // L Knee forward
    lms[26] = { x: 0.30, y: 0.71, visibility: 0.98 }; // R Knee back
    lms[27] = { x: 0.66, y: 0.83, visibility: 0.98 }; // L Ankle forward (wide spread)
    lms[28] = { x: 0.26, y: 0.90, visibility: 0.98 }; // R Ankle back
  }

  return lms;
}

export const SAMPLE_IMAGES: SampleImageItem[] = [
  {
    id: 'sample-standing',
    name: 'Standing Test Image',
    activity: 'Standing',
    label: '🧍 Standing Posture',
    dataUrl: createSampleGraphic('Standing'),
    description: 'Upright subject with straight knees and narrow feet alignment',
    landmarks: getPredefinedLandmarks('Standing'),
  },
  {
    id: 'sample-sitting',
    name: 'Sitting Test Image',
    activity: 'Sitting',
    label: '🪑 Sitting Posture',
    dataUrl: createSampleGraphic('Sitting'),
    description: 'Subject seated on a chair with knees flexed at ~90 degrees',
    landmarks: getPredefinedLandmarks('Sitting'),
  },
  {
    id: 'sample-walking',
    name: 'Walking Test Image',
    activity: 'Walking',
    label: '🚶 Walking Stride',
    dataUrl: createSampleGraphic('Walking'),
    description: 'Subject captured mid-stride with moderate foot separation',
    landmarks: getPredefinedLandmarks('Walking'),
  },
  {
    id: 'sample-running',
    name: 'Running Test Image',
    activity: 'Running',
    label: '🏃 Running Sprint',
    dataUrl: createSampleGraphic('Running'),
    description: 'Subject sprinting with wide leg stride and forward torso incline',
    landmarks: getPredefinedLandmarks('Running'),
  },
];
