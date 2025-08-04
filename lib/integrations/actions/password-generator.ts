import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper functions
function getDefaultLength(type: string): number {
  switch (type) {
    case "password":
      return 16;
    case "api_key":
      return 32;
    case "token":
      return 64;
    case "pin":
      return 6;
    default:
      return 16;
  }
}

function generateCharset(options: {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharset: string;
  type: string;
}): string {
  if (options.customCharset) {
    return options.customCharset;
  }

  let charset = "";

  if (options.type === "pin") {
    charset = "0123456789";
  } else {
    if (options.includeUppercase) {
      charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (options.includeLowercase) {
      charset += "abcdefghijklmnopqrstuvwxyz";
    }
    if (options.includeNumbers) {
      charset += "0123456789";
    }
    if (options.includeSymbols) {
      charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }
  }

  if (options.excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, "");
  }

  if (options.excludeAmbiguous) {
    charset = charset.replace(/[{}[\]()/\\'"`~,;:.<>]/g, "");
  }

  return charset || "abcdefghijklmnopqrstuvwxyz0123456789";
}

function generateRandomString(charset: string, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function calculateStrength(charset: string, length: number): string {
  const entropy = calculateEntropy(charset, length);
  if (entropy >= 128) return "Very Strong";
  if (entropy >= 64) return "Strong";
  if (entropy >= 32) return "Medium";
  if (entropy >= 16) return "Weak";
  return "Very Weak";
}

function calculateEntropy(charset: string, length: number): number {
  return Math.log2(Math.pow(charset.length, length));
}

export const passwordGenerator: Integration = createIntegration({
  id: "password_generator",
  name: "Password Generator",
  category: "action",
  description: "Generate secure passwords, API keys",
  icon: "shield",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "type",
        type: "select",
        label: "Type",
        required: true,
        options: [
          { label: "Password", value: "password" },
          { label: "API Key", value: "api_key" },
          { label: "Token", value: "token" },
          { label: "PIN", value: "pin" },
        ],
      },
      {
        key: "length",
        type: "number",
        label: "Length",
        placeholder: "16",
        required: false,
      },
      {
        key: "include_uppercase",
        type: "boolean",
        label: "Include Uppercase Letters",
        required: false,
      },
      {
        key: "include_lowercase",
        type: "boolean",
        label: "Include Lowercase Letters",
        required: false,
      },
      {
        key: "include_numbers",
        type: "boolean",
        label: "Include Numbers",
        required: false,
      },
      {
        key: "include_symbols",
        type: "boolean",
        label: "Include Symbols",
        required: false,
      },
      {
        key: "exclude_similar",
        type: "boolean",
        label: "Exclude Similar Characters",
        required: false,
      },
      {
        key: "exclude_ambiguous",
        type: "boolean",
        label: "Exclude Ambiguous Characters",
        required: false,
      },
      {
        key: "custom_charset",
        type: "text",
        label: "Custom Character Set",
        placeholder: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        required: false,
      },
      {
        key: "prefix",
        type: "text",
        label: "Prefix",
        placeholder: "sk_",
        required: false,
      },
      {
        key: "suffix",
        type: "text",
        label: "Suffix",
        placeholder: "_key",
        required: false,
      },
      {
        key: "format",
        type: "select",
        label: "Format",
        required: false,
        options: [
          { label: "Plain Text", value: "plain" },
          { label: "Base64", value: "base64" },
          { label: "Hex", value: "hex" },
          { label: "UUID", value: "uuid" },
        ],
      },
      {
        key: "count",
        type: "number",
        label: "Number of Passwords",
        placeholder: "1",
        required: false,
      },
    ],
    required: ["type"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const timestamp = new Date().toISOString();

      const type = config.type as string;
      const length = (config.length as number) || getDefaultLength(type);
      const includeUppercase = (config.include_uppercase as boolean) !== false;
      const includeLowercase = (config.include_lowercase as boolean) !== false;
      const includeNumbers = (config.include_numbers as boolean) !== false;
      const includeSymbols = (config.include_symbols as boolean) !== false;
      const excludeSimilar = (config.exclude_similar as boolean) || false;
      const excludeAmbiguous = (config.exclude_ambiguous as boolean) || false;
      const customCharset = (config.custom_charset as string) || "";
      const prefix = (config.prefix as string) || "";
      const suffix = (config.suffix as string) || "";
      const format = (config.format as string) || "plain";
      const count = (config.count as number) || 1;

      const generatedPasswords = [];
      const charset = generateCharset({
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        excludeAmbiguous,
        customCharset,
        type,
      });

      for (let i = 0; i < count; i++) {
        let generated = generateRandomString(charset, length);

        // Apply format
        switch (format) {
          case "base64":
            generated = btoa(generated);
            break;
          case "hex":
            generated = Array.from(generated)
              .map((char) => char.charCodeAt(0).toString(16))
              .join("");
            break;
          case "uuid":
            generated = generateUUID();
            break;
        }

        // Apply prefix and suffix
        generated = prefix + generated + suffix;
        generatedPasswords.push(generated);
      }

      const passwordId = `pwd_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          passwordId,
          type,
          length,
          format,
          count,
          passwords: generatedPasswords,
          singlePassword: generatedPasswords[0],
          charset: charset.length,
          strength: calculateStrength(charset, length),
          entropy: calculateEntropy(charset, length),
          options: {
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols,
            excludeSimilar,
            excludeAmbiguous,
            customCharset: !!customCharset,
            prefix: !!prefix,
            suffix: !!suffix,
          },
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "password_generator" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.type) {
        errors.type = "Type is required";
      }

      if (
        config.length &&
        (typeof config.length !== "number" || config.length <= 0)
      ) {
        errors.length = "Length must be a positive number";
      }

      if (
        config.count &&
        (typeof config.count !== "number" ||
          config.count <= 0 ||
          config.count > 100)
      ) {
        errors.count = "Count must be between 1 and 100";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
