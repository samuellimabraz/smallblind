import React, { useEffect } from "react";
import { Eye, FileText, Users, AlertCircle, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisionAnalysisResult } from "@/types";
import { speechService } from "@/services/speechService";

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
  const getIcon = (type: string) => {
    switch (type) {
      case "object-detection":
        return <Eye className="h-4 w-4" />;
      case "ocr":
        return <FileText className="h-4 w-4" />;
      case "scene-description":
        return <Eye className="h-4 w-4" />;
      case "face-recognition":
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "object-detection":
        return "Objects";
      case "ocr":
        return "Text";
      case "scene-description":
        return "Scene";
      case "face-recognition":
        return "Faces";
      default:
        return "Analysis";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const speakResult = (result: VisionAnalysisResult) => {
    speechService.speakAnalysisResult(result.description);
  };

  const speakAllResults = () => {
    const combinedDescription = results
      .filter((result) => result.confidence > 0.3)
      .map((result) => result.description)
      .join(". ");

    if (combinedDescription) {
      speechService.speakAnalysisResult(
        `Analysis complete. ${combinedDescription}`,
      );
    } else {
      speechService.speakAnalysisResult(
        "Analysis complete, but no significant results were found.",
      );
    }
  };

  // Automatically announce results when they change
  useEffect(() => {
    if (results.length > 0 && !isLoading) {
      speakAllResults();
    }
  }, [results, isLoading]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg">Analyzing image...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">No analysis results yet</p>
          <p className="text-sm text-gray-500">
            Capture an image to begin analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Analysis Results
          </CardTitle>
          <Button
            onClick={speakAllResults}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            aria-label="Read all results aloud"
          >
            <Volume2 className="h-4 w-4" />
            <span className="sr-only">Read aloud</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="space-y-3 p-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getIcon(result.type)}
                    <span className="font-medium text-sm">
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={`text-white ${getConfidenceColor(result.confidence)}`}
                    >
                      {Math.round(result.confidence * 100)}%
                    </Badge>
                    <Button
                      onClick={() => speakResult(result)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      aria-label={`Read ${getTypeLabel(result.type)} result aloud`}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {result.description}
                </p>

                {/* Object detection details */}
                {result.objects && result.objects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Detected objects:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.objects.map((obj, objIndex) => (
                        <Badge
                          key={objIndex}
                          variant="outline"
                          className="text-xs"
                        >
                          {obj.label} ({Math.round(obj.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Face recognition details */}
                {result.faces && result.faces.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Recognized faces:
                    </p>
                    <div className="space-y-1">
                      {result.faces.map((face, faceIndex) => (
                        <div
                          key={faceIndex}
                          className="flex items-center justify-between text-xs"
                        >
                          <span>{face.personName || "Unknown person"}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(face.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OCR text */}
                {result.text && result.text.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    "{result.text}"
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {result.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
