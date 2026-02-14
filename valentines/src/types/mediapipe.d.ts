declare module "@mediapipe/hands" {
  export interface HandLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface Handedness {
    label: "Left" | "Right";
    score: number;
  }

  export interface HandsResults {
    multiHandLandmarks: HandLandmark[][];
    multiHandedness: Handedness[][];
    image: HTMLVideoElement | HTMLCanvasElement;
  }

  export interface HandsOptions {
    maxNumHands?: number;
    modelComplexity?: 0 | 1;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface HandsConfig {
    locateFile: (file: string) => string;
  }

  export class Hands {
    constructor(config: HandsConfig);
    setOptions(options: HandsOptions): void;
    onResults(callback: (results: HandsResults) => void): void;
    send(input: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
  }
}

declare module "@mediapipe/camera_utils" {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: string;
  }

  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      options: CameraOptions
    );
    start(): Promise<void>;
    stop(): void;
  }
}
