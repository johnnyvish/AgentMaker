import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const pdfGenerator: Integration = createIntegration({
  id: "pdf_generator",
  name: "PDF Generator",
  category: "action",
  description: "Create PDFs from templates, merge documents",
  icon: "file-text",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "template_type",
        type: "select",
        label: "Template Type",
        required: true,
        options: [
          { label: "HTML Template", value: "html" },
          { label: "JSON Data", value: "json" },
          { label: "Merge PDFs", value: "merge" },
        ],
      },
      {
        key: "html_content",
        type: "textarea",
        label: "HTML Content",
        placeholder:
          "<html><body><h1>{{title}}</h1><p>{{content}}</p></body></html>",
        required: false,
        supportExpressions: true,
      },
      {
        key: "json_data",
        type: "textarea",
        label: "JSON Data",
        placeholder:
          '{"title": "Document Title", "content": "Document content..."}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "pdf_files",
        type: "textarea",
        label: "PDF Files to Merge (JSON array)",
        placeholder: '["file1.pdf", "file2.pdf", "file3.pdf"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "page_size",
        type: "select",
        label: "Page Size",
        required: false,
        options: [
          { label: "A4", value: "A4" },
          { label: "Letter", value: "Letter" },
          { label: "Legal", value: "Legal" },
          { label: "A3", value: "A3" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        key: "orientation",
        type: "select",
        label: "Orientation",
        required: false,
        options: [
          { label: "Portrait", value: "portrait" },
          { label: "Landscape", value: "landscape" },
        ],
      },
      {
        key: "margins",
        type: "text",
        label: "Margins (top,right,bottom,left)",
        placeholder: "20,20,20,20",
        required: false,
      },
      {
        key: "header_footer",
        type: "boolean",
        label: "Include Header/Footer",
        required: false,
      },
      {
        key: "header_text",
        type: "text",
        label: "Header Text",
        placeholder: "Company Name - {{date}}",
        required: false,
        supportExpressions: true,
      },
      {
        key: "footer_text",
        type: "text",
        label: "Footer Text",
        placeholder: "Page {{page}} of {{total}}",
        required: false,
        supportExpressions: true,
      },
      {
        key: "watermark",
        type: "text",
        label: "Watermark Text",
        placeholder: "DRAFT",
        required: false,
      },
      {
        key: "output_filename",
        type: "text",
        label: "Output Filename",
        placeholder: "generated-document.pdf",
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["template_type"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const timestamp = new Date().toISOString();

      const templateType = config.template_type as string;
      const pageSize = (config.page_size as string) || "A4";
      const orientation = (config.orientation as string) || "portrait";
      const margins = (config.margins as string) || "20,20,20,20";
      const includeHeaderFooter = (config.header_footer as boolean) || false;
      const watermark = (config.watermark as string) || "";
      const outputFilename =
        (config.output_filename as string) || `document_${Date.now()}.pdf`;

      let pdfContent: unknown = null; // Used for future PDF content processing
      let mergeFiles: string[] = [];

      switch (templateType) {
        case "html":
          pdfContent = {
            type: "html",
            content:
              (config.html_content as string) ||
              "<html><body><h1>Generated PDF</h1></body></html>",
            data: config.json_data
              ? JSON.parse(config.json_data as string)
              : {},
          };
          break;
        case "json":
          pdfContent = {
            type: "json",
            data: config.json_data
              ? JSON.parse(config.json_data as string)
              : {},
          };
          break;
        case "merge":
          if (config.pdf_files) {
            try {
              mergeFiles = JSON.parse(config.pdf_files as string);
            } catch {
              mergeFiles = [];
            }
          }
          break;
      }

      const pdfId = `pdf_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          pdfId,
          filename: outputFilename,
          templateType,
          pageSize,
          orientation,
          margins: margins.split(",").map((m) => parseInt(m.trim())),
          includeHeaderFooter,
          headerText: (config.header_text as string) || "",
          footerText: (config.footer_text as string) || "",
          watermark,
          fileSize: Math.floor(Math.random() * 500000) + 50000, // 50KB - 550KB
          pageCount:
            templateType === "merge"
              ? mergeFiles.length * 2
              : Math.floor(Math.random() * 10) + 1,
          downloadUrl: `https://api.example.com/pdfs/${pdfId}/download`,
          previewUrl: `https://api.example.com/pdfs/${pdfId}/preview`,
          createdAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "pdf_generator" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.template_type) {
        errors.template_type = "Template type is required";
      }

      if (config.template_type === "html" && !config.html_content) {
        errors.html_content = "HTML content is required for HTML template type";
      }

      if (config.template_type === "merge" && !config.pdf_files) {
        errors.pdf_files = "PDF files are required for merge template type";
      }

      if (config.json_data) {
        try {
          JSON.parse(config.json_data as string);
        } catch {
          errors.json_data = "JSON data must be a valid JSON object";
        }
      }

      if (config.pdf_files) {
        try {
          JSON.parse(config.pdf_files as string);
        } catch {
          errors.pdf_files = "PDF files must be a valid JSON array";
        }
      }

      if (config.margins) {
        const marginParts = (config.margins as string).split(",");
        if (
          marginParts.length !== 4 ||
          marginParts.some((m) => isNaN(parseInt(m.trim())))
        ) {
          errors.margins = "Margins must be 4 comma-separated numbers";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
