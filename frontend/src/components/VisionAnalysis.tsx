import React from "react";
import { Eye, FileText, Users, Search, Clock, CheckCircle, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisionAnalysisResult } from "@/types";
import { ImageWithBoundingBoxes } from "./ImageWithBoundingBoxes";

interface VisionAnalysisProps {
  results: VisionAnalysisResult[];
  isLoading?: boolean;
  className?: string;
}

export const VisionAnalysis: React.FC<VisionAnalysisProps> = ({
  results,
  isLoading = false,
  className = "",
}) => {
  // Debug logging
  React.useEffect(() => {
    results.forEach((result, index) => {
      if (result.type === "object-detection" || result.type === "face-recognition") {
        console.log(`VisionAnalysis: Result ${index} (${result.type}) has imageDataUrl:`, result.imageDataUrl ? "YES" : "NO");
        if (result.imageDataUrl) {
          console.log(`VisionAnalysis: ImageDataUrl preview:`, result.imageDataUrl.substring(0, 50) + "...");
        }
      }
    });
  }, [results]);

  const getTypeIcon = (type: VisionAnalysisResult["type"]) => {
    switch (type) {
      case "object-detection":
        return Search;
      case "scene-description":
        return Eye;
      case "ocr":
        return FileText;
      case "face-recognition":
        return Users;
      default:
        return Eye;
    }
  };

  const getTypeLabel = (type: VisionAnalysisResult["type"]) => {
    switch (type) {
      case "object-detection":
        return "Object Detection";
      case "scene-description":
        return "Scene Description";
      case "ocr":
        return "Text Recognition";
      case "face-recognition":
        return "Face Recognition";
      default:
        return "Analysis";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(timestamp);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing image...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analysis results yet</p>
            <p className="text-sm">Capture an image to see AI analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result, index) => {
        const Icon = getTypeIcon(result.type);
        return (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Icon className="h-5 w-5 mr-2 text-blue-600" />
                  {getTypeLabel(result.type)}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(result.timestamp)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Main description - only for scene-description and ocr, not object-detection */}
              {result.type !== "object-detection" && (
                <div className={`p-3 rounded-lg ${result.type === "scene-description" ? "bg-blue-50" :
                  result.type === "ocr" ? "bg-green-50" : "bg-gray-50"
                  }`}>
                  <p className={`${result.type === "scene-description" ? "text-blue-900" :
                    result.type === "ocr" ? "text-green-900" : "text-gray-800"
                    } ${result.type === "scene-description" ? "text-base leading-relaxed" : ""}`}>
                    {result.description}
                  </p>
                </div>
              )}

              {/* Enhanced processing info */}
              {(result.processingTime || result.model) && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  {result.processingTime && (
                    <div className="flex items-center">
                      <Cpu className="h-3 w-3 mr-1" />
                      Processing: {result.processingTime}ms
                    </div>
                  )}
                  {result.model && (
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {result.model}
                      </Badge>
                    </div>
                  )}
                  {result.type === "scene-description" && (
                    <div className="flex items-center text-blue-600">
                      <Eye className="h-3 w-3 mr-1" />
                      Detailed scene analysis
                    </div>
                  )}
                  {result.type === "ocr" && (
                    <div className="flex items-center text-green-600">
                      <FileText className="h-3 w-3 mr-1" />
                      Text extraction
                    </div>
                  )}
                </div>
              )}

              {/* Image with bounding boxes for object detection */}
              {result.type === "object-detection" && result.objects && result.objects.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Eye className="h-4 w-4 mr-1 text-blue-600" />
                    Detected Objects
                  </h4>
                  <ImageWithBoundingBoxes
                    imageDataUrl={result.imageDataUrl}
                    objects={result.objects}
                    className="w-full"
                  />
                </div>
              )}

              {/* Image with bounding boxes for face recognition */}
              {result.type === "face-recognition" && result.faces && result.faces.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-600" />
                    Recognized Faces
                  </h4>
                  <ImageWithBoundingBoxes
                    imageDataUrl={result.imageDataUrl}
                    objects={result.faces.map(face => ({
                      label: face.personName || "Unknown",
                      confidence: face.confidence,
                      boundingBox: face.boundingBox || { x: 0, y: 0, width: 0, height: 0 }
                    }))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Objects detected */}
              {result.objects && result.objects.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    Objects Detected ({result.objects.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {result.objects.map((obj, objIndex) => (
                      <Badge
                        key={objIndex}
                        variant="outline"
                        className="justify-between p-2"
                      >
                        <span className="truncate">{obj.label}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Text extracted - Enhanced display */}
              {result.text && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-green-600" />
                    Extracted Text
                  </h4>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-900 font-mono text-sm whitespace-pre-wrap">
                      {result.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Faces recognized */}
              {result.faces && result.faces.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-600" />
                    People Recognized ({result.faces.length})
                  </h4>
                  <div className="space-y-2">
                    {result.faces.map((face, faceIndex) => (
                      <div
                        key={faceIndex}
                        className="flex items-center justify-between p-2 bg-purple-50 rounded-lg"
                      >
                        <span className="font-medium text-purple-900">
                          {face.personName || "Unknown Person"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(face.confidence * 100)}% match
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
