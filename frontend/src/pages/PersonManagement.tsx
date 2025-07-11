import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  Camera,
  Play,
  Square,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { FacialRecognition } from "@/components/FacialRecognition";
import { Person } from "@/types";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";

const PersonManagement = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [captureInterval, setCaptureInterval] = useState(2); // seconds
  const [countdown, setCountdown] = useState(0);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Load persons from API
  const loadPersons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await facialRecognitionAPI.getPersons();
      setPersons(data);
      setFilteredPersons(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load registered people";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter persons based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = persons.filter((person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPersons(filtered);
    } else {
      setFilteredPersons(persons);
    }
  }, [searchTerm, persons]);

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Failed to access webcam. Please ensure you have granted camera permissions.");
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCountdown(0);
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhotos(prev => [...prev, photoDataUrl]);
      }
    }
  };

  // Start periodic photo capture
  const startCapturing = () => {
    if (!isWebcamActive) return;

    setIsCapturing(true);
    setCapturedPhotos([]);

    // Initial capture after 1 second
    setTimeout(() => {
      capturePhoto();
    }, 1000);

    // Set up interval for periodic capture
    intervalRef.current = setInterval(() => {
      capturePhoto();
    }, captureInterval * 1000);

    // Countdown for visual feedback
    let countdownValue = captureInterval;
    const countdownInterval = setInterval(() => {
      setCountdown(countdownValue);
      countdownValue--;
      if (countdownValue < 0) {
        countdownValue = captureInterval;
      }
    }, 1000);

    // Store countdown interval reference
    setTimeout(() => {
      if (intervalRef.current) {
        (intervalRef.current as any).countdownInterval = countdownInterval;
      }
    }, 100);
  };

  // Stop periodic photo capture
  const stopCapturing = () => {
    setIsCapturing(false);
    setCountdown(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      if ((intervalRef.current as any).countdownInterval) {
        clearInterval((intervalRef.current as any).countdownInterval);
      }
      intervalRef.current = null;
    }
  };

  // Convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "" });
    setEditingPerson(null);
    setCapturedPhotos([]);
    stopWebcam();
  };

  // Create new person
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      const errorMessage = "Please enter a name.";
      setError(errorMessage);
      return;
    }

    if (capturedPhotos.length === 0) {
      const errorMessage = "Please capture at least one photo.";
      setError(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert captured photos to File objects
      const photoFiles = capturedPhotos.map((photoDataUrl, index) =>
        dataURLtoFile(photoDataUrl, `photo_${index + 1}.jpg`)
      );

      const newPerson = await facialRecognitionAPI.registerPerson(
        formData.name.trim(),
        photoFiles,
      );

      setPersons((prev) => [...prev, newPerson]);
      const successMessage = `${formData.name} has been registered successfully with ${capturedPhotos.length} photos.`;
      setSuccess(successMessage);

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = "Failed to register person. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing person
  const handleUpdate = async () => {
    if (!editingPerson) return;

    if (!formData.name.trim()) {
      const errorMessage = "Please enter a name.";
      setError(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert captured photos to File objects if we have new photos
      let photoFiles: File[] = [];
      if (capturedPhotos.length > 0) {
        photoFiles = capturedPhotos.map((photoDataUrl, index) =>
          dataURLtoFile(photoDataUrl, `photo_${index + 1}.jpg`)
        );
      }

      const updatedPerson = await facialRecognitionAPI.updatePerson(
        editingPerson.id,
        formData.name.trim(),
        photoFiles.length > 0 ? photoFiles : undefined,
      );

      setPersons((prev) =>
        prev.map((person) =>
          person.id === editingPerson.id ? updatedPerson : person
        )
      );

      const successMessage = `${formData.name} has been updated successfully${photoFiles.length > 0 ? ` with ${photoFiles.length} new photos` : ''}.`;
      setSuccess(successMessage);

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update person. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete person
  const handleDelete = async (person: Person) => {
    if (!confirm(`Are you sure you want to delete ${person.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await facialRecognitionAPI.deletePerson(person.id);

      setPersons((prev) => prev.filter((p) => p.id !== person.id));
      const successMessage = `${person.name} has been deleted successfully.`;
      setSuccess(successMessage);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete person. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (person: Person) => {
    setEditingPerson(person);
    setFormData({ name: person.name });
    setCapturedPhotos([]);
    setIsDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Clear captured photos
  const clearPhotos = () => {
    setCapturedPhotos([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadPersons();
  }, []);

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
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Person Management
                </h1>
                <p className="text-gray-600">
                  Register and manage people for facial recognition
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateDialog}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Person</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPerson ? 'Edit Person' : 'Register New Person'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="person-name">Name</Label>
                    <Input
                      id="person-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter person's name"
                      className="text-lg"
                    />
                  </div>

                  {/* Webcam Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Webcam Capture</Label>
                      {!isWebcamActive && (
                        <Button
                          onClick={startWebcam}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Start Camera</span>
                        </Button>
                      )}
                      {isWebcamActive && (
                        <Button
                          onClick={stopWebcam}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Square className="h-4 w-4" />
                          <span>Stop Camera</span>
                        </Button>
                      )}
                    </div>

                    {/* Video Feed */}
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-md mx-auto rounded-lg border bg-gray-100"
                        style={{ display: isWebcamActive ? 'block' : 'none' }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />

                      {isWebcamActive && (
                        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                          {isCapturing ? (
                            <span>Recording... {countdown > 0 ? `${countdown}s` : ''}</span>
                          ) : (
                            <span>Ready</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Capture Controls */}
                    {isWebcamActive && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Capture Interval: {captureInterval} seconds</Label>
                          <Slider
                            value={[captureInterval]}
                            onValueChange={(value) => setCaptureInterval(value[0])}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                            disabled={isCapturing}
                          />
                          <p className="text-xs text-gray-500">
                            Photos will be taken every {captureInterval} second{captureInterval > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          {!isCapturing ? (
                            <Button
                              onClick={startCapturing}
                              className="flex items-center space-x-2"
                            >
                              <Play className="h-4 w-4" />
                              <span>Start Capturing</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={stopCapturing}
                              variant="destructive"
                              className="flex items-center space-x-2"
                            >
                              <Square className="h-4 w-4" />
                              <span>Stop Capturing</span>
                            </Button>
                          )}

                          {capturedPhotos.length > 0 && (
                            <Button
                              onClick={clearPhotos}
                              variant="outline"
                              className="flex items-center space-x-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>Clear Photos</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Captured Photos Preview */}
                  {capturedPhotos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Captured Photos ({capturedPhotos.length})</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {capturedPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo}
                              alt={`Captured photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {capturedPhotos.length < 2 && "Capture at least 2 photos for better recognition"}
                        {capturedPhotos.length >= 2 && capturedPhotos.length < 5 && "Good! You can capture more photos or proceed to register"}
                        {capturedPhotos.length >= 5 && "Excellent! You have enough photos for accurate recognition"}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {editingPerson ? (
                      <Button
                        onClick={handleUpdate}
                        disabled={
                          isLoading ||
                          !formData.name.trim()
                        }
                        className="flex-1"
                      >
                        {isLoading
                          ? "Updating..."
                          : capturedPhotos.length > 0
                            ? `Update with ${capturedPhotos.length} new photo${capturedPhotos.length !== 1 ? 's' : ''}`
                            : "Update Name"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreate}
                        disabled={
                          isLoading ||
                          !formData.name.trim() ||
                          capturedPhotos.length === 0
                        }
                        className="flex-1"
                      >
                        {isLoading
                          ? "Registering..."
                          : `Register with ${capturedPhotos.length} photo${capturedPhotos.length !== 1 ? 's' : ''}`}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={loadPersons}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people..."
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Person List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registered People ({filteredPersons.length})</span>
              {persons.length > 0 && (
                <Badge variant="outline">{persons.length} total</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading people...</p>
              </div>
            ) : filteredPersons.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  {searchTerm
                    ? "No people found matching your search"
                    : "No people registered yet"}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm
                    ? "Try a different search term"
                    : "Add people to enable facial recognition"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredPersons.map((person) => (
                    <div
                      key={person.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">
                              {person.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                {person.photos.length} photo
                                {person.photos.length > 1 ? "s" : ""}
                              </span>
                              <span>•</span>
                              <span>
                                Added{" "}
                                {new Date(
                                  person.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                          <Button
                            onClick={() => openEditDialog(person)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${person.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(person)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Delete ${person.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Click "Add Person" to register a new person with webcam</p>
              <p>• Enter the person's name and start the camera</p>
              <p>• Click "Start Capturing" to take photos automatically</p>
              <p>• Photos are taken every 1-5 seconds (adjustable)</p>
              <p>• Stop capturing when you have enough photos (2-10 recommended)</p>
              <p>• Click "Register" to save the person to the system</p>
              <p>• Use the edit button to modify person names or add new photos</p>
              <p>• Use the delete button to remove people from the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Ensure good lighting and clear view of the face</p>
              <p>• Capture different angles and expressions</p>
              <p>• Have the person move slightly between captures</p>
              <p>• Avoid capturing when others are in frame</p>
              <p>• 3-5 photos usually provide good recognition accuracy</p>
              <p>• <strong>Edit carefully</strong> - name changes are permanent</p>
              <p>• <strong>Delete carefully</strong> - removed people cannot be recovered</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonManagement;
