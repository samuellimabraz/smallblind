import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Users,
  LogOut,
  Eye,
  Home,
  HelpCircle,
  User,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const MainMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      icon: History,
      title: "Vision History",
      description: "View your analysis history",
      longDescription:
        "Browse through your past AI vision analysis results, including object detection and image description history with detailed information.",
      route: "/history",
      keyCommand: "H",
      color: "purple",
    },
  ];

  const quickActions = [
    {
      icon: HelpCircle,
      title: "Help",
      action: showHelp,
      description: "Get help and instructions",
    },
    {
      icon: LogOut,
      title: "Logout",
      action: handleLogout,
      description: "Sign out of your account",
    },
  ];

  function showHelp() {
    // Show help information or navigate to help page
    alert(
      "SmallBlind main menu. Available options: Camera Analysis to capture and analyze images, " +
      "Person Management to register people for recognition, Vision History to view past analysis results. " +
      "Use keyboard shortcuts: C for camera, P for people, H for history, F1 for help, Escape to go home."
    );
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Navigate to login anyway
      navigate("/login");
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return;

      switch (event.key.toLowerCase()) {
        case "c":
          navigate("/camera");
          break;
        case "p":
          navigate("/persons");
          break;
        case "h":
          navigate("/history");
          break;
        case "f1":
          event.preventDefault();
          showHelp();
          break;
        case "escape":
          navigate("/");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">SmallBlind</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">AI-Powered Visual Assistant</p>
          {user && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span>Welcome, {user.username}</span>
            </div>
          )}
        </div>

        {/* Main Menu Items */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-8">
          {menuItems.map((item) => (
            <Card
              key={item.title}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
              onClick={() => navigate(item.route)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-lg ${item.color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : item.color === "green"
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-600"
                      }`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500 font-normal">
                      Press {item.keyCommand} to open
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">{item.description}</p>
                <p className="text-sm text-gray-500">{item.longDescription}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4 mb-8">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="flex items-center space-x-2"
            >
              <action.icon className="h-4 w-4" />
              <span>{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Navigation Instructions */}
        <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p className="mb-2">
            <strong>Keyboard Shortcuts:</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd> Camera
              Analysis
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">P</kbd> Person
              Management
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">H</kbd> Vision
              History
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">F1</kbd> Help
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> Home
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
