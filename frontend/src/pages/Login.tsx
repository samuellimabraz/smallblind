import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, LogIn, Building, Key, AlertCircle, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { facialRecognitionAPI } from "@/services/facialRecognitionAPI";
import { speechService } from "@/services/speechService";

// Interfaces for form validation
interface FieldError {
  message: string;
  type: "error" | "warning" | "info";
}

interface LoginFormErrors {
  apiKey?: FieldError;
  organizationId?: FieldError;
  form?: string;
}

interface OrganizationFormErrors {
  orgName?: FieldError;
  form?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [apiKey, setApiKey] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginFormErrors>({});

  // Organization creation state
  const [newOrgName, setNewOrgName] = useState("");
  const [orgErrors, setOrgErrors] = useState<OrganizationFormErrors>({});

  // Current tab state
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    speechService.speakInstruction(
      "Welcome to SmallBlind login. Enter your organization details or create a new organization to get started.",
    );
  }, []);

  // Validation functions
  const validateApiKey = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { 
        message: "API key is required", 
        type: "error" 
      };
    }
    
    if (value.trim().length < 8) {
      return { 
        message: "API key should be at least 8 characters long", 
        type: "error" 
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return {
        message: "API key should only contain letters, numbers, hyphens, and underscores",
        type: "error"
      };
    }
    
    return undefined;
  };

  const validateOrganizationId = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { 
        message: "Organization ID is required", 
        type: "error" 
      };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return {
        message: "Organization ID should only contain letters, numbers, hyphens, and underscores",
        type: "error"
      };
    }
    
    return undefined;
  };

  const validateOrganizationName = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { 
        message: "Organization name is required", 
        type: "error" 
      };
    }
    
    if (value.trim().length < 3) {
      return { 
        message: "Organization name should be at least 3 characters long", 
        type: "error" 
      };
    }
    
    if (value.trim().length > 50) {
      return { 
        message: "Organization name should not exceed 50 characters", 
        type: "error" 
      };
    }
    
    return undefined;
  };

  // Form validation
  const validateLoginForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    
    const apiKeyError = validateApiKey(apiKey);
    if (apiKeyError) newErrors.apiKey = apiKeyError;
    
    const orgIdError = validateOrganizationId(organizationId);
    if (orgIdError) newErrors.organizationId = orgIdError;
    
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOrgForm = (): boolean => {
    const newErrors: OrganizationFormErrors = {};
    
    const orgNameError = validateOrganizationName(newOrgName);
    if (orgNameError) newErrors.orgName = orgNameError;
    
    setOrgErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes with validation
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    
    // Real-time validation
    const error = validateApiKey(value);
    setLoginErrors(prev => ({ ...prev, apiKey: error }));
  };

  const handleOrgIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrganizationId(value);
    
    // Real-time validation
    const error = validateOrganizationId(value);
    setLoginErrors(prev => ({ ...prev, organizationId: error }));
  };

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewOrgName(value);
    
    // Real-time validation
    const error = validateOrganizationName(value);
    setOrgErrors(prev => ({ ...prev, orgName: error }));
  };

  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Clear form-level errors when switching tabs
    setError(null);
    setLoginErrors(prev => ({ ...prev, form: undefined }));
    setOrgErrors(prev => ({ ...prev, form: undefined }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateLoginForm()) {
      speechService.speakError("Please correct the errors in the form.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLoginErrors({});

      // Set credentials in the API service
      facialRecognitionAPI.setCredentials(apiKey.trim(), organizationId.trim());

      // Test the connection by trying to fetch persons
      await facialRecognitionAPI.getPersons();

      // Store credentials in localStorage for persistence
      localStorage.setItem("smallblind_api_key", apiKey.trim());
      localStorage.setItem("smallblind_organization_id", organizationId.trim());

      speechService.speakInstruction(
        "Login successful. Redirecting to main menu.",
      );
      navigate("/menu");
    } catch (err) {
      const errorMessage =
        "Login failed. Please check your credentials and try again.";
      setLoginErrors(prev => ({ ...prev, form: errorMessage }));
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateOrgForm()) {
      speechService.speakError("Please correct the errors in the form.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setOrgErrors({});

      const organization = await facialRecognitionAPI.createOrganization(
        newOrgName.trim(),
      );

      // Auto-fill the login form with new organization details
      setApiKey(organization.apiKey);
      setOrganizationId(organization.id);

      // Switch to login tab
      setActiveTab("login");
      
      speechService.speakInstruction(
        `Organization ${newOrgName} created successfully. Your credentials have been filled in automatically.`,
      );
    } catch (err) {
      const errorMessage = "Failed to create organization. Please try again.";
      setOrgErrors(prev => ({ ...prev, form: errorMessage }));
      speechService.speakError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing credentials on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("smallblind_api_key");
    const savedOrgId = localStorage.getItem("smallblind_organization_id");

    if (savedApiKey && savedOrgId) {
      setApiKey(savedApiKey);
      setOrganizationId(savedOrgId);
      facialRecognitionAPI.setCredentials(savedApiKey, savedOrgId);
      speechService.speakInstruction(
        "Found saved credentials. You can log in or update them.",
      );
    }
  }, []);

  // Helper to render field error
  const renderFieldError = (error?: FieldError) => {
    if (!error) return null;
    
    return (
      <div className="flex items-start mt-1 text-xs">
        {error.type === "error" && <AlertCircle className="h-3 w-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />}
        {error.type === "warning" && <Info className="h-3 w-3 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />}
        {error.type === "info" && <Info className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />}
        <span className={`
          ${error.type === "error" ? "text-red-500" : ""}
          ${error.type === "warning" ? "text-yellow-500" : ""}
          ${error.type === "info" ? "text-blue-500" : ""}
        `}>
          {error.message}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-10 w-10 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">SmallBlind</h1>
          </div>
          <p className="text-gray-600">AI-Powered Visual Assistant</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Create</span>
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Sign In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-sm font-medium">
                      API Key
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="Enter your API key"
                        className={`pl-10 text-lg ${loginErrors.apiKey ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!loginErrors.apiKey}
                        aria-describedby={loginErrors.apiKey ? "api-key-error" : undefined}
                        required
                      />
                      {apiKey.trim() && !loginErrors.apiKey && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(loginErrors.apiKey)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-id" className="text-sm font-medium">
                      Organization ID
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="org-id"
                        value={organizationId}
                        onChange={handleOrgIdChange}
                        placeholder="Enter organization ID"
                        className={`pl-10 text-lg ${loginErrors.organizationId ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!loginErrors.organizationId}
                        aria-describedby={loginErrors.organizationId ? "org-id-error" : undefined}
                        required
                      />
                      {organizationId.trim() && !loginErrors.organizationId && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(loginErrors.organizationId)}
                  </div>

                  {loginErrors.form && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginErrors.form}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-lg py-6"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Organization Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Create Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name" className="text-sm font-medium">
                      Organization Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="org-name"
                        value={newOrgName}
                        onChange={handleOrgNameChange}
                        placeholder="Enter organization name"
                        className={`pl-10 text-lg ${orgErrors.orgName ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!orgErrors.orgName}
                        aria-describedby={orgErrors.orgName ? "org-name-error" : undefined}
                        required
                        minLength={3}
                        maxLength={50}
                      />
                      {newOrgName.trim() && !orgErrors.orgName && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(orgErrors.orgName)}
                    <p className="text-xs text-gray-500">
                      This will create a new organization and generate API
                      credentials
                    </p>
                  </div>

                  {orgErrors.form && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{orgErrors.form}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-lg py-6"
                  >
                    {isLoading ? "Creating..." : "Create Organization"}
                  </Button>

                  {apiKey && organizationId && activeTab === "create" && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 font-medium mb-2">
                        Organization created successfully!
                      </p>
                      <p className="text-xs text-green-700">
                        Your credentials have been auto-filled in the login tab.
                        Switch to the login tab to sign in.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? The facial recognition service should be running and
            accessible.
          </p>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-blue-600 p-0 mt-2"
          >
            Continue without login (limited features)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
