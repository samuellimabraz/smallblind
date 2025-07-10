import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Camera,
  Users,
  Settings,
  Volume2,
  Mic,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { AccessibilitySettings } from "@/types";
import { speechService } from "@/services/speechService";

const Index = () => {
  const navigate = useNavigate();
  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    });

  const features = [
    {
      icon: Camera,
      title: "Camera Analysis",
      description: "Capture and analyze images with AI vision models",
      action: () => navigate("/camera"),
      keyCommand: "Press C",
    },
    {
      icon: Users,
      title: "Person Management",
      description: "Register and recognize people using facial recognition",
      action: () => navigate("/persons"),
      keyCommand: "Press P",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Configure accessibility and app preferences",
      action: () => navigate("/settings"),
      keyCommand: "Press S",
    },
  ];

  const voiceCommands = [
    "Go to camera",
    "Go to people",
    "Go to settings",
    "Describe this",
    "Read text",
    "Find objects",
    "Help",
  ];

  useEffect(() => {
    // Welcome message
    speechService.speakInstruction(
      "Welcome to SmallBlind. Your AI-powered visual assistant. Use voice commands or keyboard shortcuts to navigate.",
    );

    // Keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "c":
          navigate("/camera");
          break;
        case "p":
          navigate("/persons");
          break;
        case "s":
          navigate("/settings");
          break;
        case "h":
          speechService.speakInstruction(
            'Available commands: Press C for camera, P for people, S for settings. Say "help" for voice commands.',
          );
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const handleAccessibilityChange = (settings: AccessibilitySettings) => {
    setAccessibilitySettings(settings);
  };

  const startVoiceCommand = async () => {
    try {
      speechService.speakInstruction("Listening for voice commands...");
      const command = await speechService.startListening();
      const result = speechService.processVoiceCommand(command);

      if (result?.action === "navigate") {
        const page = result.parameters?.page;
        switch (page) {
          case "camera":
            navigate("/camera");
            break;
          case "persons":
            navigate("/persons");
            break;
          case "settings":
            navigate("/settings");
            break;
          case "menu":
            speechService.speakInstruction("You are already on the main menu.");
            break;
          default:
            speechService.speakInstruction(
              "Page not recognized. Available pages: camera, people, settings.",
            );
        }
      } else if (result?.action === "help") {
        speechService.speakInstruction(
          `Available voice commands: ${voiceCommands.join(", ")}.`,
        );
      } else {
        speechService.speakInstruction(
          'Command not recognized. Say "help" for available commands.',
        );
      }
    } catch (error) {
      speechService.speakError("Voice recognition failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">SmallBlind</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            AI-Powered Visual Assistant
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Navigate the world with confidence using advanced AI vision models,
            object detection, and facial recognition technology.
          </p>
        </div>

        {/* Accessibility Controls */}
        <div className="mb-8">
          <AccessibilityControls
            onSettingsChange={handleAccessibilityChange}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={feature.action}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold mb-2">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {feature.keyCommand}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Voice Commands */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Mic className="h-5 w-5 mr-2 text-blue-600" />
                Voice Commands
              </CardTitle>
              <Button
                onClick={startVoiceCommand}
                className="flex items-center space-x-2"
                disabled={!speechService.isVoiceRecognitionSupported()}
              >
                <Volume2 className="h-4 w-4" />
                <span>Start Listening</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {voiceCommands.map((command, index) => (
                <Badge key={index} variant="secondary" className="text-xs py-1">
                  "{command}"
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Click "Start Listening" or press the microphone button to use
              voice commands
            </p>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge className="mt-1">1</Badge>
                <div>
                  <p className="font-medium text-sm">Set up your preferences</p>
                  <p className="text-xs text-gray-600">
                    Configure accessibility settings and speech options
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge className="mt-1">2</Badge>
                <div>
                  <p className="font-medium text-sm">
                    Register people you know
                  </p>
                  <p className="text-xs text-gray-600">
                    Add photos of family and friends for recognition
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge className="mt-1">3</Badge>
                <div>
                  <p className="font-medium text-sm">Start using the camera</p>
                  <p className="text-xs text-gray-600">
                    Capture images and get AI-powered descriptions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            SmallBlind - Empowering independence through AI technology
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Press H for help • Voice commands always available
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
