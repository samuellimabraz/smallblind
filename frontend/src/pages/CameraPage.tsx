import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  ArrowLeft,
  Eye,
  FileText,
  Users,
  Settings as SettingsIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { VisionAnalysis } from "@/components/VisionAnalysis";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { VisionAnalysisResult, AccessibilitySettings } from "@/types";
import { visionModelsService } from "@/services/visionModels";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";
import { speechService } from "@/services/speechService";

const CameraPage = () => {
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState<
    VisionAnalysisResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState<string[]>([
    "object-detection",
    "scene-description",
  ]);

  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    });

  const analysisOptions = [
    {
      id: "object-detection",
      label: "Object Detection",
      icon: Eye,
      description: "Identify objects in the image",
    },
    {
      id: "scene-description",
      label: "Scene Description",
      icon: Eye,
      description: "Describe what's happening in the scene",
    },
    {
      id: "ocr",
      label: "Read Text",
      icon: FileText,
      description: "Extract and read text from the image",
    },
    {
      id: "face-recognition",
      label: "Face Recognition",
      icon: Users,
      description: "Recognize registered people",
    },
  ];

  const handleImageCapture = async (imageFile: File) => {
    setCapturedImage(imageFile);
    setIsProcessing(true);
    setAnalysisResults([]);

    try {
      const results: VisionAnalysisResult[] = [];

      // Run vision model analysis
      if (
        analysisMode.some((mode) =>
          ["object-detection", "scene-description", "ocr"].includes(mode),
        )
      ) {
        const visionResults = await visionModelsService.analyzeImage(
          imageFile,
          analysisMode.filter((mode) =>
            ["object-detection", "scene-description", "ocr"].includes(mode),
          ),
        );
        results.push(...visionResults);
      }

      // Run facial recognition if enabled
      if (analysisMode.includes("face-recognition")) {
        try {
          const faceResult =
            await facialRecognitionAPI.recognizeFace(imageFile);
          if (faceResult.faces && faceResult.faces.length > 0) {
            const recognizedFaces = faceResult.faces.map((face: any) => ({
              personId: face.personId,
              personName: face.personName || "Unknown",
              confidence: face.confidence,
              boundingBox: face.boundingBox,
            }));

            results.push({
              type: "face-recognition" as const,
              confidence:
                recognizedFaces.length > 0
                  ? Math.max(...recognizedFaces.map((f) => f.confidence))
                  : 0,
              description:
                recognizedFaces.length > 0
                  ? `Recognized: ${recognizedFaces.map((f) => f.personName).join(", ")}`
                  : "Faces detected but not recognized",
              faces: recognizedFaces,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.warn("Face recognition failed:", error);
          // Continue with other analysis even if face recognition fails
        }
      }

      setAnalysisResults(results);

      // Announce completion
      const analysisCount = results.filter((r) => r.confidence > 0.3).length;
      speechService.speakInstruction(
        `Analysis complete. Found ${analysisCount} result${analysisCount !== 1 ? "s" : ""}.`,
      );
    } catch (error) {
      console.error("Analysis failed:", error);
      speechService.speakError("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAnalysisMode = (mode: string) => {
    setAnalysisMode((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  };

  const reanalyzeImage = () => {
    if (capturedImage) {
      handleImageCapture(capturedImage);
    }
  };

  const clearResults = () => {
    setAnalysisResults([]);
    setCapturedImage(null);
    speechService.speakInstruction("Results cleared. Ready for new analysis.");
  };

  useEffect(() => {
    speechService.speakInstruction(
      "Camera Analysis. Capture images and get AI-powered analysis. Configure analysis modes and use voice commands.",
    );

    // Voice command handling
    const handleVoiceCommands = async () => {
      try {
        const command = await speechService.startListening();
        const result = speechService.processVoiceCommand(command);

        if (result?.action === "analyze") {
          const type = result.parameters?.type;
          if (type && capturedImage) {
            setAnalysisMode([type]);
            handleImageCapture(capturedImage);
          }
        } else if (
          result?.action === "camera" &&
          result.parameters?.action === "capture"
        ) {
          // This will be handled by the CameraCapture component
        }
      } catch (error) {
        // Voice recognition not available or failed
      }
    };

    // Set up voice command listener (optional)
    if (accessibilitySettings.voiceCommands) {
      // Voice commands will be handled by individual components
    }
  }, [capturedImage, accessibilitySettings.voiceCommands]);

  const handleAccessibilityChange = (settings: AccessibilitySettings) => {
    setAccessibilitySettings(settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => navigate("/menu")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Camera Analysis
                </h1>
                <p className="text-gray-600">
                  Capture and analyze images with AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Controls */}
        <div className="mb-6">
          <AccessibilityControls onSettingsChange={handleAccessibilityChange} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Camera and Controls */}
          <div className="space-y-6">
            {/* Camera Capture */}
            <CameraCapture
              onCapture={handleImageCapture}
              isProcessing={isProcessing}
            />

            {/* Analysis Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Analysis Modes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                        analysisMode.includes(option.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => toggleAnalysisMode(option.id)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <option.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {option.label}
                        </span>
                        {analysisMode.includes(option.id) && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={reanalyzeImage}
                    disabled={!capturedImage || isProcessing}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reanalyze</span>
                  </Button>
                  <Button
                    onClick={clearResults}
                    disabled={analysisResults.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            <VisionAnalysis
              results={analysisResults}
              isLoading={isProcessing}
            />

            {/* Analysis Summary */}
            {analysisResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Analyses:</span>
                      <Badge variant="outline">{analysisResults.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>High Confidence Results:</span>
                      <Badge variant="outline">
                        {
                          analysisResults.filter((r) => r.confidence > 0.8)
                            .length
                        }
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Objects Detected:</span>
                      <Badge variant="outline">
                        {analysisResults
                          .filter((r) => r.type === "object-detection")
                          .reduce(
                            (acc, r) => acc + (r.objects?.length || 0),
                            0,
                          )}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Faces Recognized:</span>
                      <Badge variant="outline">
                        {analysisResults
                          .filter((r) => r.type === "face-recognition")
                          .reduce(
                            (acc, r) =>
                              acc +
                              (r.faces?.filter(
                                (f) => f.personName !== "Unknown",
                              ).length || 0),
                            0,
                          )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="voice">Voice Commands</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="mt-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      • Point your camera at objects, scenes, or text you want
                      to analyze
                    </p>
                    <p>
                      • Press the capture button or use the spacebar to take a
                      photo
                    </p>
                    <p>• Results will appear automatically after processing</p>
                    <p>• Use good lighting for best results</p>
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="mt-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Say "take photo" to capture an image</p>
                    <p>• Say "describe" for scene description</p>
                    <p>• Say "read text" for OCR analysis</p>
                    <p>• Say "find objects" for object detection</p>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="mt-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Select which analysis modes you want to use</p>
                    <p>
                      • Higher confidence scores indicate more accurate results
                    </p>
                    <p>
                      • Face recognition requires people to be registered first
                    </p>
                    <p>• Click the speaker icon to hear results read aloud</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
