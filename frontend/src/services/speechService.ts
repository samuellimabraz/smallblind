import { AccessibilitySettings } from "@/types";

class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private settings: AccessibilitySettings;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = {
      highContrast: false,
      textToSpeech: true,
      voiceCommands: true,
      fontSize: "normal",
      speechRate: 1.0,
    };

    // Initialize speech recognition if available
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";
    }
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  speak(
    text: string,
    options: { priority?: "high" | "normal"; interrupt?: boolean } = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.settings.textToSpeech) {
        resolve();
        return;
      }

      if (options.interrupt) {
        this.synthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.settings.speechRate;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) =>
        reject(new Error(`Speech synthesis error: ${event.error}`));

      // Select a suitable voice
      const voices = this.synthesis.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.startsWith("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      this.synthesis.speak(utterance);
    });
  }

  speakAnalysisResult(result: string) {
    this.speak(result, { priority: "high", interrupt: false });
  }

  speakNavigationInfo(text: string) {
    this.speak(text, { priority: "normal", interrupt: false });
  }

  speakError(errorMessage: string) {
    this.speak(`Error: ${errorMessage}`, { priority: "high", interrupt: true });
  }

  speakInstruction(instruction: string) {
    this.speak(instruction, { priority: "normal", interrupt: false });
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition || !this.settings.voiceCommands) {
        reject(new Error("Voice recognition not available or disabled"));
        return;
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript.toLowerCase().trim());
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Voice recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        // If no result was captured, resolve with empty string
        resolve("");
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  processVoiceCommand(
    command: string,
  ): { action: string; parameters?: any } | null {
    const lowerCommand = command.toLowerCase();

    // Navigation commands
    if (
      lowerCommand.includes("go to") ||
      lowerCommand.includes("navigate to")
    ) {
      if (lowerCommand.includes("camera") || lowerCommand.includes("analyze")) {
        return { action: "navigate", parameters: { page: "camera" } };
      }
      if (
        lowerCommand.includes("people") ||
        lowerCommand.includes("person") ||
        lowerCommand.includes("face")
      ) {
        return { action: "navigate", parameters: { page: "persons" } };
      }
      if (
        lowerCommand.includes("settings") ||
        lowerCommand.includes("preferences")
      ) {
        return { action: "navigate", parameters: { page: "settings" } };
      }
      if (lowerCommand.includes("home") || lowerCommand.includes("menu")) {
        return { action: "navigate", parameters: { page: "menu" } };
      }
    }

    // Camera commands
    if (
      lowerCommand.includes("take photo") ||
      lowerCommand.includes("capture") ||
      lowerCommand.includes("snap")
    ) {
      return { action: "camera", parameters: { action: "capture" } };
    }

    // Analysis commands
    if (
      lowerCommand.includes("describe") ||
      lowerCommand.includes("what do you see")
    ) {
      return { action: "analyze", parameters: { type: "scene-description" } };
    }
    if (lowerCommand.includes("read text") || lowerCommand.includes("ocr")) {
      return { action: "analyze", parameters: { type: "ocr" } };
    }
    if (
      lowerCommand.includes("find objects") ||
      lowerCommand.includes("detect")
    ) {
      return { action: "analyze", parameters: { type: "object-detection" } };
    }

    // Help command
    if (
      lowerCommand.includes("help") ||
      lowerCommand.includes("what can you do")
    ) {
      return { action: "help" };
    }

    return null;
  }

  stop() {
    this.synthesis.cancel();
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isSupported(): boolean {
    return "speechSynthesis" in window;
  }

  isVoiceRecognitionSupported(): boolean {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }
}

export const speechService = new SpeechService();

// Global type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
