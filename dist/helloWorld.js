"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const openai_1 = require("openai");
// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, ".env") });
// Initialize the OpenAI client with API key and organization ID
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "", // Load API key from environment variables
    organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your Organization ID
});
async function helloWorld() {
    const maxRetries = 3; // Max number of retries
    let retries = 0;
    let backoff = 2000; // Initial backoff time (2 seconds)
    // Log the API key and organization ID being used for debugging
    console.log("Using API Key ****:");
    console.log("Using Organization ID: for Saujan_Personal");
    while (retries < maxRetries) {
        try {
            // Make the API request
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Use an available model
                messages: [
                    { role: "user", content: "Hello World!" }, // User input for the AI
                ],
                max_tokens: 15, // Use minimal tokens to reduce usage
            });
            // Print the AI's response
            console.log("AI Response:", response.choices?.[0]?.message?.content?.trim() || "No response received.");
            return; // Exit the function after a successful request
        }
        catch (error) {
            // Log error details for debugging
            if (error.response) {
                console.error("API Response Error:", error.response.data);
            }
            else {
                console.error("Error:", error.message || error);
            }
            // Handle rate limit errors with retries
            if (error.code === "rate_limit_exceeded" || error.code === "insufficient_quota") {
                retries++;
                console.warn(`Rate limit exceeded. Retrying (${retries}/${maxRetries}) after ${backoff / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, backoff)); // Wait before retrying
                backoff *= 2; // Exponentially increase the backoff time
            }
            else {
                console.error("Unexpected error occurred. Exiting.");
                break; // Exit the loop for non-retryable errors
            }
        }
    }
    // Log message if retries are exhausted
    console.error("Failed to complete request after retries.");
}
// Run the function
helloWorld();
