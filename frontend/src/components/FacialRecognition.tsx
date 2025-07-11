import React, { useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Upload,
  Camera,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Person } from "@/types";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";

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
  const [success, setSuccess] = useState<string | null>(null);

  const loadPersons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await facialRecognitionAPI.getPersons();
      setPersons(data);
    } catch (err) {
      const errorMessage = "Failed to load registered people.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPerson = async (name: string, photos: File[]) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const person = await facialRecognitionAPI.registerPerson(name, photos);
      setPersons((prev) => [...prev, person]);
      const successMessage = `${name} has been registered successfully.`;
      setSuccess(successMessage);
    } catch (err) {
      const errorMessage = `Failed to register ${name}. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removePerson = async (personId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const person = persons.find((p) => p.id === personId);
      await facialRecognitionAPI.deletePerson(personId);
      setPersons((prev) => prev.filter((p) => p.id !== personId));
      const successMessage = `${person?.name || "Person"} has been removed.`;
      setSuccess(successMessage);
    } catch (err) {
      const errorMessage = "Failed to remove person. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const recognizeFaceInImage = async (imageFile: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await facialRecognitionAPI.recognizeFace(imageFile);

      if (result.success && result.results && result.results.length > 0) {
        const recognizedFaces = result.results.filter(
          (face: any) => face.personId,
        );

        if (recognizedFaces.length > 0) {
          recognizedFaces.forEach((face: any) => {
            const person = persons.find((p) => p.id === face.personId);
            if (person && onPersonRecognized) {
              onPersonRecognized(person, face.confidence);
            }
          });
        }
      }

      return result;
    } catch (err) {
      const errorMessage = "Face recognition failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Registered People ({persons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading...</span>
            </div>
          )}

          {!isLoading && persons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No people registered yet</p>
              <p className="text-sm">Add people to enable face recognition</p>
            </div>
          )}

          {!isLoading && persons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {persons.map((person) => (
                <div
                  key={person.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{person.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePerson(person.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Camera className="h-4 w-4 mr-1" />
                      {person.photos.length} photo(s)
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      Added {new Date(person.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Register New Person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Add a new person to the recognition system with their photos.
            </p>
            <p className="text-xs text-blue-600 mb-4">
              Go to Person Management page to register new people with webcam capture.
            </p>
            <Button
              className="w-full"
              onClick={() => window.location.href = '/person-management'}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Go to Person Management
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Recognize Faces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use the Camera page to identify registered people in images.
            </p>
            <p className="text-xs text-blue-600 mb-4">
              Enable face recognition in camera analysis settings.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/camera'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Go to Camera Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
