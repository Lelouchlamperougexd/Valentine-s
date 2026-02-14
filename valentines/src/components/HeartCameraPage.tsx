"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import Fireworks from "@fireworks-js/react";
import type { Hands, HandLandmark, HandsResults } from "@mediapipe/hands";
import type { Camera } from "@mediapipe/camera_utils";

const playfairDisplay = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
});

// Detection parameters
const HEART_HOLD_DURATION = 2000; // Hold heart for 2 seconds to proceed
const DETECTION_SMOOTHING = 2;

interface HeartCameraPageProps {
  onComplete: () => void;
}

export default function HeartCameraPage({ onComplete }: HeartCameraPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHeartDetected, setIsHeartDetected] = useState(false);
  const [heartProgress, setHeartProgress] = useState(0);
  const [showLoveMessage, setShowLoveMessage] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [handsDetected, setHandsDetected] = useState(0);
  
  // 3D rotation controlled by hand position
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  
  // Detection buffer for smoothing
  const detectionBuffer = useRef<boolean[]>([]);
  const fistBuffer = useRef<boolean[]>([]);
  const heartStartTime = useRef<number | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const showLoveMessageRef = useRef(false);
  const isHoldingRef = useRef(false);
  const onHandResultsRef = useRef<((results: HandsResults) => void) | null>(null);

  // Simplified heart gesture detection - just check if both hands are close together
  const detectHeartGesture = useCallback((multiHandLandmarks: HandLandmark[][]): { detected: boolean; centerX: number; centerY: number } => {
    if (multiHandLandmarks.length < 2) {
      return { detected: false, centerX: 0.5, centerY: 0.5 };
    }

    const hand1 = multiHandLandmarks[0];
    const hand2 = multiHandLandmarks[1];

    // Get center of each hand (average of all landmarks)
    const getHandCenter = (landmarks: HandLandmark[]) => {
      const sum = landmarks.reduce((acc, lm) => ({ x: acc.x + lm.x, y: acc.y + lm.y }), { x: 0, y: 0 });
      return { x: sum.x / landmarks.length, y: sum.y / landmarks.length };
    };

    const center1 = getHandCenter(hand1);
    const center2 = getHandCenter(hand2);

    // Calculate distance between hand centers
    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) +
      Math.pow(center1.y - center2.y, 2)
    );

    // Calculate overall center (midpoint between both hands)
    const overallCenterX = (center1.x + center2.x) / 2;
    const overallCenterY = (center1.y + center2.y) / 2;

    // Very simple detection: hands are close together (forming a heart shape)
    const handsClose = distance < 0.4;

    console.log('Heart detection:', { distance, handsClose, centerX: overallCenterX, centerY: overallCenterY });

    return { 
      detected: handsClose, 
      centerX: overallCenterX, 
      centerY: overallCenterY 
    };
  }, []);

  // Detect fist gesture - all fingers curled (fingertips below knuckles)
  const detectFistGesture = useCallback((landmarks: HandLandmark[]): boolean => {
    // Finger tip indices: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
    // Corresponding knuckle indices: 2 (thumb), 6 (index), 10 (middle), 14 (ring), 18 (pinky)
    
    const fingerTips = [8, 12, 16, 20]; // Excluding thumb for simplicity
    const fingerKnuckles = [6, 10, 14, 18];
    
    let curledFingers = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const knuckle = landmarks[fingerKnuckles[i]];
      
      // Finger is curled if tip is below (higher y value) the knuckle
      if (tip.y > knuckle.y) {
        curledFingers++;
      }
    }
    
    // Fist = at least 3 fingers curled
    const isFist = curledFingers >= 3;
    
    console.log('Fist detection:', { curledFingers, isFist });
    
    return isFist;
  }, []);

  // Draw hand landmarks on canvas  
  const drawHandLandmarks = useCallback((
    ctx: CanvasRenderingContext2D,
    multiHandLandmarks: HandLandmark[][],
    width: number,
    height: number,
    heartDetected: boolean
  ) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    for (const landmarks of multiHandLandmarks) {
      ctx.strokeStyle = heartDetected ? "rgba(255, 107, 157, 0.9)" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = heartDetected ? 3 : 2;

      for (const [start, end] of connections) {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo((1 - startPoint.x) * width, startPoint.y * height);
        ctx.lineTo((1 - endPoint.x) * width, endPoint.y * height);
        ctx.stroke();
      }

      for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc((1 - landmark.x) * width, landmark.y * height, heartDetected ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = heartDetected ? "#ff6b9d" : "#00ff88";
        ctx.fill();
      }
    }
  }, []);

  // Process hand detection results
  const onHandResults = useCallback((results: HandsResults) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    
    if (!canvas || !ctx || !videoRef.current) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const numHands = results.multiHandLandmarks?.length || 0;
    setHandsDetected(numHands);

    let heartDetected = false;
    let centerX = 0.5;
    let centerY = 0.5;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
      const detection = detectHeartGesture(results.multiHandLandmarks);
      heartDetected = detection.detected;
      centerX = detection.centerX;
      centerY = detection.centerY;
      drawHandLandmarks(ctx, results.multiHandLandmarks, canvas.width, canvas.height, heartDetected);
    } else if (results.multiHandLandmarks && results.multiHandLandmarks.length === 1) {
      // Draw single hand
      const hand = results.multiHandLandmarks[0];
      const isFist = detectFistGesture(hand);
      
      // Smooth fist detection
      fistBuffer.current.push(isFist);
      if (fistBuffer.current.length > 5) {
        fistBuffer.current.shift();
      }
      const smoothedFist = fistBuffer.current.filter(Boolean).length >= 3;
      
      // Update holding state
      if (showLoveMessageRef.current) {
        if (smoothedFist && !isHoldingRef.current) {
          isHoldingRef.current = true;
          setIsHolding(true);
        } else if (!smoothedFist && isHoldingRef.current) {
          isHoldingRef.current = false;
          setIsHolding(false);
        }
      }
      
      drawHandLandmarks(ctx, results.multiHandLandmarks, canvas.width, canvas.height, smoothedFist);
      
      // Track single hand position for rotation (only if not holding)
      const center = hand.reduce((acc, lm) => ({ x: acc.x + lm.x, y: acc.y + lm.y }), { x: 0, y: 0 });
      centerX = center.x / hand.length;
      centerY = center.y / hand.length;
    }

    // Update hand center for 3D rotation or position (after love message is shown)
    if (showLoveMessageRef.current && numHands > 0) {
      if (isHoldingRef.current) {
        // When holding (fist), move the text position
        // Map hand position to screen position (-150 to 150 pixels)
        const posX = (centerX - 0.5) * -300; // Inverted for mirrored camera
        const posY = (centerY - 0.5) * 200;
        setPosition({ x: posX, y: posY });
      } else {
        // When not holding, rotate the text
        // Map hand position to rotation angles
        const rotX = (centerY - 0.5) * -90;
        const rotY = (centerX - 0.5) * -90;
        setRotation({ x: rotX, y: rotY });
      }
    }

    // Smooth detection
    detectionBuffer.current.push(heartDetected);
    if (detectionBuffer.current.length > DETECTION_SMOOTHING) {
      detectionBuffer.current.shift();
    }

    const smoothedDetection = detectionBuffer.current.filter(Boolean).length >= DETECTION_SMOOTHING / 2;
    setIsHeartDetected(smoothedDetection);

    // Track heart hold duration (only before showing love message)
    if (!showLoveMessageRef.current) {
      if (smoothedDetection) {
        if (!heartStartTime.current) {
          heartStartTime.current = Date.now();
        }
        const elapsed = Date.now() - heartStartTime.current;
        const progress = Math.min(elapsed / HEART_HOLD_DURATION, 1);
        setHeartProgress(progress);

        if (progress >= 1) {
          showLoveMessageRef.current = true;
          setShowLoveMessage(true);
        }
      } else {
        heartStartTime.current = null;
        setHeartProgress(0);
      }
    }
  }, [detectHeartGesture, drawHandLandmarks, detectFistGesture]);

  // Keep ref updated with latest callback
  useEffect(() => {
    onHandResultsRef.current = onHandResults;
  }, [onHandResults]);

  // Initialize MediaPipe Hands - runs only once
  useEffect(() => {
    let camera: Camera | null = null;
    
    const initMediaPipe = async () => {
      try {
        const { Hands } = await import("@mediapipe/hands");
        const { Camera } = await import("@mediapipe/camera_utils");

        const hands = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: HandsResults) => {
          if (onHandResultsRef.current) {
            onHandResultsRef.current(results);
          }
        });
        handsRef.current = hands;

        if (videoRef.current) {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          
          await camera.start();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setCameraError("Failed to initialize hand detection. Please ensure camera access is allowed.");
        setIsLoading(false);
      }
    };

    initMediaPipe();
    
    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, []); // Run only once on mount

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* Title - changes based on state */}
      <motion.h2
        className={`text-3xl lg:text-4xl font-semibold mb-6 text-white text-center ${playfairDisplay.className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {!showLoveMessage ? (
          <>Show me your <span className="text-pink-400">heart</span></>
        ) : (
          <>Move your hand to rotate</>
        )}
      </motion.h2>

      {/* Camera container - always visible */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-pink-500/30">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <motion.div
              className="text-white text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Loading camera...
            </motion.div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
            <div className="text-red-400 text-center">{cameraError}</div>
          </div>
        )}

        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-[85vw] max-w-[640px] h-auto"
        />

        {/* Heart detection overlay */}
        <AnimatePresence>
          {isHeartDetected && !showLoveMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Glowing border */}
              <div className="absolute inset-0 border-4 border-pink-500 rounded-2xl animate-pulse" />
              
              {/* Fireworks effect */}
              <Fireworks
                options={{
                  rocketsPoint: { min: 0, max: 100 },
                  hue: { min: 320, max: 360 },
                  delay: { min: 15, max: 30 },
                  decay: { min: 0.015, max: 0.03 },
                  brightness: { min: 50, max: 80 },
                  particles: 50,
                  traceLength: 3,
                  traceSpeed: 10,
                  explosion: 5,
                  intensity: 20,
                  flickering: 50,
                  lineStyle: "round",
                  lineWidth: {
                    explosion: { min: 1, max: 3 },
                    trace: { min: 1, max: 2 },
                  },
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D "I Love You" overlay - appears after heart detected */}
        <AnimatePresence>
          {showLoveMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ perspective: "1000px" }}
            >
              {/* Semi-transparent overlay */}
              <div className={`absolute inset-0 rounded-2xl transition-colors duration-300 ${isHolding ? 'bg-black/60' : 'bg-black/40'}`} />
              
              {/* Holding indicator */}
              {isHolding && (
                <motion.div
                  className="absolute top-4 left-5 -translate-x-1/2 z-20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Move to position
                  </span>
                </motion.div>
              )}
              
              {/* 3D rotating/moving text */}
              <motion.div
                className={`relative z-10 ${isHolding ? 'drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]' : ''}`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translateX(${position.x}px) translateY(${position.y}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                {/* Main text */}
                <h1
                  className={`text-4xl lg:text-6xl font-bold bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl ${playfairDisplay.className}`}
                  style={{
                    textShadow: isHolding 
                      ? "0 0 80px rgba(74, 222, 128, 0.8), 0 0 150px rgba(74, 222, 128, 0.4)"
                      : "0 0 60px rgba(244, 114, 182, 0.8), 0 0 120px rgba(244, 114, 182, 0.4)",
                    WebkitTextStroke: "1px rgba(255,255,255,0.1)",
                  }}
                >
                  Mwuaahhh
                </h1>
              </motion.div>

              {/* Fireworks behind the text */}
              {showLoveMessage && (
                <Fireworks
                  options={{
                    rocketsPoint: { min: 20, max: 80 },
                    hue: { min: 320, max: 360 },
                    delay: { min: 30, max: 60 },
                    decay: { min: 0.015, max: 0.03 },
                    brightness: { min: 50, max: 80 },
                    particles: 40,
                    traceLength: 3,
                    explosion: 4,
                    intensity: 15,
                    flickering: 50,
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: 0.6,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar - only before love message */}
        {!showLoveMessage && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800/50">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${heartProgress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <motion.div
        className="mt-6 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {!showLoveMessage ? (
          <>
            <span className="text-gray-400 text-center text-sm lg:text-base">
              Put both hands together in front of camera and hold for 2 seconds
            </span>
            <span className="text-yellow-500 text-sm font-mono">
              Hands detected: {handsDetected}/2 {isHeartDetected && "- Heart detected!"}
            </span>
          </>
        ) : (
          <>
            <span className="text-pink-400 text-sm">
              {isHolding ? (
                <>Moving - Open hand to rotate</>  
              ) : (
                <>Move hand to rotate - Make a fist to lock and move</>
              )}
            </span>
            <motion.button
              className="mt-4 px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
            >
              Press Here!
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
