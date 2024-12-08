


import express from 'express';
import path from 'path';
import * as dotenv from "dotenv";
import { OpenAI } from "openai";

const app = express();
app.use(express.json());

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Initialize the OpenAI client with API key and organization ID
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your organization ID
});

// Serve frontend files from the "frontend" directory
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// Mock database of users
let users = [
  { id: "567UVWX", name: "Alice", email: "alice@example.com" },
  { id: "AB789CD", name: "Bob", email: "bob@example.com" },
  { id: "9", name: "Charlie", email: "charlie@example.com" },
];

// Validation patterns for identifiers
const idRegex = /^[A-Za-z0-9]+$/; // Matches only alphanumeric IDs
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/; // Matches valid email addresses

// Supported and unsupported actions
const allActionKeywords = [
  "get",
  "fetch",
  "add",
  "show",
  "delete",
  "search",
  "retrieve",
  "remove",
  "create",
  "update",
  "modify",
  "edit",
  "change",
];
const unsupportedActions = ["create", "update", "modify", "add", "edit", "change"];

/**
 * Displays the list of supported actions for user queries.
 * This function is called when the query contains unsupported actions or is invalid.
 * INPUT: None.
 * OUTPUT: Logs a list of supported actions.
 */
function displaySupportedActions() {
  console.log("Supported actions are:");
  console.log("1. Get user info with a valid id OR email");
  console.log("2. Delete user by valid id OR email");
}

/**
 * Extracts an ID or email from the given query string using regex patterns.
 * INPUT: `query` (string) - The user query.
 * OUTPUT: An object containing `id` or `email` (or both if found).
 */
function extractIDOrEmailFromQuery(query: string): { id?: string; email?: string } {
  const idMatch = query.match(idRegex); // Match alphanumeric ID
  const emailMatch = query.match(emailRegex); // Match valid email address
  return {
    id: idMatch ? idMatch[0] : undefined,
    email: emailMatch ? emailMatch[0] : undefined,
  };
}

/**
 * Normalizes action keywords by mapping synonyms to a standard set of terms.
 * INPUT: `action` (string) - The action keyword extracted from the query.
 * OUTPUT: A normalized action keyword (e.g., "fetch" → "get").
 */
function normalizeAction(action: string): string {
  const synonyms: { [key: string]: string } = { search: "get", retrieve: "get", show: "get" };
  return synonyms[action.toLowerCase()] || action.toLowerCase();
}

/**
 * Fetches a user by their ID or email from the mock database.
 * INPUT: `identifier` (object) - Contains either `id` or `email`.
 * OUTPUT: The user object if found, otherwise an error object.
 */
function getUserByIdentifier(identifier: { id?: string; email?: string }) {
  if (identifier.id) {
    // Find the user by ID
    return users.find((u) => u.id === identifier.id) || { error: "User not found" };
  }
  if (identifier.email) {
    // Find the user by email
    return users.find((u) => u.email === identifier.email) || { error: "User not found" };
  }
  return { error: "No identifier provided" }; // Return error if neither ID nor email is provided
}

/**
 * Deletes a user by their ID or email from the mock database.
 * INPUT: `identifier` (object) - Contains either `id` or `email`.
 * OUTPUT: A success message with the deleted user or an error object.
 */
function deleteUser(identifier: { id?: string; email?: string }) {
  const userIndex = users.findIndex(
    (u) => u.id === identifier.id || u.email === identifier.email
  );
  if (userIndex >= 0) {
    // Remove the user from the database
    const deletedUser = users.splice(userIndex, 1)[0];
    return { success: true, user: deletedUser };
  }
  return { error: "User not found" }; // Return error if no matching user is found
}

/**
 * Detects issues in a query, such as multiple or unsupported actions.
 * INPUT: `query` (string) - The user query.
 * OUTPUT: An object indicating whether multiple or unsupported actions are present.
 */
function detectIssuesInQuery(query: string): { multipleActions: boolean; unsupportedAction: boolean } {
  const detectedActions = allActionKeywords.filter((action) => query.toLowerCase().includes(action));
  const multipleActions = detectedActions.length > 1; // Check for multiple actions
  const unsupportedAction = detectedActions.some((action) => unsupportedActions.includes(action));
  return { multipleActions, unsupportedAction };
}

/**
 * Processes the user query using OpenAI to extract actions and identifiers, then executes the appropriate action.
 * INPUT: `query` (string) - The user's query.
 * OUTPUT: Logs the result (e.g., fetched user, deleted user, or error messages).
 */
async function processQueryWithOpenAI(query: string) {
  try {
    console.log(`\nProcessing query: "${query}"`);

    // Detect issues in the query
    const { multipleActions, unsupportedAction } = detectIssuesInQuery(query);

    if (multipleActions) {
      console.log("Multiple actions detected. Ignoring query.");
      return { success: false, error: "Multiple actions detected. Ignoring query." };
    }

    if (unsupportedAction) {
      console.log("Unsupported action detected in query.");
      return { success: false, error: "Unsupported action detected in query." };
    }

    // Send query to OpenAI for interpretation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Extract the action (Get, Fetch, Search, Delete) and the associated identifier (ID or email) from the query. Respond with either the extracted action and identifier (e.g., "Search 567UVWX" or "Delete alice@example.com") or "No valid action or identifier found."`,
        },
        { role: "user", content: `Query: "${query}"` },
      ],
      max_tokens: 50,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim() || "";
    console.log("OpenAI Response:", aiResponse);

    // Handle case where OpenAI explicitly says no action or identifier is found
    if (aiResponse === "No valid action or identifier found.") {
      console.log("No valid action or identifier found.");
      return { success: false, error: "No valid action or identifier found in the query." };
    }

    // Parse action and identifier from OpenAI response
    const [actionKeyword, ...identifierParts] = aiResponse.replace(/ID /gi, "").split(" ");
    const action = normalizeAction(actionKeyword);
    const identifierString = identifierParts.join(" ").trim();
    const identifier = extractIDOrEmailFromQuery(identifierString);

    // Validate the identifier
    if (!identifier.id && !identifier.email) {
      return { success: false, error: "No valid identifier found after parsing." };
    }

    // Execute the identified action
    if (action === "get" || action === "fetch") {
      console.log(`Fetching user with identifier: ${JSON.stringify(identifier)}`);
      const user = getUserByIdentifier(identifier);

      return user
        ? { success: true, data: user }
        : { success: false, error: "User not found." };
    } else if (action === "delete" || action === "remove") {
      console.log(`Deleting user with identifier: ${JSON.stringify(identifier)}`);
      const result = deleteUser(identifier);

      return result.user
        ? { success: true, data: { message: "User deleted", user: result.user } }
        : { success: false, error: "User not found." };
    }

    return { success: false, error: "Unsupported action." };
  } catch (error: any) {
    console.error("Error processing query with OpenAI:", error.message || error);
    return { success: false, error: "Internal server error." };
  }
}


// API route to process the query
app.post('/api/chat', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: "Query is required." });
  }

  const result = await processQueryWithOpenAI(query);

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json(result);
  }
});

// Redirect all unmatched routes to the frontend
app.get('/*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://127.0.0.1:3000');
});

