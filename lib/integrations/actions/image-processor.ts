import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const imageProcessor: Integration = createIntegration({
  id: "image_processor",
  name: "Image Processor",
  category: "action",
  description: "Resize, crop, convert formats, OCR text extraction",
  icon: "image",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "operation",
        type: "select",
        label: "Operation",
        required: true,
        options: [
          { label: "Resize", value: "resize" },
          { label: "Crop", value: "crop" },
          { label: "Convert Format", value: "convert" },
          { label: "OCR Text Extraction", value: "ocr" },
          { label: "Apply Filters", value: "filters" },
          { label: "Watermark", value: "watermark" },
        ],
      },
      {
        key: "image_url",
        type: "url",
        label: "Image URL",
        placeholder: "https://example.com/image.jpg",
        required: false,
        supportExpressions: true,
      },
      {
        key: "image_base64",
        type: "textarea",
        label: "Image Base64",
        placeholder: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "width",
        type: "number",
        label: "Width (pixels)",
        placeholder: "800",
        required: false,
      },
      {
        key: "height",
        type: "number",
        label: "Height (pixels)",
        placeholder: "600",
        required: false,
      },
      {
        key: "maintain_aspect_ratio",
        type: "boolean",
        label: "Maintain Aspect Ratio",
        required: false,
      },
      {
        key: "crop_x",
        type: "number",
        label: "Crop X Position",
        placeholder: "100",
        required: false,
      },
      {
        key: "crop_y",
        type: "number",
        label: "Crop Y Position",
        placeholder: "100",
        required: false,
      },
      {
        key: "crop_width",
        type: "number",
        label: "Crop Width",
        placeholder: "400",
        required: false,
      },
      {
        key: "crop_height",
        type: "number",
        label: "Crop Height",
        placeholder: "300",
        required: false,
      },
      {
        key: "output_format",
        type: "select",
        label: "Output Format",
        required: false,
        options: [
          { label: "JPEG", value: "jpeg" },
          { label: "PNG", value: "png" },
          { label: "WebP", value: "webp" },
          { label: "GIF", value: "gif" },
          { label: "BMP", value: "bmp" },
        ],
      },
      {
        key: "quality",
        type: "number",
        label: "Quality (1-100)",
        placeholder: "85",
        required: false,
      },
      {
        key: "ocr_language",
        type: "select",
        label: "OCR Language",
        required: false,
        options: [
          { label: "English", value: "eng" },
          { label: "Spanish", value: "spa" },
          { label: "French", value: "fra" },
          { label: "German", value: "deu" },
          { label: "Chinese", value: "chi_sim" },
          { label: "Japanese", value: "jpn" },
        ],
      },
      {
        key: "filters",
        type: "textarea",
        label: "Filters (JSON)",
        placeholder:
          '{"brightness": 10, "contrast": 20, "saturation": 15, "blur": 0}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "watermark_text",
        type: "text",
        label: "Watermark Text",
        placeholder: "Company Name",
        required: false,
        supportExpressions: true,
      },
      {
        key: "watermark_position",
        type: "select",
        label: "Watermark Position",
        required: false,
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Center", value: "center" },
        ],
      },
      {
        key: "output_filename",
        type: "text",
        label: "Output Filename",
        placeholder: "processed-image.jpg",
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["operation"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();

      const operation = config.operation as string;
      const imageUrl = config.image_url as string;
      const imageBase64 = config.image_base64 as string;
      const width = config.width as number;
      const height = config.height as number;
      const maintainAspectRatio =
        (config.maintain_aspect_ratio as boolean) || true;
      const outputFormat = (config.output_format as string) || "jpeg";
      const quality = (config.quality as number) || 85;
      const ocrLanguage = (config.ocr_language as string) || "eng";
      const watermarkText = (config.watermark_text as string) || "";
      const watermarkPosition =
        (config.watermark_position as string) || "bottom-right";
      const outputFilename =
        (config.output_filename as string) ||
        `processed_${Date.now()}.${outputFormat}`;

      let filters = {};
      if (config.filters) {
        try {
          filters = JSON.parse(config.filters as string);
        } catch {
          filters = {};
        }
      }

      const imageId = `img_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Mock OCR result for OCR operation
      let ocrText = "";
      if (operation === "ocr") {
        ocrText =
          "This is a sample text extracted from the image using OCR technology. The text recognition accuracy depends on image quality and text clarity.";
      }

      return {
        success: true,
        data: {
          imageId,
          operation,
          originalImage: imageUrl || "base64_image",
          processedImage: `https://api.example.com/images/${imageId}/download`,
          outputFormat,
          quality,
          dimensions: {
            width: width || 800,
            height: height || 600,
            originalWidth: 1200,
            originalHeight: 800,
          },
          cropInfo:
            operation === "crop"
              ? {
                  x: (config.crop_x as number) || 0,
                  y: (config.crop_y as number) || 0,
                  width: (config.crop_width as number) || 400,
                  height: (config.crop_height as number) || 300,
                }
              : null,
          filters: Object.keys(filters).length > 0 ? filters : null,
          watermark: watermarkText
            ? {
                text: watermarkText,
                position: watermarkPosition,
              }
            : null,
          ocrResult:
            operation === "ocr"
              ? {
                  text: ocrText,
                  language: ocrLanguage,
                  confidence: 0.95,
                  wordCount: ocrText.split(" ").length,
                }
              : null,
          fileSize: Math.floor(Math.random() * 2000000) + 100000, // 100KB - 2MB
          downloadUrl: `https://api.example.com/images/${imageId}/download`,
          previewUrl: `https://api.example.com/images/${imageId}/preview`,
          filename: outputFilename,
          createdAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "image_processor" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.operation) {
        errors.operation = "Operation is required";
      }

      if (!config.image_url && !config.image_base64) {
        errors.image_url = "Either image URL or base64 data is required";
      }

      if (config.operation === "resize" && !config.width && !config.height) {
        errors.width = "Width or height is required for resize operation";
      }

      if (config.operation === "crop") {
        if (!config.crop_width || !config.crop_height) {
          errors.crop_width =
            "Crop width and height are required for crop operation";
        }
      }

      if (
        config.quality &&
        typeof config.quality === "number" &&
        (config.quality < 1 || config.quality > 100)
      ) {
        errors.quality = "Quality must be between 1 and 100";
      }

      if (config.filters) {
        try {
          JSON.parse(config.filters as string);
        } catch {
          errors.filters = "Filters must be a valid JSON object";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
