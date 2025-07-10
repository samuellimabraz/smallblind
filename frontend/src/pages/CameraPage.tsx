import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraCapture } from "@/components/CameraCapture";
import { VisionAnalysis } from "@/components/VisionAnalysis";
import { AnalysisConfiguration, AnalysisConfig } from "@/components/AnalysisConfiguration";
import { objectDetectionService } from "@/services/objectDetectionService";
import { imageDescriptionService } from "@/services/imageDescriptionService";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";
import { VisionAnalysisResult } from "@/types";

const CameraPage = () => {
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState<
    VisionAnalysisResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);

  // Default configuration
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    objectDetection: {
      enabled: true,
      model: "Xenova/yolos-tiny",
      confidenceThreshold: 0.5,
      maxObjects: 20,
      dtype: "q4",
    },
    sceneDescription: {
      enabled: true,
      model: "SmolVLM2-2.2B-Instruct",
      prompt: "Describe this scene in detail. What do you see? What is happening? Include details about objects, people, actions, colors, lighting to help a blind person understand the scene.",
      maxTokens: 120,
      doSample: true,
    },
    textExtraction: {
      enabled: false,
      model: "SmolVLM2-2.2B-Instruct",
      prompt: "Read and transcribe all visible text in this image. Include signs, labels, documents, handwriting, and any other text you can see. If there is no text, say 'No text found'.",
      maxTokens: 100,
      doSample: false,
    },
    faceRecognition: {
      enabled: false,
      threshold: 0.5,
    },
  });

  const handleImageCapture = async (imageFile: File) => {
    setCapturedImage(imageFile);
    setIsProcessing(true);

    // Create a data URL from the file for displaying in results
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(imageFile);
    });

    console.log("CameraPage: Created imageDataUrl:", imageDataUrl.substring(0, 50) + "...");
    console.log("CameraPage: Image file info:", {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    try {
      const results: VisionAnalysisResult[] = [];

      // Process object detection if enabled
      if (analysisConfig.objectDetection.enabled) {
        try {
          const result = await objectDetectionService.detectObjects(imageFile, {
            model: analysisConfig.objectDetection.model,
            threshold: analysisConfig.objectDetection.confidenceThreshold,
            maxObjects: analysisConfig.objectDetection.maxObjects,
            dtype: analysisConfig.objectDetection.dtype,
          });

          if (result.success) {
            console.log("Raw detection result:", result);

            const objects = result.data.detections.map((detection) => {
              console.log("Processing detection:", detection);

              const boundingBox = {
                x: detection.box.xmin,
                y: detection.box.ymin,
                width: detection.box.width,
                height: detection.box.height,
              };

              return {
                label: detection.label,
                confidence: detection.score,
                boundingBox,
              };
            });

            const description =
              objects.length > 0
                ? `I can see ${objects.map((obj) => obj.label).join(", ")} in the image.`
                : "No objects detected in the image.";

            results.push({
              type: "object-detection",
              confidence:
                objects.length > 0
                  ? Math.max(...objects.map((obj) => obj.confidence))
                  : 0,
              description,
              objects,
              timestamp: new Date(),
              processingTime: result.data.processingTime,
              model: result.data.model,
              imageFile,
              imageDataUrl, // Add the image data URL to the result
            });
            console.log("CameraPage: Added object detection result with imageDataUrl:", imageDataUrl ? "YES" : "NO");
          }
        } catch (error) {
          console.error("Error in object detection:", error);
          results.push({
            type: "object-detection",
            confidence: 0,
            description: `Unable to detect objects in the image. ${error instanceof Error ? error.message : "Unknown error"}`,
            objects: [],
            timestamp: new Date(),
          });
        }
      }

      // Process scene description if enabled
      if (analysisConfig.sceneDescription.enabled) {
        try {
          const result = await imageDescriptionService.describeImage(imageFile, {
            model: analysisConfig.sceneDescription.model,
            prompt: analysisConfig.sceneDescription.prompt,
            maxNewTokens: analysisConfig.sceneDescription.maxTokens,
            doSample: analysisConfig.sceneDescription.doSample,
          });

          if (result.success) {
            results.push({
              type: "scene-description",
              confidence: 0.8,
              description: result.data.description,
              timestamp: new Date(),
              processingTime: result.data.processingTime,
              model: result.data.model,
            });
          }
        } catch (error) {
          console.error("Error in scene description:", error);
          results.push({
            type: "scene-description",
            confidence: 0,
            description: `Unable to describe the scene. ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: new Date(),
          });
        }
      }

      // Process text extraction if enabled
      if (analysisConfig.textExtraction.enabled) {
        try {
          const result = await imageDescriptionService.describeImage(imageFile, {
            model: analysisConfig.textExtraction.model,
            prompt: analysisConfig.textExtraction.prompt,
            maxNewTokens: analysisConfig.textExtraction.maxTokens,
            doSample: analysisConfig.textExtraction.doSample,
          });

          if (result.success) {
            const text = result.data.description;
            const hasText = text && text.toLowerCase() !== "no text found" && text.trim().length > 0;

            results.push({
              type: "ocr",
              confidence: hasText ? 0.8 : 0,
              description: hasText ? `Text found: "${text}"` : "No text detected in the image.",
              text: hasText ? text : "",
              timestamp: new Date(),
              processingTime: result.data.processingTime,
              model: result.data.model,
            });
          }
        } catch (error) {
          console.error("Error in text extraction:", error);
          results.push({
            type: "ocr",
            confidence: 0,
            description: `Unable to read text from the image. ${error instanceof Error ? error.message : "Unknown error"}`,
            text: "",
            timestamp: new Date(),
          });
        }
      }

      // Face recognition implementation
      if (analysisConfig.faceRecognition.enabled) {
        try {
          console.log("Starting facial recognition...");

          const result = await facialRecognitionAPI.recognizeFace(imageFile, analysisConfig.faceRecognition.threshold);

          console.log("Face recognition result:", JSON.stringify(result, null, 2));

          if (result.success) {
            console.log("Face recognition successful");

            if (result.results && Array.isArray(result.results)) {
              console.log(`Received ${result.results.length} face results`);

              // Check if any faces were detected
              if (result.results.length > 0) {
                console.log("Faces detected in the image");

                // Filter faces that matched with a registered person
                const recognizedFaces = result.results.filter(
                  (face: any) => face.personId
                );

                console.log(`Found ${recognizedFaces.length} recognized faces out of ${result.results.length} total faces`);
                console.log("Recognized faces:", JSON.stringify(recognizedFaces, null, 2));

                const description = recognizedFaces.length > 0
                  ? `Recognized ${recognizedFaces.length} person(s): ${recognizedFaces.map((face: any) => face.personName).join(", ")}`
                  : "No recognized faces found in the image.";

                results.push({
                  type: "face-recognition",
                  confidence: recognizedFaces.length > 0
                    ? Math.max(...recognizedFaces.map((face: any) => face.confidence))
                    : 0,
                  description,
                  faces: recognizedFaces.map((face: any) => ({
                    personId: face.personId,
                    personName: face.personName,
                    confidence: face.confidence,
                    boundingBox: face.boundingBox,
                  })),
                  timestamp: new Date(),
                  imageFile,
                  imageDataUrl, // Add the image data URL
                });
                console.log("CameraPage: Added face recognition result with imageDataUrl:", imageDataUrl ? "YES" : "NO");
              } else {
                console.log("No faces detected in the image");
                results.push({
                  type: "face-recognition",
                  confidence: 0,
                  description: "No faces detected in the image.",
                  faces: [],
                  timestamp: new Date(),
                  imageFile,
                  imageDataUrl,
                });
              }
            } else {
              console.log("No results array in the response");
              results.push({
                type: "face-recognition",
                confidence: 0,
                description: "No faces detected in the image.",
                faces: [],
                timestamp: new Date(),
                imageFile,
                imageDataUrl,
              });
            }
          } else {
            console.log("Face recognition failed:", result.error);
            results.push({
              type: "face-recognition",
              confidence: 0,
              description: `Face recognition failed: ${result.error || "Unknown error"}`,
              faces: [],
              timestamp: new Date(),
              imageFile,
              imageDataUrl,
            });
          }
        } catch (error) {
          console.error("Error in face recognition:", error);
          results.push({
            type: "face-recognition",
            confidence: 0,
            description: `Face recognition failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            faces: [],
            timestamp: new Date(),
            imageFile,
            imageDataUrl,
          });
        }
      }

      setAnalysisResults(results);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setAnalysisResults([]);
    setCapturedImage(null);
  };

  const getEnabledAnalysisCount = () => {
    return Object.values(analysisConfig).filter(config => config.enabled).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Camera Analysis
              </h1>
              <p className="text-gray-600">
                Capture images and get AI-powered analysis ({getEnabledAnalysisCount()} analysis types enabled)
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Camera and Controls */}
          <div className="space-y-6">
            {/* Camera Capture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Camera
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CameraCapture
                  onCapture={handleImageCapture}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>

            {/* Analysis Configuration */}
            <AnalysisConfiguration
              config={analysisConfig}
              onConfigChange={setAnalysisConfig}
            />

            {/* Clear Results Button */}
            {analysisResults.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                    className="flex items-center w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Results
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <VisionAnalysis
                  results={analysisResults}
                  isLoading={isProcessing}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How to Use Guide */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
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

                <TabsContent value="analysis" className="mt-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      • Enable/disable different analysis types in the configuration
                    </p>
                    <p>• Object Detection identifies and locates items in the image</p>
                    <p>• Scene Description provides detailed contextual information</p>
                    <p>• Text Extraction (OCR) reads and transcribes visible text</p>
                    <p>• Face Recognition identifies registered people</p>
                  </div>
                </TabsContent>

                <TabsContent value="configuration" className="mt-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      • Adjust confidence thresholds for more or less sensitive detection
                    </p>
                    <p>• Choose different AI models for different quality/speed tradeoffs</p>
                    <p>• Customize prompts for scene description and text extraction</p>
                    <p>• Control maximum tokens for response length</p>
                    <p>• Enable creative sampling for more varied AI responses</p>
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
