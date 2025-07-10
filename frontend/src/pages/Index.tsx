import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Camera,
  Users,
  ArrowRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

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
  ];

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "c":
          navigate("/camera");
          break;
        case "p":
          navigate("/persons");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">SmallBlind</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered visual assistant for enhanced accessibility and
            independence
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={feature.action}
            >
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <feature.icon className="h-6 w-6 mr-3 text-blue-600 group-hover:text-blue-700" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {feature.keyCommand}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-gray-600">
                Welcome to SmallBlind! Here's how to get started:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Register People</h3>
                  <p className="text-sm text-gray-600">
                    Add family and friends for recognition
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Start Analyzing</h3>
                  <p className="text-sm text-gray-600">
                    Use the camera to analyze your environment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">What SmallBlind Can Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Object Detection</h3>
                <p className="text-sm text-gray-600">
                  Identify and describe objects in your surroundings
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Camera className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Scene Analysis</h3>
                <p className="text-sm text-gray-600">
                  Get detailed descriptions of scenes and environments
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Face Recognition</h3>
                <p className="text-sm text-gray-600">
                  Recognize registered family and friends
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
                <p className="text-sm text-gray-600">
                  Customizable interface for your needs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
