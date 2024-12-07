import * as dotenv from "dotenv";
import * as path from "path";
import { OpenAI } from "openai";

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Initialize the OpenAI client with API key and organization ID
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // API key loaded from environment variables
  organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your organization ID
});

// Function to send a "Hello World" message to OpenAI and retrieve the response
async function helloWorld() {
  const maxRetries = 3; // Maximum number of retry attempts for rate limit errors
  let retries = 0; // Counter to track the number of retries
  let backoff = 2000; // Initial backoff time (in milliseconds, 2 seconds)

  // Log the API key and organization ID (for debugging purposes)
  console.log("Using API Key ****:");
  console.log("Using Organization ID: for Saujan_Personal");

  // Retry loop for handling rate limit errors
  while (retries < maxRetries) {
    try {
      // Make a request to the OpenAI API for a simple chat completion
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Specify the model to use
        messages: [
          { role: "user", content: "Hello World!" }, // User's message to the AI
        ],
        max_tokens: 15, // Limit the number of tokens in the response to minimize usage
      });

      // Extract and log the AI's response
      console.log("AI Response:", response.choices?.[0]?.message?.content?.trim() || "No response received.");
      return; // Exit the function after a successful API call
    } catch (error: any) {
      // Handle API errors and log the error details for debugging
      if (error.response) {
        console.error("API Response Error:", error.response.data); // Log the error response from OpenAI
      } else {
        console.error("Error:", error.message || error); // Log any other error messages
      }

      // Handle rate limit or quota errors with retries
      if (error.code === "rate_limit_exceeded" || error.code === "insufficient_quota") {
        retries++; // Increment the retry counter
        console.warn(`Rate limit exceeded. Retrying (${retries}/${maxRetries}) after ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff)); // Wait for the specified backoff time
        backoff *= 2; // Exponentially increase the backoff time
      } else {
        // For non-retryable errors, log and exit
        console.error("Unexpected error occurred. Exiting.");
        break; // Exit the retry loop
      }
    }
  }

  // Log a message if all retries are exhausted
  console.error("Failed to complete request after retries.");
}

// Execute the function
helloWorld();

/*
### Summary of Code Behavior:

1. **Environment Variables**:
   - Loads the API key and organization ID from a `.env` file to securely authenticate with the OpenAI API.

2. **Request Logic**:
   - Sends a "Hello World!" message to OpenAI using the `gpt-3.5-turbo` model.
   - Logs the AI's response or indicates if no response is received.

3. **Error Handling**:
   - Detects errors from OpenAI, particularly `rate_limit_exceeded` and `insufficient_quota`.
   - Implements a retry mechanism with exponential backoff for these errors.
   - Logs and exits for non-retryable errors.

4. **Data Flow**:
   - **Input**: The message `Hello World!` sent to OpenAI.
   - **Output**: The AI's response logged to the console (or error messages if applicable).

5. **Retries**:
   - Retries up to 3 times with a doubling backoff time (e.g., 2 seconds, 4 seconds, 8 seconds).

6. **Use Case**:
   - A simple demonstration to verify API connectivity and test response handling with robust error handling mechanisms.

*/
