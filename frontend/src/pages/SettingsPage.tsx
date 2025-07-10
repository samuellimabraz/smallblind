import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Volume2,
  Mic,
  Camera,
  Eye,
  Sun,
  Moon,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AccessibilitySettings, CameraSettings } from "@/types";
import { speechService } from "@/services/speechService";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";

const SettingsPage = () => {
  const navigate = useNavigate();

  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    });

  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    resolution: "medium",
    autoCapture: false,
    voiceAnnouncements: true,
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: "",
    organizationId: "",
    huggingFaceToken: "",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedAccessibility = localStorage.getItem("smallblind_accessibility");
    const savedCamera = localStorage.getItem("smallblind_camera");
    const savedApi = localStorage.getItem("smallblind_api_key");
    const savedOrg = localStorage.getItem("smallblind_organization_id");
    const savedHfToken = localStorage.getItem("smallblind_hf_token");

    if (savedAccessibility) {
      try {
        setAccessibilitySettings(JSON.parse(savedAccessibility));
      } catch (error) {
        console.warn("Failed to parse accessibility settings");
      }
    }

    if (savedCamera) {
      try {
        setCameraSettings(JSON.parse(savedCamera));
      } catch (error) {
        console.warn("Failed to parse camera settings");
      }
    }

    setApiSettings({
      apiKey: savedApi || "",
      organizationId: savedOrg || "",
      huggingFaceToken: savedHfToken || "",
    });

    speechService.speakInstruction(
      "Settings page. Configure accessibility, camera, and API settings for SmallBlind.",
    );
  }, []);

  const updateAccessibilitySettings = (
    newSettings: Partial<AccessibilitySettings>,
  ) => {
    const updated = { ...accessibilitySettings, ...newSettings };
    setAccessibilitySettings(updated);
    speechService.updateSettings(updated);
    setHasUnsavedChanges(true);
  };

  const updateCameraSettings = (newSettings: Partial<CameraSettings>) => {
    setCameraSettings((prev) => ({ ...prev, ...newSettings }));
    setHasUnsavedChanges(true);
  };

  const updateApiSettings = (newSettings: Partial<typeof apiSettings>) => {
    setApiSettings((prev) => ({ ...prev, ...newSettings }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    // Save to localStorage
    localStorage.setItem(
      "smallblind_accessibility",
      JSON.stringify(accessibilitySettings),
    );
    localStorage.setItem("smallblind_camera", JSON.stringify(cameraSettings));
    localStorage.setItem("smallblind_api_key", apiSettings.apiKey);
    localStorage.setItem(
      "smallblind_organization_id",
      apiSettings.organizationId,
    );
    localStorage.setItem("smallblind_hf_token", apiSettings.huggingFaceToken);

    // Update API credentials
    if (apiSettings.apiKey && apiSettings.organizationId) {
      facialRecognitionAPI.setCredentials(
        apiSettings.apiKey,
        apiSettings.organizationId,
      );
    }

    // Apply accessibility settings
    speechService.updateSettings(accessibilitySettings);

    // Apply visual settings
    if (accessibilitySettings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, "")
      .concat(` font-size-${accessibilitySettings.fontSize}`);

    setHasUnsavedChanges(false);
    speechService.speakInstruction("Settings saved successfully.");
  };

  const resetToDefaults = () => {
    const defaultAccessibility: AccessibilitySettings = {
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    };

    const defaultCamera: CameraSettings = {
      resolution: "medium",
      autoCapture: false,
      voiceAnnouncements: true,
    };

    setAccessibilitySettings(defaultAccessibility);
    setCameraSettings(defaultCamera);
    speechService.updateSettings(defaultAccessibility);
    setHasUnsavedChanges(true);
    speechService.speakInstruction("Settings reset to defaults.");
  };

  const testTextToSpeech = () => {
    speechService.speakInstruction(
      "This is a test of the text to speech system. If you can hear this, text to speech is working correctly.",
    );
  };

  const testVoiceRecognition = async () => {
    try {
      speechService.speakInstruction("Say something now...");
      const result = await speechService.startListening();
      speechService.speakInstruction(
        `You said: ${result || "nothing detected"}`,
      );
    } catch (error) {
      speechService.speakError(
        "Voice recognition test failed. Make sure you have given microphone permissions.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">
                  Configure your SmallBlind experience
                </p>
              </div>
            </div>
          </div>

          {hasUnsavedChanges && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800"
            >
              Unsaved Changes
            </Badge>
          )}
        </div>

        {/* Save/Reset Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button
              onClick={saveSettings}
              disabled={!hasUnsavedChanges}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="accessibility" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="accessibility"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Camera</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <SettingsIcon className="h-4 w-4" />
              <span>API</span>
            </TabsTrigger>
          </TabsList>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume2 className="h-5 w-5 mr-2" />
                    Speech Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tts-toggle" className="font-medium">
                      Text to Speech
                    </Label>
                    <Switch
                      id="tts-toggle"
                      checked={accessibilitySettings.textToSpeech}
                      onCheckedChange={(checked) =>
                        updateAccessibilitySettings({ textToSpeech: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-toggle" className="font-medium">
                      Voice Commands
                    </Label>
                    <Switch
                      id="voice-toggle"
                      checked={accessibilitySettings.voiceCommands}
                      onCheckedChange={(checked) =>
                        updateAccessibilitySettings({ voiceCommands: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">
                      Speech Rate: {accessibilitySettings.speechRate.toFixed(1)}
                      x
                    </Label>
                    <Slider
                      value={[accessibilitySettings.speechRate]}
                      onValueChange={(value) =>
                        updateAccessibilitySettings({ speechRate: value[0] })
                      }
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={testTextToSpeech}
                      variant="outline"
                      size="sm"
                    >
                      Test Speech
                    </Button>
                    <Button
                      onClick={testVoiceRecognition}
                      variant="outline"
                      size="sm"
                      disabled={!accessibilitySettings.voiceCommands}
                    >
                      Test Voice Recognition
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Visual Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contrast-toggle" className="font-medium">
                      High Contrast Mode
                    </Label>
                    <Switch
                      id="contrast-toggle"
                      checked={accessibilitySettings.highContrast}
                      onCheckedChange={(checked) =>
                        updateAccessibilitySettings({ highContrast: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Font Size</Label>
                    <Select
                      value={accessibilitySettings.fontSize}
                      onValueChange={(value) =>
                        updateAccessibilitySettings({ fontSize: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Camera Settings */}
          <TabsContent value="camera" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Camera Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Camera Resolution</Label>
                  <Select
                    value={cameraSettings.resolution}
                    onValueChange={(value) =>
                      updateCameraSettings({ resolution: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (640x480)</SelectItem>
                      <SelectItem value="medium">Medium (1280x720)</SelectItem>
                      <SelectItem value="high">High (1920x1080)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Higher resolution provides better analysis but may be slower
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-capture" className="font-medium">
                    Auto Capture
                  </Label>
                  <Switch
                    id="auto-capture"
                    checked={cameraSettings.autoCapture}
                    onCheckedChange={(checked) =>
                      updateCameraSettings({ autoCapture: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-announcements" className="font-medium">
                    Voice Announcements
                  </Label>
                  <Switch
                    id="voice-announcements"
                    checked={cameraSettings.voiceAnnouncements}
                    onCheckedChange={(checked) =>
                      updateCameraSettings({ voiceAnnouncements: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Facial Recognition API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiSettings.apiKey}
                      onChange={(e) =>
                        updateApiSettings({ apiKey: e.target.value })
                      }
                      placeholder="Enter your facial recognition API key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-id">Organization ID</Label>
                    <Input
                      id="org-id"
                      value={apiSettings.organizationId}
                      onChange={(e) =>
                        updateApiSettings({ organizationId: e.target.value })
                      }
                      placeholder="Enter your organization ID"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hugging Face API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hf-token">Access Token</Label>
                    <Input
                      id="hf-token"
                      type="password"
                      value={apiSettings.huggingFaceToken}
                      onChange={(e) =>
                        updateApiSettings({ huggingFaceToken: e.target.value })
                      }
                      placeholder="Enter your Hugging Face access token"
                    />
                    <p className="text-xs text-gray-500">
                      Required for vision models (object detection, OCR, scene
                      description)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Quick Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Enable text-to-speech for audio feedback on analysis results
            </li>
            <li>• Use voice commands for hands-free operation</li>
            <li>• Adjust speech rate for comfortable listening</li>
            <li>
              • High contrast mode improves visibility in bright environments
            </li>
            <li>• Save your settings to preserve them between sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
