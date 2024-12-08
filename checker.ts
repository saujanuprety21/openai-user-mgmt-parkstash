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

// Helper functions remain unchanged
function extractIDOrEmailFromQuery(query: string): { id?: string; email?: string } { /* ... */ }
function normalizeAction(action: string): string { /* ... */ }
function getUserByIdentifier(identifier: { id?: string; email?: string }) { /* ... */ }
function deleteUser(identifier: { id?: string; email?: string }) { /* ... */ }
function detectIssuesInQuery(query: string): { multipleActions: boolean; unsupportedAction: boolean } { /* ... */ }
function displaySupportedActions() { /* ... */ }

// Process the query with OpenAI and return the result
async function processQueryWithOpenAI(query: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`\nQuery: "${query}"`);

    // Detect issues in the query
    const { multipleActions, unsupportedAction } = detectIssuesInQuery(query);

    if (multipleActions) {
      return { success: false, error: "Multiple actions detected. Ignoring query." };
    }

    if (unsupportedAction) {
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

    if (aiResponse === "No valid action or identifier found.") {
      return { success: false, error: "No valid action or identifier found in the query." };
    }

    // Parse action and identifier from OpenAI response
    const [actionKeyword, ...identifierParts] = aiResponse.replace(/ID /gi, "").split(" ");
    const action = normalizeAction(actionKeyword);
    const identifierString = identifierParts.join(" ").trim();
    const identifier = extractIDOrEmailFromQuery(identifierString);

    if (!identifier.id && !identifier.email) {
      return { success: false, error: "No valid identifier found after parsing." };
    }

    // Execute the identified action
    if (action === "get" || action === "fetch") {
      const user = getUserByIdentifier(identifier);
      if (user.error) return { success: false, error: user.error };
      return { success: true, data: user };
    } else if (action === "delete" || action === "remove") {
      const result = deleteUser(identifier);
      if (result.error) return { success: false, error: result.error };
      return { success: true, data: { message: "User deleted", user: result.user } };
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
