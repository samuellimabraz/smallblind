import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Camera,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle,
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
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { FacialRecognition } from "@/components/FacialRecognition";
import { Person, AccessibilitySettings } from "@/types";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";
import { speechService } from "@/services/speechService";

const PersonManagement = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    photos: [] as File[],
  });

  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    });

  // Load persons from API
  const loadPersons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await facialRecognitionAPI.getPersons();
      setPersons(data);
      setFilteredPersons(data);
      speechService.speakInstruction(
        `Loaded ${data.length} registered people.`,
      );
    } catch (err) {
      const errorMessage =
        "Failed to load people. Please check your connection.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
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

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", photos: [] });
    setEditingPerson(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle photo selection
  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, photos: files }));
      speechService.speakInstruction(
        `Selected ${files.length} photo${files.length > 1 ? "s" : ""}.`,
      );
    }
  };

  // Create new person
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      const errorMessage = "Please enter a name.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      return;
    }

    if (formData.photos.length === 0) {
      const errorMessage = "Please select at least one photo.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newPerson = await facialRecognitionAPI.registerPerson(
        formData.name.trim(),
        formData.photos,
      );

      setPersons((prev) => [...prev, newPerson]);
      const successMessage = `${formData.name} has been registered successfully.`;
      setSuccess(successMessage);
      speechService.speakInstruction(successMessage);

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = "Failed to register person. Please try again.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing person
  const handleUpdate = async () => {
    if (!editingPerson || !formData.name.trim()) {
      const errorMessage = "Please enter a valid name.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updatedPerson = await facialRecognitionAPI.updatePerson(
        editingPerson.id,
        formData.name.trim(),
        formData.photos.length > 0 ? formData.photos : undefined,
      );

      setPersons((prev) =>
        prev.map((p) => (p.id === editingPerson.id ? updatedPerson : p)),
      );
      const successMessage = `${formData.name} has been updated successfully.`;
      setSuccess(successMessage);
      speechService.speakInstruction(successMessage);

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = "Failed to update person. Please try again.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete person
  const handleDelete = async (person: Person) => {
    if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
      try {
        setIsLoading(true);
        setError(null);

        await facialRecognitionAPI.deletePerson(person.id);
        setPersons((prev) => prev.filter((p) => p.id !== person.id));

        const successMessage = `${person.name} has been deleted.`;
        setSuccess(successMessage);
        speechService.speakInstruction(successMessage);
      } catch (err) {
        const errorMessage = "Failed to delete person. Please try again.";
        setError(errorMessage);
        speechService.speakError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const openEditDialog = (person: Person) => {
    setEditingPerson(person);
    setFormData({ name: person.name, photos: [] });
    setIsDialogOpen(true);
    speechService.speakInstruction(
      `Editing ${person.name}. Update the name or add new photos.`,
    );
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
    speechService.speakInstruction(
      "Register a new person. Enter their name and select photos.",
    );
  };

  useEffect(() => {
    speechService.speakInstruction(
      "Person Management. Register new people or manage existing ones for facial recognition.",
    );
    loadPersons();

    // Clear messages after 5 seconds
    const timer = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccessibilityChange = (settings: AccessibilitySettings) => {
    setAccessibilitySettings(settings);
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

        {/* Accessibility Controls */}
        <div className="mb-6">
          <AccessibilityControls onSettingsChange={handleAccessibilityChange} />
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
                  <UserPlus className="h-4 w-4" />
                  <span>Add Person</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPerson ? "Edit Person" : "Register New Person"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="person-photos">
                      {editingPerson ? "New Photos (optional)" : "Photos"}
                    </Label>
                    <Input
                      ref={fileInputRef}
                      id="person-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelection}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      Select 2-5 clear photos of the person's face
                    </p>
                  </div>

                  {formData.photos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Photos ({formData.photos.length})</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-16 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={editingPerson ? handleUpdate : handleCreate}
                      disabled={
                        isLoading ||
                        !formData.name.trim() ||
                        (!editingPerson && formData.photos.length === 0)
                      }
                      className="flex-1"
                    >
                      {isLoading
                        ? "Processing..."
                        : editingPerson
                          ? "Update"
                          : "Register"}
                    </Button>
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
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
              <p>• Register people with 2-5 clear photos of their face</p>
              <p>• The system will learn to recognize them automatically</p>
              <p>
                • When analyzing images, recognized people will be identified
              </p>
              <p>• You can update or remove people at any time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Use well-lit, clear photos</p>
              <p>• Include different angles and expressions</p>
              <p>• Avoid photos with multiple faces</p>
              <p>• Higher quality photos improve recognition accuracy</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonManagement;
