import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, CameraOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { speechService } from "@/services/speechService";

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
  const [isListening, setIsListening] = useState(false);

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
        speechService.speakInstruction(
          "Camera started. You can now take a photo or give voice commands.",
        );
      }
    } catch (err) {
      const errorMessage = "Unable to access camera. Please check permissions.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
      speechService.speakInstruction("Camera stopped.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `capture_${timestamp}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          speechService.speakInstruction("Photo captured. Processing image...");
        }
      },
      "image/jpeg",
      0.9,
    );
  }, [onCapture, isStreamActive]);

  const toggleVoiceListening = useCallback(async () => {
    if (isListening) {
      setIsListening(false);
      speechService.stop();
      return;
    }

    try {
      setIsListening(true);
      speechService.speakInstruction("Listening for voice commands...");

      const command = await speechService.startListening();
      const result = speechService.processVoiceCommand(command);

      if (result) {
        switch (result.action) {
          case "camera":
            if (result.parameters?.action === "capture") {
              capturePhoto();
            }
            break;
          case "help":
            speechService.speakInstruction(
              'Available commands: "take photo" to capture, "describe" for scene description, "read text" for OCR, "find objects" for detection.',
            );
            break;
          default:
            speechService.speakInstruction(
              "Command not recognized in camera mode.",
            );
        }
      } else {
        speechService.speakInstruction(
          'Command not recognized. Say "help" for available commands.',
        );
      }
    } catch (error) {
      speechService.speakError("Voice recognition failed. Please try again.");
    } finally {
      setIsListening(false);
    }
  }, [isListening, capturePhoto]);

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
      if (event.code === "KeyV") {
        event.preventDefault();
        toggleVoiceListening();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [capturePhoto, toggleVoiceListening, isProcessing]);

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Video stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-96 bg-black"
            style={{ display: isStreamActive ? "block" : "none" }}
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Camera Not Available</p>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="text-white border-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!isStreamActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-medium">Starting Camera...</p>
              </div>
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-4 left-4 space-y-2">
            {isStreamActive && (
              <Badge variant="secondary" className="bg-green-500 text-white">
                <Camera className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            {isListening && (
              <Badge
                variant="secondary"
                className="bg-blue-500 text-white animate-pulse"
              >
                <Volume2 className="h-3 w-3 mr-1" />
                Listening
              </Badge>
            )}
          </div>

          {/* Control buttons overlay */}
          {isStreamActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4">
                <Button
                  onClick={capturePhoto}
                  disabled={isProcessing}
                  size="lg"
                  className="h-16 w-16 rounded-full bg-white border-4 border-gray-300 hover:border-gray-400 text-gray-900 hover:text-gray-900"
                  aria-label="Capture photo (Spacebar)"
                >
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8" />
                  )}
                </Button>

                <Button
                  onClick={toggleVoiceListening}
                  disabled={isProcessing}
                  size="lg"
                  variant={isListening ? "default" : "outline"}
                  className="h-16 w-16 rounded-full"
                  aria-label="Voice commands (V key)"
                >
                  {isListening ? (
                    <VolumeX className="h-6 w-6" />
                  ) : (
                    <Volume2 className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Press{" "}
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">Space</kbd>{" "}
            to capture photo or{" "}
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">V</kbd> for
            voice commands
          </p>
          <p className="text-xs text-gray-500">
            Voice commands: "take photo", "describe", "read text", "find
            objects"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
