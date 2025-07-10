import React, { useState, useEffect } from "react";
import {
    Eye,
    FileText,
    Users,
    Search,
    Settings,
    ChevronDown,
    ChevronUp,
    Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { objectDetectionService } from "@/services/objectDetectionService";
import { imageDescriptionService } from "@/services/imageDescriptionService";

export interface AnalysisConfig {
    objectDetection: {
        enabled: boolean;
        model: string;
        confidenceThreshold: number;
        maxObjects: number;
        dtype: string;
    };
    sceneDescription: {
        enabled: boolean;
        model: string;
        prompt: string;
        maxTokens: number;
        doSample: boolean;
    };
    textExtraction: {
        enabled: boolean;
        model: string;
        prompt: string;
        maxTokens: number;
        doSample: boolean;
    };
    faceRecognition: {
        enabled: boolean;
        threshold: number;
    };
}

interface AnalysisConfigurationProps {
    config: AnalysisConfig;
    onConfigChange: (config: AnalysisConfig) => void;
    className?: string;
}

interface ModelInfo {
    models: string[];
    quantizationTypes: string[];
    default: {
        model: string;
        dtype: string;
    };
}

interface DescriptionModelInfo {
    models: Array<{
        modelType: string;
        modelId: string;
    }>;
    default: {
        model: string;
    };
}

const defaultScenePrompt = "Describe this scene in detail. What do you see? What is happening? Include details about objects, people, actions, colors, lighting to help a blind person understand the scene.";
const defaultTextPrompt = "Read and transcribe all visible text in this image. Include signs, labels, documents, handwriting, and any other text you can see. If there is no text, say 'No text found'.";

export const AnalysisConfiguration: React.FC<AnalysisConfigurationProps> = ({
    config,
    onConfigChange,
    className = "",
}) => {
    const [objectDetectionModels, setObjectDetectionModels] = useState<ModelInfo | null>(null);
    const [descriptionModels, setDescriptionModels] = useState<DescriptionModelInfo | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadModels = async () => {
            try {
                setIsLoading(true);

                const [objModels, descModels] = await Promise.all([
                    objectDetectionService.getAvailableModels(),
                    imageDescriptionService.getAvailableModels(),
                ]);

                // Handle both "data" and "date" (typo in backend) properties
                const objModelData = objModels.data || objModels.date;
                const descModelData = descModels.data || descModels.date;

                setObjectDetectionModels(objModelData);
                setDescriptionModels(descModelData);
            } catch (error) {
                console.error("Error loading models:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadModels();
    }, []);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const updateConfig = (section: keyof AnalysisConfig, updates: Partial<AnalysisConfig[keyof AnalysisConfig]>) => {
        onConfigChange({
            ...config,
            [section]: {
                ...config[section],
                ...updates,
            },
        });
    };

    const analysisOptions = [
        {
            id: "objectDetection",
            label: "Object Detection",
            icon: Search,
            description: "Identify and locate objects in the image with bounding boxes",
            color: "blue",
        },
        {
            id: "sceneDescription",
            label: "Scene Description",
            icon: Eye,
            description: "Get a detailed AI description of the scene",
            color: "green",
        },
        {
            id: "textExtraction",
            label: "Text Extraction",
            icon: FileText,
            description: "Extract and transcribe all visible text",
            color: "purple",
        },
        {
            id: "faceRecognition",
            label: "Face Recognition",
            icon: Users,
            description: "Recognize registered people (requires setup)",
            color: "orange",
        },
    ];

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading models...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Analysis Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Object Detection */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="objectDetection"
                            checked={config.objectDetection.enabled}
                            onCheckedChange={(checked) =>
                                updateConfig("objectDetection", { enabled: checked === true })
                            }
                        />
                        <div className="flex-1">
                            <Label htmlFor="objectDetection" className="text-sm font-medium cursor-pointer flex items-center">
                                <Search className="h-4 w-4 mr-2 text-blue-600" />
                                Object Detection
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                Identify and locate objects with configurable precision
                            </p>
                        </div>
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSection("objectDetection")}
                                    disabled={!config.objectDetection.enabled}
                                >
                                    {expandedSections.has("objectDetection") ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {config.objectDetection.enabled && expandedSections.has("objectDetection") && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
                                        {/* Model Selection */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Model
                                            </Label>
                                            <Select
                                                value={config.objectDetection.model}
                                                onValueChange={(value) => updateConfig("objectDetection", { model: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {objectDetectionModels?.models.map((model) => (
                                                        <SelectItem key={model} value={model}>
                                                            <div className="flex items-center justify-between w-full">
                                                                <span>{model}</span>
                                                                {model === objectDetectionModels.default.model && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Confidence Threshold */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Confidence Threshold
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(config.objectDetection.confidenceThreshold * 100)}%
                                                </Badge>
                                            </Label>
                                            <Slider
                                                value={[config.objectDetection.confidenceThreshold]}
                                                onValueChange={(value) =>
                                                    updateConfig("objectDetection", { confidenceThreshold: value[0] })
                                                }
                                                max={1}
                                                min={0.1}
                                                step={0.05}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Less sensitive (10%)</span>
                                                <span>More sensitive (100%)</span>
                                            </div>
                                        </div>

                                        {/* Max Objects */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Maximum Objects
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {config.objectDetection.maxObjects === 0 ? "Unlimited" : config.objectDetection.maxObjects}
                                                </Badge>
                                            </Label>
                                            <Slider
                                                value={[config.objectDetection.maxObjects]}
                                                onValueChange={(value) =>
                                                    updateConfig("objectDetection", { maxObjects: value[0] })
                                                }
                                                max={50}
                                                min={0}
                                                step={1}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Unlimited (0)</span>
                                                <span>50 objects</span>
                                            </div>
                                        </div>

                                        {/* Quantization Type */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Quantization (Performance vs Quality)
                                            </Label>
                                            <Select
                                                value={config.objectDetection.dtype}
                                                onValueChange={(value) => updateConfig("objectDetection", { dtype: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select quantization" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {objectDetectionModels?.quantizationTypes.map((dtype) => (
                                                        <SelectItem key={dtype} value={dtype}>
                                                            <div className="flex items-center justify-between w-full">
                                                                <span className="font-mono">{dtype}</span>
                                                                <div className="flex items-center space-x-2">
                                                                    {dtype === objectDetectionModels.default.dtype && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Default
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                <Separator />

                {/* Scene Description */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="sceneDescription"
                            checked={config.sceneDescription.enabled}
                            onCheckedChange={(checked) =>
                                updateConfig("sceneDescription", { enabled: checked === true })
                            }
                        />
                        <div className="flex-1">
                            <Label htmlFor="sceneDescription" className="text-sm font-medium cursor-pointer flex items-center">
                                <Eye className="h-4 w-4 mr-2 text-green-600" />
                                Scene Description
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                Detailed AI description of the scene with customizable prompts
                            </p>
                        </div>
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSection("sceneDescription")}
                                    disabled={!config.sceneDescription.enabled}
                                >
                                    {expandedSections.has("sceneDescription") ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {config.sceneDescription.enabled && expandedSections.has("sceneDescription") && (
                                    <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-4">
                                        {/* Model Selection */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Model
                                            </Label>
                                            <Select
                                                value={config.sceneDescription.model}
                                                onValueChange={(value) => updateConfig("sceneDescription", { model: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {descriptionModels?.models.map((model) => (
                                                        <SelectItem key={model.modelId} value={model.modelId}>
                                                            <div className="flex items-center justify-between w-full">
                                                                <span>{model.modelType}</span>
                                                                {model.modelId === descriptionModels.default.model && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Custom Prompt */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Custom Prompt
                                            </Label>
                                            <Textarea
                                                value={config.sceneDescription.prompt}
                                                onChange={(e) =>
                                                    updateConfig("sceneDescription", { prompt: e.target.value })
                                                }
                                                placeholder="Enter your custom prompt..."
                                                className="min-h-[100px]"
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-500">
                                                    {config.sceneDescription.prompt.length} characters
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        updateConfig("sceneDescription", { prompt: defaultScenePrompt })
                                                    }
                                                >
                                                    Reset to Default
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Max Tokens */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Maximum Tokens
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {config.sceneDescription.maxTokens}
                                                </Badge>
                                            </Label>
                                            <Slider
                                                value={[config.sceneDescription.maxTokens]}
                                                onValueChange={(value) =>
                                                    updateConfig("sceneDescription", { maxTokens: value[0] })
                                                }
                                                max={500}
                                                min={50}
                                                step={10}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Brief (50)</span>
                                                <span>Detailed (500)</span>
                                            </div>
                                        </div>

                                        {/* Sampling */}
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="sceneDoSample"
                                                checked={config.sceneDescription.doSample}
                                                onCheckedChange={(checked) =>
                                                    updateConfig("sceneDescription", { doSample: checked === true })
                                                }
                                            />
                                            <Label htmlFor="sceneDoSample" className="text-sm cursor-pointer">
                                                Creative sampling (more varied responses)
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                <Separator />

                {/* Text Extraction */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="textExtraction"
                            checked={config.textExtraction.enabled}
                            onCheckedChange={(checked) =>
                                updateConfig("textExtraction", { enabled: checked === true })
                            }
                        />
                        <div className="flex-1">
                            <Label htmlFor="textExtraction" className="text-sm font-medium cursor-pointer flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                Text Extraction (OCR)
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                Extract and transcribe text with customizable prompts
                            </p>
                        </div>
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSection("textExtraction")}
                                    disabled={!config.textExtraction.enabled}
                                >
                                    {expandedSections.has("textExtraction") ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {config.textExtraction.enabled && expandedSections.has("textExtraction") && (
                                    <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-4">
                                        {/* Model Selection */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Model
                                            </Label>
                                            <Select
                                                value={config.textExtraction.model}
                                                onValueChange={(value) => updateConfig("textExtraction", { model: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {descriptionModels?.models.map((model) => (
                                                        <SelectItem key={model.modelId} value={model.modelId}>
                                                            <div className="flex items-center justify-between w-full">
                                                                <span>{model.modelType}</span>
                                                                {model.modelId === descriptionModels.default.model && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Custom Prompt */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center">
                                                <Info className="h-3 w-3 mr-1" />
                                                Custom Prompt
                                            </Label>
                                            <Textarea
                                                value={config.textExtraction.prompt}
                                                onChange={(e) =>
                                                    updateConfig("textExtraction", { prompt: e.target.value })
                                                }
                                                placeholder="Enter your custom prompt..."
                                                className="min-h-[80px]"
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-500">
                                                    {config.textExtraction.prompt.length} characters
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        updateConfig("textExtraction", { prompt: defaultTextPrompt })
                                                    }
                                                >
                                                    Reset to Default
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Max Tokens */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Maximum Tokens
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {config.textExtraction.maxTokens}
                                                </Badge>
                                            </Label>
                                            <Slider
                                                value={[config.textExtraction.maxTokens]}
                                                onValueChange={(value) =>
                                                    updateConfig("textExtraction", { maxTokens: value[0] })
                                                }
                                                max={300}
                                                min={50}
                                                step={10}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Brief (50)</span>
                                                <span>Detailed (300)</span>
                                            </div>
                                        </div>

                                        {/* Sampling */}
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="textDoSample"
                                                checked={config.textExtraction.doSample}
                                                onCheckedChange={(checked) =>
                                                    updateConfig("textExtraction", { doSample: checked === true })
                                                }
                                            />
                                            <Label htmlFor="textDoSample" className="text-sm cursor-pointer">
                                                Creative sampling (more varied responses)
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                <Separator />

                {/* Face Recognition */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="faceRecognition"
                            checked={config.faceRecognition.enabled}
                            onCheckedChange={(checked) =>
                                updateConfig("faceRecognition", { enabled: checked === true })
                            }
                        />
                        <div className="flex-1">
                            <Label htmlFor="faceRecognition" className="text-sm font-medium cursor-pointer flex items-center">
                                <Users className="h-4 w-4 mr-2 text-orange-600" />
                                Face Recognition
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                Recognize registered people (requires person management setup)
                            </p>
                        </div>
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSection("faceRecognition")}
                                    disabled={!config.faceRecognition.enabled}
                                >
                                    {expandedSections.has("faceRecognition") ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {config.faceRecognition.enabled && expandedSections.has("faceRecognition") && (
                                    <div className="mt-4 p-4 bg-orange-50 rounded-lg space-y-4">
                                        {/* Threshold */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Recognition Threshold
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(config.faceRecognition.threshold * 100)}%
                                                </Badge>
                                            </Label>
                                            <Slider
                                                value={[config.faceRecognition.threshold]}
                                                onValueChange={(value) =>
                                                    updateConfig("faceRecognition", { threshold: value[0] })
                                                }
                                                max={1}
                                                min={0.1}
                                                step={0.05}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Less sensitive (10%)</span>
                                                <span>More sensitive (100%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 