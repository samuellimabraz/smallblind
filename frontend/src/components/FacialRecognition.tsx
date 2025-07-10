import React, { useState, useCallback, useRef } from "react";
import { UserPlus, Camera, Trash2, Edit, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Person } from "@/types";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";
import { speechService } from "@/services/speechService";

interface FacialRecognitionProps {
  onPersonRecognized?: (person: Person, confidence: number) => void;
  className?: string;
}

export const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  onPersonRecognized,
  className = "",
}) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonPhotos, setNewPersonPhotos] = useState<File[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPersons = useCallback(async () => {
    try {
      setError(null);
      const data = await facialRecognitionAPI.getPersons();
      setPersons(data);
      speechService.speakInstruction(
        `Loaded ${data.length} registered people.`,
      );
    } catch (err) {
      const errorMessage = "Failed to load registered people.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    }
  }, []);

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setNewPersonPhotos(files);
      speechService.speakInstruction(
        `Selected ${files.length} photo${files.length > 1 ? "s" : ""}.`,
      );
    }
  };

  const registerPerson = async () => {
    if (!newPersonName.trim()) {
      const errorMessage = "Please enter a name for the person.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      return;
    }

    if (newPersonPhotos.length === 0) {
      const errorMessage = "Please select at least one photo.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newPerson = await facialRecognitionAPI.registerPerson(
        newPersonName.trim(),
        newPersonPhotos,
      );

      setPersons((prev) => [...prev, newPerson]);
      setNewPersonName("");
      setNewPersonPhotos([]);
      setIsDialogOpen(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      speechService.speakInstruction(
        `${newPersonName} has been registered successfully.`,
      );
    } catch (err) {
      const errorMessage = "Failed to register person. Please try again.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePerson = async (person: Person) => {
    try {
      setIsLoading(true);
      await facialRecognitionAPI.deletePerson(person.id);
      setPersons((prev) => prev.filter((p) => p.id !== person.id));
      speechService.speakInstruction(`${person.name} has been removed.`);
    } catch (err) {
      const errorMessage = "Failed to delete person.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const recognizeFaceInImage = async (imageFile: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await facialRecognitionAPI.recognizeFace(imageFile);

      if (result.faces && result.faces.length > 0) {
        const recognizedFaces = result.faces.filter(
          (face: any) => face.personId,
        );

        if (recognizedFaces.length > 0) {
          recognizedFaces.forEach((face: any) => {
            const person = persons.find((p) => p.id === face.personId);
            if (person && onPersonRecognized) {
              onPersonRecognized(person, face.confidence);
            }
          });

          const names = recognizedFaces.map((face: any) => {
            const person = persons.find((p) => p.id === face.personId);
            return person?.name || "Unknown";
          });

          speechService.speakAnalysisResult(
            `Recognized ${names.length} person${names.length > 1 ? "s" : ""}: ${names.join(", ")}.`,
          );
        } else {
          speechService.speakAnalysisResult(
            "I can see faces, but they are not registered in the system.",
          );
        }
      } else {
        speechService.speakAnalysisResult("No faces detected in the image.");
      }

      return result;
    } catch (err) {
      const errorMessage = "Face recognition failed. Please try again.";
      setError(errorMessage);
      speechService.speakError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Facial Recognition
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-1">
                <UserPlus className="h-4 w-4" />
                <span>Add Person</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Person</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="person-name">Name</Label>
                  <Input
                    id="person-name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Enter person's name"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="person-photos">Photos</Label>
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

                {newPersonPhotos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Photos ({newPersonPhotos.length})</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {newPersonPhotos.map((photo, index) => (
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

                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={registerPerson}
                  disabled={
                    isLoading ||
                    !newPersonName.trim() ||
                    newPersonPhotos.length === 0
                  }
                  className="w-full"
                >
                  {isLoading ? "Registering..." : "Register Person"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {error && !isDialogOpen && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-64">
          {persons.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No people registered yet</p>
              <p className="text-sm text-gray-500">
                Add people to enable face recognition
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {persons.map((person) => (
                <div
                  key={person.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500">
                          {person.photos.length} photo
                          {person.photos.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                      <Button
                        onClick={() => deletePerson(person)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${person.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <Eye className="h-3 w-3 inline mr-1" />
            Face recognition works automatically when analyzing images.
            Registered people will be identified with confidence scores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Export the recognition function for use in other components
export { FacialRecognition };
export const useFacialRecognition = () => {
  const recognizeFace = async (imageFile: File) => {
    return await facialRecognitionAPI.recognizeFace(imageFile);
  };

  return { recognizeFace };
};
