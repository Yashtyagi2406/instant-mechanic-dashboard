/**
 * Swagger/OpenAPI config.
 * Docs are exposed at GET /api/docs via swagger-ui-express.
 */
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Instant Mechanic — Operations API",
      version: "1.0.0",
      description:
        "REST API powering the Instant Mechanic Live Operations Dashboard. " +
        "All protected routes require a Bearer JWT obtained from POST /api/auth/login.",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local dev" },
      { url: "https://api.instantmechanic.dev", description: "Production (EC2)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan all route files for JSDoc @swagger annotations
  apis: ["./src/routes/*.ts", "./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
