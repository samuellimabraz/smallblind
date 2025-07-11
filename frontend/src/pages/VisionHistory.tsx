import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    History,
    Search,
    Eye,
    FileText,
    Clock,
    User,
    Calendar,
    Filter,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Loader2,
    Database,
    Cpu,
    Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { visionHistoryService, VisionHistoryItem, VisionHistoryResponse } from "@/services/visionHistoryService";

const VisionHistory = () => {
    const navigate = useNavigate();

    // State management
    const [allHistoryData, setAllHistoryData] = useState<VisionHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [analysisTypeFilter, setAnalysisTypeFilter] = useState<string>("all");
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Load all history data
    const loadAllHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log("VisionHistory: Loading all history data");

            // Load all data by making multiple requests if needed
            let allData: VisionHistoryItem[] = [];
            let hasMore = true;
            let offset = 0;
            const limit = 100; // Load in chunks of 100

            while (hasMore) {
                const response = await visionHistoryService.getUserVisionHistory({
                    limit,
                    offset,
                });

                if (response.data && response.data.length > 0) {
                    allData = [...allData, ...response.data];
                    hasMore = response.pagination.hasMore;
                    offset += limit;
                } else {
                    hasMore = false;
                }
            }

            console.log("VisionHistory: Loaded total items:", allData.length);

            setAllHistoryData(allData);
            setTotalCount(allData.length);
            setCurrentPage(1); // Reset to first page when loading new data

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load vision history";
            console.error("VisionHistory: Error loading history:", err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and paginate data
    const { filteredItems, paginatedItems, totalPages, filteredCount } = useMemo(() => {
        // First, filter the data
        const filtered = allHistoryData.filter((item) => {
            const matchesSearch = searchTerm === "" ||
                item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.ObjectDetection?.DetectedObject.some(obj =>
                    obj.label.toLowerCase().includes(searchTerm.toLowerCase())
                ) ||
                item.ImageDescription?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.FaceRecognition?.RecognizedFace.some(face =>
                    face.personName?.toLowerCase().includes(searchTerm.toLowerCase())
                );

            const matchesType = analysisTypeFilter === "all" ||
                item.analysisType === analysisTypeFilter;

            return matchesSearch && matchesType;
        });

        // Then, paginate the filtered results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginated = filtered.slice(startIndex, endIndex);

        const pages = Math.ceil(filtered.length / itemsPerPage);

        console.log("VisionHistory: Filtered items count:", filtered.length);
        console.log("VisionHistory: Paginated items count:", paginated.length);
        console.log("VisionHistory: Total pages:", pages);

        return {
            filteredItems: filtered,
            paginatedItems: paginated,
            totalPages: pages,
            filteredCount: filtered.length
        };
    }, [allHistoryData, searchTerm, analysisTypeFilter, currentPage, itemsPerPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, analysisTypeFilter]);

    // Toggle expanded item
    const toggleExpanded = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    // Get analysis type icon and color
    const getAnalysisTypeInfo = (type: string) => {
        switch (type) {
            case "OBJECT_DETECTION":
                return {
                    icon: Search,
                    label: "Object Detection",
                    color: "bg-blue-100 text-blue-800",
                };
            case "IMAGE_DESCRIPTION":
                return {
                    icon: FileText,
                    label: "Image Description",
                    color: "bg-green-100 text-green-800",
                };
            case "FACE_RECOGNITION":
                return {
                    icon: User,
                    label: "Face Recognition",
                    color: "bg-purple-100 text-purple-800",
                };
            default:
                return {
                    icon: Eye,
                    label: "Unknown",
                    color: "bg-gray-100 text-gray-800",
                };
        }
    };

    // Calculate summary statistics from filtered data
    const summaryStats = useMemo(() => {
        const objectDetectionCount = filteredItems.filter(item => item.analysisType === "OBJECT_DETECTION").length;
        const imageDescriptionCount = filteredItems.filter(item => item.analysisType === "IMAGE_DESCRIPTION").length;
        const faceRecognitionCount = filteredItems.filter(item => item.analysisType === "FACE_RECOGNITION").length;

        return {
            total: filteredCount,
            objectDetection: objectDetectionCount,
            imageDescription: imageDescriptionCount,
            faceRecognition: faceRecognitionCount
        };
    }, [filteredItems, filteredCount]);

    // Load initial data
    useEffect(() => {
        loadAllHistory();
    }, []);

    // Pagination handlers
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
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
                            <History className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Vision History
                                </h1>
                                <p className="text-gray-600">
                                    View your past AI vision analysis results
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadAllHistory}
                        disabled={isLoading}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Filter className="h-5 w-5 mr-2" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by filename, objects, or description..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Analysis Type Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="analysisType">Analysis Type</Label>
                                <Select value={analysisTypeFilter} onValueChange={setAnalysisTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select analysis type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="OBJECT_DETECTION">Object Detection</SelectItem>
                                        <SelectItem value="IMAGE_DESCRIPTION">Image Description</SelectItem>
                                        <SelectItem value="FACE_RECOGNITION">Face Recognition</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {isLoading && (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                <p className="text-gray-600">Loading vision history...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {!isLoading && paginatedItems.length === 0 && (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center text-gray-500">
                                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No vision history found</p>
                                <p className="text-sm">
                                    {searchTerm || analysisTypeFilter !== "all"
                                        ? "Try adjusting your filters or search terms"
                                        : "Start analyzing images to see your history here"
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* History Items */}
                {!isLoading && paginatedItems.length > 0 && (
                    <div className="space-y-4">
                        {paginatedItems.map((item) => {
                            const typeInfo = getAnalysisTypeInfo(item.analysisType);
                            const TypeIcon = typeInfo.icon;
                            const isExpanded = expandedItems.has(item.id);

                            return (
                                <Card key={item.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <TypeIcon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge className={typeInfo.color}>
                                                            {typeInfo.label}
                                                        </Badge>
                                                        {item.fileName && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Image className="h-3 w-3 mr-1" />
                                                                {item.fileName}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {formatDate(item.createdAt)}
                                                        </div>
                                                        {item.Session && (
                                                            <div className="flex items-center">
                                                                <User className="h-3 w-3 mr-1" />
                                                                Session {item.Session.id.slice(0, 8)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Collapsible>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpanded(item.id)}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {/* Quick Summary */}
                                        <div className="mb-4">
                                            {item.analysisType === "OBJECT_DETECTION" && item.ObjectDetection && (
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Search className="h-4 w-4 mr-1 text-blue-600" />
                                                        {item.ObjectDetection.DetectedObject.length} objects detected
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Cpu className="h-4 w-4 mr-1 text-gray-500" />
                                                        {item.ObjectDetection.modelName}
                                                    </div>
                                                    {item.ObjectDetection.processingTimeMs && (
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                            {item.ObjectDetection.processingTimeMs}ms
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.analysisType === "IMAGE_DESCRIPTION" && item.ImageDescription && (
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <FileText className="h-4 w-4 mr-1 text-green-600" />
                                                        Description generated
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Cpu className="h-4 w-4 mr-1 text-gray-500" />
                                                        {item.ImageDescription.modelName}
                                                    </div>
                                                    {item.ImageDescription.processingTimeMs && (
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                            {item.ImageDescription.processingTimeMs}ms
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.analysisType === "FACE_RECOGNITION" && item.FaceRecognition && (
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <User className="h-4 w-4 mr-1 text-purple-600" />
                                                        {item.FaceRecognition.RecognizedFace.length} faces recognized
                                                    </div>
                                                    {item.FaceRecognition.processingTimeMs && (
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                            {item.FaceRecognition.processingTimeMs}ms
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        <Collapsible open={isExpanded}>
                                            <CollapsibleContent>
                                                <Separator className="mb-4" />

                                                {/* Object Detection Details */}
                                                {item.analysisType === "OBJECT_DETECTION" && item.ObjectDetection && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                                <Search className="h-4 w-4 mr-1 text-blue-600" />
                                                                Detected Objects ({item.ObjectDetection.DetectedObject.length})
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {item.ObjectDetection.DetectedObject.map((obj, index) => (
                                                                    <Badge
                                                                        key={index}
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

                                                        {/* Model Settings */}
                                                        {item.ObjectDetection.modelSettings && (
                                                            <div>
                                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                                    <Cpu className="h-4 w-4 mr-1 text-gray-600" />
                                                                    Model Settings
                                                                </h4>
                                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                                    <pre className="text-xs text-gray-700 overflow-x-auto">
                                                                        {JSON.stringify(item.ObjectDetection.modelSettings, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Image Description Details */}
                                                {item.analysisType === "IMAGE_DESCRIPTION" && item.ImageDescription && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                                <FileText className="h-4 w-4 mr-1 text-green-600" />
                                                                Generated Description
                                                            </h4>
                                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                                <p className="text-green-900 leading-relaxed">
                                                                    {item.ImageDescription.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2">
                                                                Prompt Used
                                                            </h4>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-sm text-gray-700">
                                                                    {item.ImageDescription.prompt}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Generation Settings */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                                <Cpu className="h-4 w-4 mr-1 text-gray-600" />
                                                                Generation Settings
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                                {item.ImageDescription.maxNewTokens && (
                                                                    <div>
                                                                        <span className="text-gray-500">Max Tokens:</span>
                                                                        <span className="ml-2 font-medium">{item.ImageDescription.maxNewTokens}</span>
                                                                    </div>
                                                                )}
                                                                {item.ImageDescription.temperature && (
                                                                    <div>
                                                                        <span className="text-gray-500">Temperature:</span>
                                                                        <span className="ml-2 font-medium">{item.ImageDescription.temperature}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Face Recognition Details */}
                                                {item.analysisType === "FACE_RECOGNITION" && item.FaceRecognition && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                                <User className="h-4 w-4 mr-1 text-purple-600" />
                                                                Recognized Faces ({item.FaceRecognition.RecognizedFace.length})
                                                            </h4>
                                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                                {item.FaceRecognition.RecognizedFace.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {item.FaceRecognition.RecognizedFace.map((face, index) => (
                                                                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                                                    <span className="text-sm font-medium">{face.personName}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {(face.confidence * 100).toFixed(1)}%
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-600">No faces recognized</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination - Only show if there are multiple pages of filtered results */}
                {!isLoading && totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCount)} of {filteredCount} results
                            {(searchTerm || analysisTypeFilter !== "all") && (
                                <span className="text-gray-500 ml-2">
                                    (filtered from {totalCount} total)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1 || isLoading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Summary Stats - Only show if there are results and multiple pages or filters applied */}
                {!isLoading && filteredCount > 0 && (totalPages > 1 || searchTerm || analysisTypeFilter !== "all") && (
                    <div className="mt-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Summary
                                    {(searchTerm || analysisTypeFilter !== "all") && (
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            (filtered results)
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {summaryStats.total}
                                        </div>
                                        <div className="text-sm text-blue-800">Total Analyses</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {summaryStats.objectDetection}
                                        </div>
                                        <div className="text-sm text-green-800">Object Detections</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {summaryStats.imageDescription}
                                        </div>
                                        <div className="text-sm text-purple-800">Image Descriptions</div>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {summaryStats.faceRecognition}
                                        </div>
                                        <div className="text-sm text-orange-800">Face Recognition</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisionHistory; 