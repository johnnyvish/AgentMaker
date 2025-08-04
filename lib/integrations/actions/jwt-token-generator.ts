import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const jwtTokenGenerator: Integration = createIntegration({
  id: "jwt_token_generator",
  name: "JWT Token Generator",
  category: "action",
  description: "Create/validate JWT tokens for API authentication",
  icon: "shield",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "operation",
        type: "select",
        label: "Operation",
        required: true,
        options: [
          { label: "Generate Token", value: "generate" },
          { label: "Validate Token", value: "validate" },
          { label: "Decode Token", value: "decode" },
        ],
      },
      {
        key: "secret_key",
        type: "text",
        label: "Secret Key",
        placeholder: "your-secret-key-here",
        required: true,
      },
      {
        key: "payload",
        type: "textarea",
        label: "Token Payload (JSON)",
        placeholder:
          '{"user_id": "123", "email": "user@example.com", "role": "admin"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "token_to_validate",
        type: "textarea",
        label: "Token to Validate",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "algorithm",
        type: "select",
        label: "Algorithm",
        required: false,
        options: [
          { label: "HS256", value: "HS256" },
          { label: "HS384", value: "HS384" },
          { label: "HS512", value: "HS512" },
          { label: "RS256", value: "RS256" },
          { label: "RS384", value: "RS384" },
          { label: "RS512", value: "RS512" },
        ],
      },
      {
        key: "expiration_time",
        type: "number",
        label: "Expiration Time (seconds)",
        placeholder: "3600",
        required: false,
      },
      {
        key: "issuer",
        type: "text",
        label: "Issuer (iss)",
        placeholder: "your-app.com",
        required: false,
      },
      {
        key: "audience",
        type: "text",
        label: "Audience (aud)",
        placeholder: "api.your-app.com",
        required: false,
      },
      {
        key: "subject",
        type: "text",
        label: "Subject (sub)",
        placeholder: "user123",
        required: false,
        supportExpressions: true,
      },
      {
        key: "issued_at",
        type: "boolean",
        label: "Include Issued At (iat)",
        required: false,
      },
      {
        key: "not_before",
        type: "number",
        label: "Not Before (nbf) - seconds from now",
        placeholder: "0",
        required: false,
      },
    ],
    required: ["operation", "secret_key"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const timestamp = new Date().toISOString();

      const operation = config.operation as string;
      const secretKey = config.secret_key as string;
      const algorithm = (config.algorithm as string) || "HS256";
      const expirationTime = (config.expiration_time as number) || 3600;
      const issuer = (config.issuer as string) || "";
      const audience = (config.audience as string) || "";
      const subject = (config.subject as string) || "";
      const includeIssuedAt = (config.issued_at as boolean) !== false;
      const notBefore = (config.not_before as number) || 0;

      let payload = {};
      if (config.payload) {
        try {
          payload = JSON.parse(config.payload as string);
        } catch {
          payload = {};
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const tokenId = `jwt_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      switch (operation) {
        case "generate": {
          const header = {
            alg: algorithm,
            typ: "JWT",
          };

          const claims = {
            ...payload,
            ...(includeIssuedAt && { iat: now }),
            ...(expirationTime && { exp: now + expirationTime }),
            ...(notBefore > 0 && { nbf: now + notBefore }),
            ...(issuer && { iss: issuer }),
            ...(audience && { aud: audience }),
            ...(subject && { sub: subject }),
          };

          // Mock JWT token generation
          const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
            JSON.stringify(claims)
          ).replace(/=/g, "")}.${btoa(secretKey).replace(/=/g, "")}`;

          return {
            success: true,
            data: {
              tokenId,
              operation,
              token: mockToken,
              header,
              payload: claims,
              algorithm,
              expirationTime,
              expiresAt: expirationTime
                ? new Date((now + expirationTime) * 1000).toISOString()
                : null,
              issuer,
              audience,
              subject,
              issuedAt: includeIssuedAt
                ? new Date(now * 1000).toISOString()
                : null,
              notBefore:
                notBefore > 0
                  ? new Date((now + notBefore) * 1000).toISOString()
                  : null,
              timestamp,
            },
            metadata: { nodeType: "action", subtype: "jwt_token_generator" },
          };
        }

        case "validate": {
          const tokenToValidate = config.token_to_validate as string;

          if (!tokenToValidate) {
            return {
              success: false,
              error: "Token to validate is required",
              data: {
                timestamp,
              },
              metadata: { nodeType: "action", subtype: "jwt_token_generator" },
            };
          }

          // Mock token validation
          const isValid = tokenToValidate.length > 50; // Simple mock validation
          const decodedPayload = isValid ? payload : null;
          const currentTime = Math.floor(Date.now() / 1000);

          return {
            success: true,
            data: {
              tokenId,
              operation,
              token: tokenToValidate,
              isValid,
              payload: decodedPayload,
              validationDetails: {
                signatureValid: isValid,
                notExpired: isValid,
                notBeforeValid: isValid,
                issuerValid: isValid,
                audienceValid: isValid,
              },
              currentTime: new Date(currentTime * 1000).toISOString(),
              timestamp,
            },
            metadata: { nodeType: "action", subtype: "jwt_token_generator" },
          };
        }

        case "decode": {
          const tokenToDecode = config.token_to_validate as string;

          if (!tokenToDecode) {
            return {
              success: false,
              error: "Token to decode is required",
              data: {
                timestamp,
              },
              metadata: { nodeType: "action", subtype: "jwt_token_generator" },
            };
          }

          // Mock token decoding
          const decodedHeader = {
            alg: algorithm,
            typ: "JWT",
          };

          const decodedPayload = {
            ...payload,
            iat: now - 3600,
            exp: now + 3600,
            iss: issuer || "your-app.com",
            aud: audience || "api.your-app.com",
            sub: subject || "user123",
          };

          return {
            success: true,
            data: {
              tokenId,
              operation,
              token: tokenToDecode,
              header: decodedHeader,
              payload: decodedPayload,
              isExpired: false,
              expiresAt: new Date((now + 3600) * 1000).toISOString(),
              issuedAt: new Date((now - 3600) * 1000).toISOString(),
              timestamp,
            },
            metadata: { nodeType: "action", subtype: "jwt_token_generator" },
          };
        }

        default:
          return {
            success: false,
            error: "Invalid operation",
            data: {
              timestamp,
            },
            metadata: { nodeType: "action", subtype: "jwt_token_generator" },
          };
      }
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.operation) {
        errors.operation = "Operation is required";
      }

      if (!config.secret_key) {
        errors.secret_key = "Secret key is required";
      }

      if (config.operation === "generate" && !config.payload) {
        errors.payload = "Payload is required for token generation";
      }

      if (config.operation === "validate" && !config.token_to_validate) {
        errors.token_to_validate = "Token to validate is required";
      }

      if (config.operation === "decode" && !config.token_to_validate) {
        errors.token_to_validate = "Token to decode is required";
      }

      if (config.payload) {
        try {
          JSON.parse(config.payload as string);
        } catch {
          errors.payload = "Payload must be a valid JSON object";
        }
      }

      if (
        config.expiration_time &&
        (typeof config.expiration_time !== "number" ||
          config.expiration_time <= 0)
      ) {
        errors.expiration_time = "Expiration time must be a positive number";
      }

      if (
        config.not_before &&
        (typeof config.not_before !== "number" || config.not_before < 0)
      ) {
        errors.not_before = "Not before time must be a non-negative number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
