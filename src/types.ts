export type ActivityType = 'Standing' | 'Sitting' | 'Walking' | 'Running' | 'No Person';

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface ExtractedFeatures {
  personDetected: boolean;
  leftKneeAngle: number;
  rightKneeAngle: number;
  avgKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  avgHipAngle: number;
  torsoAlignmentAngle: number;
  torsoHeight: number;
  displacementVelocity: number; // velocity index
  oscillationCadence: number;   // step frequency
  postureRatio: number;
  strideSpread: number;         // inter-ankle normalized distance (key for static images)
  isStaticImage?: boolean;      // true if source is an uploaded photo
}

export interface ClassificationResult {
  activity: ActivityType;
  confidence: number;
  reason: string;
  ruleMatched: string;
  timestamp: string;
  features: ExtractedFeatures;
}

export interface ActivityHistoryItem {
  id: string;
  time: string;
  activity: ActivityType;
  confidence: number;
  reason: string;
  velocity: number;
  kneeAngle: number;
  sourceType?: 'webcam' | 'image' | 'demo' | 'simulation';
}

export interface ActivityCounts {
  Standing: number;
  Sitting: number;
  Walking: number;
  Running: number;
}

export type InputMode = 
  | 'webcam' 
  | 'image-upload'
  | 'sample-standing' 
  | 'sample-sitting' 
  | 'sample-walking' 
  | 'sample-running';

export type PipelineStage = 
  | 'idle'
  | 'webcam_capture'
  | 'image_input'
  | 'person_detection'
  | 'pose_estimation'
  | 'feature_extraction'
  | 'activity_classification'
  | 'result_display';

