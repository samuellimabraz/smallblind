import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Users,
  Settings,
  LogOut,
  Eye,
  Volume2,
  Mic,
  Home,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { AccessibilitySettings } from "@/types";
import { speechService } from "@/services/speechService";

const MainMenu = () => {
  const navigate = useNavigate();
  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>({
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    });

  const menuItems = [
    {
      icon: Camera,
      title: "Camera Analysis",
      description: "Capture and analyze images with AI",
      longDescription:
        "Use your camera to capture images and get instant AI-powered analysis including object detection, scene description, text recognition, and face identification.",
      route: "/camera",
      keyCommand: "C",
      color: "blue",
    },
    {
      icon: Users,
      title: "Person Management",
      description: "Manage registered people",
      longDescription:
        "Register family, friends, and important people with photos so the system can recognize them in real-time camera analysis.",
      route: "/persons",
      keyCommand: "P",
      color: "green",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "App preferences and accessibility",
      longDescription:
        "Configure accessibility options, speech settings, camera preferences, and other app settings to customize your experience.",
      route: "/settings",
      keyCommand: "S",
      color: "purple",
    },
  ];

  const quickActions = [
    {
      icon: Volume2,
      title: "Voice Commands",
      action: startVoiceCommand,
      description: "Activate voice control",
    },
    {
      icon: HelpCircle,
      title: "Help",
      action: showHelp,
      description: "Get help and instructions",
    },
    {
      icon: LogOut,
      title: "Logout",
      action: logout,
      description: "Return to login screen",
    },
  ];

  async function startVoiceCommand() {
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
        showHelp();
      } else {
        speechService.speakInstruction(
          'Command not recognized. Say "help" for available commands.',
        );
      }
    } catch (error) {
      speechService.speakError("Voice recognition failed. Please try again.");
    }
  }

  function showHelp() {
    speechService.speakInstruction(
      "SmallBlind main menu. Available options: Camera Analysis to capture and analyze images, " +
        "Person Management to register people for recognition, Settings to configure the app. " +
        "Use keyboard shortcuts: C for camera, P for people, S for settings, H for help, Escape to go home. " +
        "Voice commands include: go to camera, go to people, go to settings, help.",
    );
  }

  function logout() {
    localStorage.removeItem("smallblind_api_key");
    localStorage.removeItem("smallblind_organization_id");
    speechService.speakInstruction("Logged out successfully.");
    navigate("/login");
  }

  useEffect(() => {
    speechService.speakInstruction(
      "SmallBlind main menu. Choose from Camera Analysis, Person Management, or Settings. Use voice commands or keyboard shortcuts.",
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
          showHelp();
          break;
        case "escape":
          navigate("/");
          break;
        case "v":
          startVoiceCommand();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const handleAccessibilityChange = (settings: AccessibilitySettings) => {
    setAccessibilitySettings(settings);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600 hover:bg-blue-200";
      case "green":
        return "bg-green-100 text-green-600 hover:bg-green-200";
      case "purple":
        return "bg-purple-100 text-purple-600 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-600 hover:bg-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SmallBlind</h1>
              <p className="text-gray-600">Main Menu</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </div>

        {/* Accessibility Controls */}
        <div className="mb-8">
          <AccessibilityControls
            onSettingsChange={handleAccessibilityChange}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Main Menu Items */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item, index) => (
            <Card
              key={index}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200"
              onClick={() => navigate(item.route)}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${getColorClasses(item.color)}`}
                >
                  <item.icon className="h-10 w-10" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">{item.description}</p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {item.longDescription}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    Press {item.keyCommand}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={action.action}
                  className="h-16 flex-col space-y-1 text-sm hover:bg-gray-50"
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Voice Commands Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Mic className="h-5 w-5 mr-2 text-blue-600" />
              Available Voice Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "Go to camera",
                "Go to people",
                "Go to settings",
                "Help",
                "Voice commands",
                "Logout",
              ].map((command, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs py-1 text-center"
                >
                  "{command}"
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Press V to activate voice commands or click the microphone button
            </p>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Keyboard Shortcuts</p>
          <div className="flex flex-wrap justify-center gap-2">
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">C</kbd>
            <span className="text-xs text-gray-500">Camera</span>
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">P</kbd>
            <span className="text-xs text-gray-500">People</span>
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">S</kbd>
            <span className="text-xs text-gray-500">Settings</span>
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">H</kbd>
            <span className="text-xs text-gray-500">Help</span>
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">V</kbd>
            <span className="text-xs text-gray-500">Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
