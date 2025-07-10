import React, { useRef, useCallback, useState, useEffect } from "react";
import { Camera, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageFile: File) => void;
  isProcessing?: boolean;
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  isProcessing = false,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Prefer back camera on mobile
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (err) {
      const errorMessage = "Unable to access camera. Please check permissions.";
      setError(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log('CameraCapture: Capturing photo', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('CameraCapture: Blob created', {
          blobSize: blob.size,
          blobType: blob.type
        });
        
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        
        console.log('CameraCapture: File created', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified
        });
        
        onCapture(file);
      } else {
        console.error('CameraCapture: Failed to create blob from canvas');
      }
    }, "image/jpeg", 0.9);
  }, [onCapture, isStreamActive]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" && !isProcessing) {
        event.preventDefault();
        capturePhoto();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [capturePhoto, isProcessing]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto max-h-96 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-white text-center p-4">
              <p className="mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isStreamActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4 space-x-4">
        <Button
          onClick={capturePhoto}
          disabled={!isStreamActive || isProcessing}
          size="lg"
          className="flex items-center space-x-2"
        >
          <Camera className="h-5 w-5" />
          <span>{isProcessing ? "Processing..." : "Capture Photo"}</span>
        </Button>

        <Button
          onClick={isStreamActive ? stopCamera : startCamera}
          variant="outline"
          size="lg"
        >
          {isStreamActive ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Start
            </>
          )}
        </Button>
      </div>

      <div className="mt-2 text-center text-sm text-gray-600">
        <p>Press Space to capture photo</p>
      </div>
    </div>
  );
};
