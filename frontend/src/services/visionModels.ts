import { VisionAnalysisResult, DetectedObject } from "@/types";
import { env } from "@/lib/env";
import { objectDetectionService } from "./objectDetectionService";
import { imageDescriptionService } from "./imageDescriptionService";

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
      // Use the real backend object detection service
      const result = await objectDetectionService.detectObjects(imageFile, {
        threshold: 0.5,
        maxObjects: 20,
      });

      if (!result.success) {
        throw new Error("Object detection failed");
      }

      console.log("Raw detection result:", result);

      const objects: DetectedObject[] = result.data.detections.map((detection) => {
        console.log("Processing detection:", detection);

        const boundingBox = {
          // Use the coordinates directly from the backend
          x: detection.box.xmin,
          y: detection.box.ymin,
          width: detection.box.width,
          height: detection.box.height,
        };

        console.log("Mapped bounding box:", boundingBox);

        return {
          label: detection.label,
          confidence: detection.score,
          boundingBox,
        };
      });

      console.log("Final mapped objects:", objects);

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
        processingTime: result.data.processingTime,
        model: result.data.model,
        imageFile, // Include the original image file for bounding box rendering
      };
    } catch (error) {
      console.error("Object detection error:", error);
      return {
        type: "object-detection",
        confidence: 0,
        description: `Unable to detect objects in the image. ${error instanceof Error ? error.message : "Unknown error"}`,
        objects: [],
        timestamp: new Date(),
      };
    }
  }

  async performOCR(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Use the backend image description service with OCR prompt
      const result = await imageDescriptionService.extractText(imageFile);

      if (!result.success) {
        throw new Error("Text extraction failed");
      }

      const text = result.data.description;
      const hasText = text && text.toLowerCase() !== "no text found" && text.trim().length > 0;

      return {
        type: "ocr",
        confidence: hasText ? 0.8 : 0,
        description: hasText ? `Text found: "${text}"` : "No text detected in the image.",
        text: hasText ? text : "",
        timestamp: new Date(),
        processingTime: result.data.processingTime,
        model: result.data.model,
      };
    } catch (error) {
      console.error("OCR error:", error);
      return {
        type: "ocr",
        confidence: 0,
        description: `Unable to read text from the image. ${error instanceof Error ? error.message : "Unknown error"}`,
        text: "",
        timestamp: new Date(),
      };
    }
  }

  async describeScene(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      // Use the backend image description service with scene description prompt
      const result = await imageDescriptionService.describeScene(imageFile);

      if (!result.success) {
        throw new Error("Scene description failed");
      }

      const description = result.data.description;

      return {
        type: "scene-description",
        confidence: 0.8,
        description: description,
        timestamp: new Date(),
        processingTime: result.data.processingTime,
        model: result.data.model,
      };
    } catch (error) {
      console.error("Scene description error:", error);
      return {
        type: "scene-description",
        confidence: 0,
        description: `Unable to describe the scene. ${error instanceof Error ? error.message : "Unknown error"}`,
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
