import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityCounts,
  ActivityHistoryItem,
  ActivityType,
  ExtractedFeatures,
  InputMode,
  PipelineStage,
  PoseLandmark,
} from './types';
import { HarClassifier, HarFeatureExtractor } from './utils/harClassifier';
import {
  detectPoseInVideo,
  detectPoseInImage,
  generateSyntheticPose,
  initPoseLandmarker,
} from './utils/poseDetector';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { Header } from './components/Header';
import { VideoFeed } from './components/VideoFeed';
import { ImageAnalysisSection } from './components/ImageAnalysisSection';
import { CurrentActivityCard } from './components/CurrentActivityCard';
import { FeatureTelemetry } from './components/FeatureTelemetry';
import { ActivityCounters } from './components/ActivityCounters';
import { ActivityHistoryTable } from './components/ActivityHistoryTable';
import { DemoModePanel } from './components/DemoModePanel';

const initialFeatures: ExtractedFeatures = {
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
  isStaticImage: false,
};

export default function App() {
  // Detection controls
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [inputMode, setInputMode] = useState<InputMode>('webcam');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Image analysis state
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(SAMPLE_IMAGES[0].dataUrl);
  const [imageFileName, setImageFileName] = useState<string | null>(SAMPLE_IMAGES[0].name);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(SAMPLE_IMAGES[0].id);
  const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);

  // Core classification state
  const [currentActivity, setCurrentActivity] = useState<ActivityType>('Standing');
  const [confidence, setConfidence] = useState<number>(91);
  const [decisionReason, setDecisionReason] = useState<string>(
    'Extended knee joints (172°) and stationary movement vector'
  );
  const [ruleMatched, setRuleMatched] = useState<string>(
    'Rule 4: avgKneeAngle >= 138° AND displacementVelocity < 0.65'
  );
  const [features, setFeatures] = useState<ExtractedFeatures>(initialFeatures);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('result_display');
  const [fps, setFps] = useState<number>(30);

  // Activity counts
  const [activityCounts, setActivityCounts] = useState<ActivityCounts>({
    Standing: 12,
    Sitting: 8,
    Walking: 5,
    Running: 2,
  });

  // History log
  const [history, setHistory] = useState<ActivityHistoryItem[]>([
    {
      id: 'init-1',
      time: '10:32:14',
      activity: 'Standing',
      confidence: 92,
      reason: 'Upright posture with extended legs (174°)',
      velocity: 0.12,
      kneeAngle: 174,
      sourceType: 'webcam',
    },
    {
      id: 'init-2',
      time: '10:32:20',
      activity: 'Sitting',
      confidence: 89,
      reason: 'Lowered torso & knee flexion angle (94°)',
      velocity: 0.08,
      kneeAngle: 94,
      sourceType: 'webcam',
    },
    {
      id: 'init-3',
      time: '10:32:35',
      activity: 'Walking',
      confidence: 85,
      reason: 'Periodic foot displacement (v = 1.24)',
      velocity: 1.24,
      kneeAngle: 165,
      sourceType: 'webcam',
    },
  ]);

  // Video, Canvas & Image DOM references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Processors
  const featureExtractorRef = useRef<HarFeatureExtractor>(new HarFeatureExtractor());
  const classifierRef = useRef<HarClassifier>(new HarClassifier());

  // Debouncing for history logs
  const lastLoggedActivityRef = useRef<ActivityType | null>(null);
  const lastLoggedTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Setup webcam stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Webcam permission error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not access camera. Please allow camera permissions or switch to Image/Simulation.';
      setCameraError(msg);
      // Auto fallback to image upload or simulation if webcam is blocked
      setInputMode('image-upload');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera and model
  useEffect(() => {
    initPoseLandmarker().catch((err) => console.log('MediaPipe init note:', err));
    if (inputMode === 'webcam') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [inputMode, startCamera, stopCamera]);

  // Record activity in history and counters
  const recordActivityEvent = useCallback(
    (act: ActivityType, conf: number, rsn: string, vel: number, kAngle: number) => {
      if (act === 'No Person') return;

      const now = Date.now();
      const timeElapsed = (now - lastLoggedTimeRef.current) / 1000;
      const isNewActivity = act !== lastLoggedActivityRef.current;

      // Log if changed activity or if same activity persists for > 4 seconds
      if (isNewActivity || timeElapsed > 4) {
        lastLoggedActivityRef.current = act;
        lastLoggedTimeRef.current = now;

        const timeStr = new Date().toLocaleTimeString();
        const newItem: ActivityHistoryItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: timeStr,
          activity: act,
          confidence: conf,
          reason: rsn,
          velocity: vel,
          kneeAngle: kAngle,
          sourceType: 'webcam',
        };

        setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // keep recent 50

        setActivityCounts((prev) => ({
          ...prev,
          [act]: (prev[act] || 0) + 1,
        }));
      }
    },
    []
  );

  // Image analysis runner
  const handleAnalyzeImage = useCallback(
    async (dataUrl: string, presetLandmarks?: PoseLandmark[], fileName?: string) => {
      setIsImageProcessing(true);
      setPipelineStage('image_input');
      setInputMode('image-upload');
      setCurrentImageUrl(dataUrl);
      setImageFileName(fileName || 'Uploaded Photo');

      // Check if this matches one of the sample images
      const matchedSample = SAMPLE_IMAGES.find((s) => s.dataUrl === dataUrl || s.name === fileName);
      setSelectedSampleId(matchedSample ? matchedSample.id : null);

      let detectedLandmarks: PoseLandmark[] | null = null;

      if (presetLandmarks && presetLandmarks.length > 0) {
        detectedLandmarks = presetLandmarks;
        setPipelineStage('pose_estimation');
      } else {
        setPipelineStage('pose_estimation');
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(e);
            img.src = dataUrl;
          });

          detectedLandmarks = await detectPoseInImage(img);
        } catch (err) {
          console.warn('Image detection attempt error:', err);
        }
      }

      if (!detectedLandmarks || detectedLandmarks.length === 0) {
        setLandmarks(null);
        setFeatures({
          ...initialFeatures,
          isStaticImage: true,
        });
        setCurrentActivity('No Person');
        setConfidence(0);
        setDecisionReason('No clear human body landmarks identified in the photo');
        setRuleMatched('Rule 0: Landmark detection threshold not satisfied');
        setPipelineStage('result_display');
        setIsImageProcessing(false);
        return;
      }

      setLandmarks(detectedLandmarks);

      // Feature extraction stage (isStaticImage = true)
      setPipelineStage('feature_extraction');
      const extracted = featureExtractorRef.current.extract(detectedLandmarks, true);
      setFeatures(extracted);

      // Classification stage
      setPipelineStage('activity_classification');
      const result = classifierRef.current.classify(extracted);

      setCurrentActivity(result.activity);
      setConfidence(result.confidence);
      setDecisionReason(`[Photo Identification] ${result.reason}`);
      setRuleMatched(result.ruleMatched);
      setPipelineStage('result_display');
      setIsImageProcessing(false);

      // Record to history
      if (result.activity !== 'No Person') {
        const timeStr = new Date().toLocaleTimeString();
        const actName = result.activity as keyof ActivityCounts;
        setHistory((prev) => [
          {
            id: `img-${Date.now()}`,
            time: timeStr,
            activity: result.activity,
            confidence: result.confidence,
            reason: `[Photo] ${result.reason}`,
            velocity: extracted.displacementVelocity,
            kneeAngle: extracted.avgKneeAngle,
            sourceType: 'image',
          },
          ...prev.slice(0, 49),
        ]);

        setActivityCounts((prev) => ({
          ...prev,
          [actName]: (prev[actName] || 0) + 1,
        }));
      }
    },
    []
  );

  // Main continuous processing loop for video and simulation
  useEffect(() => {
    let active = true;

    const processLoop = () => {
      if (!active) return;

      if (!isDetecting) {
        setPipelineStage('idle');
        animationFrameRef.current = requestAnimationFrame(processLoop);
        return;
      }

      // If in image upload mode, the photo is analyzed upon selection or re-analysis trigger
      if (inputMode === 'image-upload') {
        animationFrameRef.current = requestAnimationFrame(processLoop);
        return;
      }

      const now = performance.now();
      frameCountRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      let detectedLandmarks: PoseLandmark[] | null = null;

      if (inputMode === 'webcam') {
        setPipelineStage('webcam_capture');
        if (videoRef.current && videoRef.current.readyState >= 2) {
          setPipelineStage('pose_estimation');
          detectedLandmarks = detectPoseInVideo(videoRef.current, now);
        }
      } else {
        // Simulation mode
        setPipelineStage('pose_estimation');
        const activityMap: Record<string, 'Standing' | 'Sitting' | 'Walking' | 'Running'> = {
          'sample-standing': 'Standing',
          'sample-sitting': 'Sitting',
          'sample-walking': 'Walking',
          'sample-running': 'Running',
        };
        const sampleAct = activityMap[inputMode] || 'Standing';
        detectedLandmarks = generateSyntheticPose(sampleAct, now / 1000);
      }

      setLandmarks(detectedLandmarks);

      // Feature extraction stage
      setPipelineStage('feature_extraction');
      const extracted = featureExtractorRef.current.extract(detectedLandmarks, false);
      setFeatures(extracted);

      // Activity classification stage
      setPipelineStage('activity_classification');
      const result = classifierRef.current.classify(extracted);

      setCurrentActivity(result.activity);
      setConfidence(result.confidence);
      setDecisionReason(result.reason);
      setRuleMatched(result.ruleMatched);
      setPipelineStage('result_display');

      // Record to history if valid
      if (result.activity !== 'No Person' && extracted.personDetected) {
        recordActivityEvent(
          result.activity,
          result.confidence,
          result.reason,
          extracted.displacementVelocity,
          extracted.avgKneeAngle
        );
      }

      animationFrameRef.current = requestAnimationFrame(processLoop);
    };

    animationFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetecting, inputMode, recordActivityEvent]);

  // Demo Mode selection handler
  const handleSelectDemoActivity = (act: 'Standing' | 'Sitting' | 'Walking' | 'Running') => {
    const demoConfigs = {
      Standing: {
        conf: 92,
        reason: 'Upright body posture with extended legs (174°) and zero velocity',
        rule: 'Rule 4: avgKneeAngle >= 138° AND displacementVelocity < 0.65',
        kneeAngle: 174,
        hipAngle: 176,
        vel: 0.12,
        strideSpread: 0.18,
      },
      Sitting: {
        conf: 89,
        reason: 'Lowered torso & knee flexion angle (92°) & seated hip flexion',
        rule: 'Rule 1: avgKneeAngle < 138° AND avgHipAngle < 148°',
        kneeAngle: 92,
        hipAngle: 96,
        vel: 0.05,
        strideSpread: 0.22,
      },
      Walking: {
        conf: 85,
        reason: 'Periodic foot displacement velocity (v = 1.35 units)',
        rule: 'Rule 3: 0.65 <= displacementVelocity < 2.0 units',
        kneeAngle: 162,
        hipAngle: 168,
        vel: 1.35,
        strideSpread: 0.55,
      },
      Running: {
        conf: 94,
        reason: 'High dynamic stride displacement velocity (v = 2.45 units)',
        rule: 'Rule 2: displacementVelocity >= 2.0 units',
        kneeAngle: 154,
        hipAngle: 160,
        vel: 2.45,
        strideSpread: 0.95,
      },
    };

    const cfg = demoConfigs[act];
    setCurrentActivity(act);
    setConfidence(cfg.conf);
    setDecisionReason(`[DEMO OVERRIDE] ${cfg.reason}`);
    setRuleMatched(cfg.rule);

    // Update telemetry features
    setFeatures({
      personDetected: true,
      leftKneeAngle: cfg.kneeAngle,
      rightKneeAngle: cfg.kneeAngle,
      avgKneeAngle: cfg.kneeAngle,
      leftHipAngle: cfg.hipAngle,
      rightHipAngle: cfg.hipAngle,
      avgHipAngle: cfg.hipAngle,
      torsoAlignmentAngle: act === 'Sitting' ? 12 : 3,
      torsoHeight: 0.28,
      displacementVelocity: cfg.vel,
      oscillationCadence: cfg.vel * 1.4,
      postureRatio: 0.85,
      strideSpread: cfg.strideSpread,
      isStaticImage: false,
    });

    // Record to history and update counters
    const timeStr = new Date().toLocaleTimeString();
    setHistory((prev) => [
      {
        id: `demo-${Date.now()}`,
        time: timeStr,
        activity: act,
        confidence: cfg.conf,
        reason: `[Demo Mode] ${cfg.reason}`,
        velocity: cfg.vel,
        kneeAngle: cfg.kneeAngle,
        sourceType: 'demo',
      },
      ...prev.slice(0, 49),
    ]);

    setActivityCounts((prev) => ({
      ...prev,
      [act]: (prev[act] || 0) + 1,
    }));
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActivityCounts({
      Standing: 0,
      Sitting: 0,
      Walking: 0,
      Running: 0,
    });
  };

  // Toggle or switch to image mode
  const handleToggleImageMode = () => {
    if (inputMode === 'image-upload') {
      setInputMode('webcam');
    } else {
      setInputMode('image-upload');
      if (currentImageUrl) {
        const sample = SAMPLE_IMAGES.find((s) => s.id === selectedSampleId) || SAMPLE_IMAGES[0];
        handleAnalyzeImage(sample.dataUrl, sample.landmarks, sample.name);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        onSelectImageMode={handleToggleImageMode}
        isImageMode={inputMode === 'image-upload'}
        isDetecting={isDetecting}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Demo Mode Override Panel */}
        <DemoModePanel
          isOpen={isDemoMode}
          onClose={() => setIsDemoMode(false)}
          onSelectActivity={handleSelectDemoActivity}
          currentActivity={currentActivity}
        />

        {/* Insert Image Analysis Section (Visible when in Image Mode or toggleable) */}
        {inputMode === 'image-upload' && (
          <ImageAnalysisSection
            currentImageUrl={currentImageUrl}
            onImageSelected={handleAnalyzeImage}
            isProcessing={isImageProcessing}
            onSwitchToWebcam={() => setInputMode('webcam')}
            selectedSampleId={selectedSampleId}
          />
        )}

        {/* Dashboard 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Video Area & Extracted Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <VideoFeed
              isDetecting={isDetecting}
              onToggleDetection={() => {
                if (inputMode === 'image-upload') {
                  if (currentImageUrl) {
                    const sample = SAMPLE_IMAGES.find((s) => s.id === selectedSampleId);
                    handleAnalyzeImage(currentImageUrl, sample?.landmarks, imageFileName || undefined);
                  }
                } else {
                  setIsDetecting(!isDetecting);
                }
              }}
              inputMode={inputMode}
              onChangeInputMode={(mode) => {
                setInputMode(mode);
                if (mode === 'image-upload' && currentImageUrl) {
                  const sample = SAMPLE_IMAGES.find((s) => s.id === selectedSampleId) || SAMPLE_IMAGES[0];
                  handleAnalyzeImage(sample.dataUrl, sample.landmarks, sample.name);
                }
              }}
              landmarks={landmarks}
              personDetected={features.personDetected}
              leftKneeAngle={features.leftKneeAngle}
              rightKneeAngle={features.rightKneeAngle}
              cameraError={cameraError}
              videoRef={videoRef}
              canvasRef={canvasRef}
              imageRef={imageRef}
              currentImageUrl={currentImageUrl}
              imageFileName={imageFileName}
              fps={fps}
            />

            {/* Extracted Kinematic Features Telemetry */}
            <FeatureTelemetry features={features} />
          </div>

          {/* Right Column: Current Classification, Counters & History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Current Detected Activity Card */}
            <CurrentActivityCard
              activity={currentActivity}
              confidence={confidence}
              reason={decisionReason}
              ruleMatched={ruleMatched}
              isDetecting={isDetecting}
              features={features}
            />

            {/* Activity Summary Counters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activity Detection Counter
                </h3>
                <span className="text-[11px] text-slate-400">Total Events Logged</span>
              </div>
              <ActivityCounters counts={activityCounts} />
            </div>

            {/* Activity History Table */}
            <ActivityHistoryTable
              history={history}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong>Human Activity Recognition System</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">v1.1.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

