import { VisionAnalysisResult, DetectedObject } from "@/types";
import { env } from "@/lib/env";

class VisionModelsService {
  private readonly HUGGING_FACE_API_URL =
    "https://api-inference.huggingface.co/models";
  private readonly HUGGING_FACE_TOKEN = env.HUGGING_FACE_TOKEN;

  private async callHuggingFaceAPI(
    modelId: string,
    imageBlob: Blob,
  ): Promise<any> {
    if (!this.HUGGING_FACE_TOKEN) {
      throw new Error(
        "Hugging Face API token not configured. Please set VITE_HUGGING_FACE_TOKEN in your environment variables.",
      );
    }

    const response = await fetch(`${this.HUGGING_FACE_API_URL}/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBlob,
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    return response.json();
  }

  async detectObjects(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Using DETR (Detection Transformer) for object detection
      const result = await this.callHuggingFaceAPI(
        "facebook/detr-resnet-50",
        imageFile,
      );

      const objects: DetectedObject[] = result.map((detection: any) => ({
        label: detection.label,
        confidence: detection.score,
        boundingBox: {
          x: detection.box.xmin,
          y: detection.box.ymin,
          width: detection.box.xmax - detection.box.xmin,
          height: detection.box.ymax - detection.box.ymin,
        },
      }));

      const description =
        objects.length > 0
          ? `I can see ${objects.map((obj) => obj.label).join(", ")} in the image.`
          : "No objects detected in the image.";

      return {
        type: "object-detection",
        confidence:
          objects.length > 0
            ? Math.max(...objects.map((obj) => obj.confidence))
            : 0,
        description,
        objects,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Object detection error:", error);
      return {
        type: "object-detection",
        confidence: 0,
        description: "Unable to detect objects in the image.",
        objects: [],
        timestamp: new Date(),
      };
    }
  }

  async performOCR(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Using TrOCR for optical character recognition
      const result = await this.callHuggingFaceAPI(
        "microsoft/trocr-base-printed",
        imageFile,
      );

      const text = result.generated_text || "";

      return {
        type: "ocr",
        confidence: text.length > 0 ? 0.8 : 0,
        description:
          text.length > 0
            ? `Text found: "${text}"`
            : "No text detected in the image.",
        text,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("OCR error:", error);
      return {
        type: "ocr",
        confidence: 0,
        description: "Unable to read text from the image.",
        text: "",
        timestamp: new Date(),
      };
    }
  }

  async describeScene(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Using BLIP for image captioning
      const result = await this.callHuggingFaceAPI(
        "Salesforce/blip-image-captioning-large",
        imageFile,
      );

      const description =
        result.generated_text || "Unable to describe the scene.";

      return {
        type: "scene-description",
        confidence: 0.8,
        description: `Scene description: ${description}`,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Scene description error:", error);
      return {
        type: "scene-description",
        confidence: 0,
        description: "Unable to describe the scene.",
        timestamp: new Date(),
      };
    }
  }

  async analyzeImage(
    imageFile: File,
    analysisTypes: string[] = ["object-detection", "scene-description"],
  ): Promise<VisionAnalysisResult[]> {
    const results: VisionAnalysisResult[] = [];

    for (const type of analysisTypes) {
      switch (type) {
        case "object-detection":
          results.push(await this.detectObjects(imageFile));
          break;
        case "ocr":
          results.push(await this.performOCR(imageFile));
          break;
        case "scene-description":
          results.push(await this.describeScene(imageFile));
          break;
      }
    }

    return results;
  }
}

export const visionModelsService = new VisionModelsService();
