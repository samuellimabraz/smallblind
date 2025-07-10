import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AccessibilitySettings } from "@/types";
import { speechService } from "@/services/speechService";

interface AccessibilityControlsProps {
  onSettingsChange: (settings: AccessibilitySettings) => void;
  className?: string;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  onSettingsChange,
  className = "",
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    textToSpeech: true,
    voiceCommands: true,
    fontSize: "normal",
    speechRate: 1.0,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    speechService.updateSettings(newSettings);
    onSettingsChange(newSettings);

    // Announce setting changes
    const settingName =
      key === "textToSpeech"
        ? "text to speech"
        : key === "voiceCommands"
          ? "voice commands"
          : key === "highContrast"
            ? "high contrast"
            : key === "fontSize"
              ? "font size"
              : key === "speechRate"
                ? "speech rate"
                : key;

    speechService.speakInstruction(
      `${settingName} ${value === true ? "enabled" : value === false ? "disabled" : `set to ${value}`}`,
    );
  };

  const toggleTextToSpeech = () => {
    updateSetting("textToSpeech", !settings.textToSpeech);
  };

  const toggleVoiceCommands = () => {
    updateSetting("voiceCommands", !settings.voiceCommands);
  };

  const toggleHighContrast = () => {
    updateSetting("highContrast", !settings.highContrast);
    // Apply high contrast styles to document
    if (!settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const handleSpeechRateChange = (value: number[]) => {
    updateSetting("speechRate", value[0]);
  };

  const handleFontSizeChange = (value: string) => {
    updateSetting("fontSize", value as "normal" | "large" | "extra-large");
    // Apply font size to document
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, "")
      .concat(` font-size-${value}`);
  };

  // Apply settings on component mount
  useEffect(() => {
    speechService.updateSettings(settings);
    onSettingsChange(settings);
  }, []);

  // Quick toggle buttons
  const quickControls = (
    <div className="flex items-center space-x-2">
      <Button
        onClick={toggleTextToSpeech}
        variant={settings.textToSpeech ? "default" : "outline"}
        size="sm"
        className="h-10 w-10 p-0"
        aria-label={`${settings.textToSpeech ? "Disable" : "Enable"} text to speech`}
      >
        {settings.textToSpeech ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>

      <Button
        onClick={toggleVoiceCommands}
        variant={settings.voiceCommands ? "default" : "outline"}
        size="sm"
        className="h-10 w-10 p-0"
        aria-label={`${settings.voiceCommands ? "Disable" : "Enable"} voice commands`}
      >
        {settings.voiceCommands ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
      </Button>

      <Button
        onClick={toggleHighContrast}
        variant={settings.highContrast ? "default" : "outline"}
        size="sm"
        className="h-10 w-10 p-0"
        aria-label={`${settings.highContrast ? "Disable" : "Enable"} high contrast`}
      >
        {settings.highContrast ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        size="sm"
        className="h-10 w-10 p-0"
        aria-label="More accessibility settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );

  if (!isExpanded) {
    return (
      <div
        className={`${className} flex justify-between items-center p-3 bg-gray-50 rounded-lg`}
      >
        <span className="text-sm font-medium text-gray-700">Accessibility</span>
        {quickControls}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Accessibility Settings</CardTitle>
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="sm"
            aria-label="Collapse settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Speech Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Speech</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="tts-toggle" className="text-sm font-medium">
              Text to Speech
            </Label>
            <Switch
              id="tts-toggle"
              checked={settings.textToSpeech}
              onCheckedChange={toggleTextToSpeech}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="voice-toggle" className="text-sm font-medium">
              Voice Commands
            </Label>
            <Switch
              id="voice-toggle"
              checked={settings.voiceCommands}
              onCheckedChange={toggleVoiceCommands}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Speech Rate: {settings.speechRate.toFixed(1)}x
            </Label>
            <Slider
              value={[settings.speechRate]}
              onValueChange={handleSpeechRateChange}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Visual Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Visual</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="contrast-toggle" className="text-sm font-medium">
              High Contrast
            </Label>
            <Switch
              id="contrast-toggle"
              checked={settings.highContrast}
              onCheckedChange={toggleHighContrast}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={handleFontSizeChange}
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
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
          {quickControls}
        </div>

        {/* Help Text */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            Voice commands: "describe", "read text", "find objects", "take
            photo", "go to [page]", "help"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
