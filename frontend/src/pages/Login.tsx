import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, LogIn, UserPlus, Mail, Lock, AlertCircle, Check, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

// Interfaces for form validation
interface FieldError {
  message: string;
  type: "error" | "warning" | "info";
}

interface LoginFormErrors {
  email?: FieldError;
  password?: FieldError;
  form?: string;
}

interface RegisterFormErrors {
  username?: FieldError;
  email?: FieldError;
  password?: FieldError;
  confirmPassword?: FieldError;
  form?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState<LoginFormErrors>({});

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterFormErrors>({});

  // Current tab state
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Validation functions
  const validateEmail = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { message: "Email is required", type: "error" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { message: "Please enter a valid email address", type: "error" };
    }
    return undefined;
  };

  const validatePassword = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { message: "Password is required", type: "error" };
    }
    if (value.length < 8) {
      return { message: "Password must be at least 8 characters long", type: "error" };
    }
    return undefined;
  };

  const validateUsername = (value: string): FieldError | undefined => {
    if (!value.trim()) {
      return { message: "Username is required", type: "error" };
    }
    if (value.trim().length < 3) {
      return { message: "Username must be at least 3 characters long", type: "error" };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { message: "Username can only contain letters, numbers, hyphens, and underscores", type: "error" };
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string, password: string): FieldError | undefined => {
    if (!value.trim()) {
      return { message: "Please confirm your password", type: "error" };
    }
    if (value !== password) {
      return { message: "Passwords do not match", type: "error" };
    }
    return undefined;
  };

  // Form validation
  const validateLoginForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    const emailError = validateEmail(loginForm.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(loginForm.password);
    if (passwordError) newErrors.password = passwordError;

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    const usernameError = validateUsername(registerForm.username);
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateEmail(registerForm.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(registerForm.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(registerForm.confirmPassword, registerForm.password);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes with validation
  const handleLoginChange = (field: keyof typeof loginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLoginForm(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    let error: FieldError | undefined;
    if (field === 'email') {
      error = validateEmail(value);
    } else if (field === 'password') {
      error = validatePassword(value);
    }

    setLoginErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleRegisterChange = (field: keyof typeof registerForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRegisterForm(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    let error: FieldError | undefined;
    if (field === 'username') {
      error = validateUsername(value);
    } else if (field === 'email') {
      error = validateEmail(value);
    } else if (field === 'password') {
      error = validatePassword(value);
    } else if (field === 'confirmPassword') {
      error = validateConfirmPassword(value, registerForm.password);
    }

    setRegisterErrors(prev => ({ ...prev, [field]: error }));
  };

  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setLoginErrors({});
    setRegisterErrors({});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    try {
      setError(null);
      await login(loginForm);
      // Navigation is handled by the useEffect above
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(errorMessage);
      setLoginErrors({ form: errorMessage });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    try {
      setError(null);
      await register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      // Navigation is handled by the useEffect above
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
      setRegisterErrors({ form: errorMessage });
    }
  };

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
            <TabsTrigger value="register" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Register</span>
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
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={handleLoginChange('email')}
                        placeholder="Enter your email"
                        className={`pl-10 ${loginErrors.email ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!loginErrors.email}
                        required
                      />
                      {loginForm.email.trim() && !loginErrors.email && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(loginErrors.email)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginChange('password')}
                        placeholder="Enter your password"
                        className={`pl-10 ${loginErrors.password ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!loginErrors.password}
                        required
                      />
                      {loginForm.password.trim() && !loginErrors.password && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(loginErrors.password)}
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
                    className="w-full"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Create Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm font-medium">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-username"
                        type="text"
                        value={registerForm.username}
                        onChange={handleRegisterChange('username')}
                        placeholder="Choose a username"
                        className={`pl-10 ${registerErrors.username ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!registerErrors.username}
                        required
                      />
                      {registerForm.username.trim() && !registerErrors.username && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(registerErrors.username)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange('email')}
                        placeholder="Enter your email"
                        className={`pl-10 ${registerErrors.email ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!registerErrors.email}
                        required
                      />
                      {registerForm.email.trim() && !registerErrors.email && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(registerErrors.email)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange('password')}
                        placeholder="Create a password"
                        className={`pl-10 ${registerErrors.password ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!registerErrors.password}
                        required
                      />
                      {registerForm.password.trim() && !registerErrors.password && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(registerErrors.password)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange('confirmPassword')}
                        placeholder="Confirm your password"
                        className={`pl-10 ${registerErrors.confirmPassword ? "border-red-500" : ""}`}
                        disabled={isLoading}
                        aria-invalid={!!registerErrors.confirmPassword}
                        required
                      />
                      {registerForm.confirmPassword.trim() && !registerErrors.confirmPassword && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {renderFieldError(registerErrors.confirmPassword)}
                  </div>

                  {registerErrors.form && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{registerErrors.form}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
