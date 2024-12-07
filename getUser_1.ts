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

// Mock database of users
let users = [
  { id: "567UVWX", name: "Alice", email: "alice@example.com" },
  { id: "AB789CD", name: "Bob", email: "bob@example.com" },
  { id: "9", name: "Charlie", email: "charlie@example.com" },
];

// Reusable helper functions for parsing
function extractIDOrEmailFromQuery(query: string): { id?: string; email?: string } {
  const idMatch = query.match(/\b[A-Za-z0-9]+\b/); // Regex for alphanumeric IDs
  const emailMatch = query.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/); // Regex for emails

  return {
    id: idMatch ? idMatch[0] : undefined,
    email: emailMatch ? emailMatch[0] : undefined,
  };
}

// Reusable function to fetch a user
function getUserByIdentifier(identifier: { id?: string; email?: string }) {
  if (identifier.id) {
    return users.find((u) => u.id === identifier.id) || { error: "User not found" };
  }
  if (identifier.email) {
    return users.find((u) => u.email === identifier.email) || { error: "User not found" };
  }
  return { error: "No identifier provided" };
}

// Function to delete a user
function deleteUser(identifier: { id?: string; email?: string }) {
  const userIndex = users.findIndex(
    (u) => u.id === identifier.id || u.email === identifier.email
  );
  if (userIndex >= 0) {
    const deletedUser = users.splice(userIndex, 1)[0];
    return { success: true, user: deletedUser };
  }
  return { error: "User not found" };
}

// Process user query with OpenAI and trigger actions
async function processQueryWithOpenAI(query: string) {
  const validActions = [
    "Get user with {id}",
    "Fetch user by email",
    "Delete user",
  ];

  try {
    let action = null; // Will hold the action type (e.g., "Get", "Delete")
    let idSource = "OpenAI"; // Default source is OpenAI
    let identifier: { id?: string; email?: string } = {};

    // Use OpenAI to process the query
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Extract the action (Get, Fetch, Delete) and the associated identifier (ID or email) from the query.
                    Respond with either the extracted action and identifier (e.g., "Get 567UVWX" or "Delete alice@example.com") or "No valid action or identifier found."`,
        },
        { role: "user", content: `Query: "${query}"` },
      ],
      max_tokens: 50,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim() || "";

    console.log(`\nQuery: "${query}"`);
    console.log("OpenAI Response:", aiResponse);

    // Check if OpenAI explicitly states no valid action or identifier is present
    if (aiResponse === "No valid action or identifier found.") {
      console.log("OpenAI failed. Fallback activated. Parsing query...");
      identifier = extractIDOrEmailFromQuery(query);
      idSource = "Fallback";
    } else {
      // Parse action and identifier from OpenAI's response
      const [parsedAction, ...parsedIdentifierParts] = aiResponse.split(" ");
      action = parsedAction?.toLowerCase();
      const parsedIdentifier = parsedIdentifierParts.join(" ").trim();

      if (parsedIdentifier.includes("@")) {
        identifier.email = parsedIdentifier;
      } else {
        identifier.id = parsedIdentifier;
      }
    }

    // Fallback parsing for unsupported cases
    if (!action) {
      if (query.toLowerCase().includes("delete")) action = "delete";
      else if (query.toLowerCase().includes("get") || query.toLowerCase().includes("fetch")) action = "get";
    }

    if (!identifier.id && !identifier.email) {
      identifier = extractIDOrEmailFromQuery(query); // Fallback extraction for identifier
    }

    if (action === "get" || action === "fetch") {
      console.log(`Fetching user with identifier: ${JSON.stringify(identifier)} (Source: ${idSource})`);
      const user = getUserByIdentifier(identifier);
      console.log("User Object:", user);
    } else if (action === "delete") {
      console.log(`Deleting user with identifier: ${JSON.stringify(identifier)} (Source: ${idSource})`);
      const result = deleteUser(identifier);
      console.log(result.error ? result : `User deleted: ${JSON.stringify(result.user)}`);
    } else {
      console.log("No valid action found.");
      console.log("Oops, we support the following actions:");
      validActions.forEach((validAction, index) => {
        console.log(`${index + 1}. ${validAction}`);
      });
    }
  } catch (error: any) {
    console.error("Error processing query with OpenAI:", error.message || error);
  }
}

// Run demo queries
async function runDemo() {
  console.log("\n=== Running User Query Demo with OpenAI ===");

  const queries = [
    "Find user with 567UVWX",
    "Retrieve details for user alice@example.com",
    "Delete user ID AB789CD",
    "Remove user with email bob@example.com",
    "Show user associated with 9",
    "Delete account for Charlie",
    "Search for user profile",
    "List registered accounts",
  ];

  for (const query of queries) {
    await processQueryWithOpenAI(query);
    console.log("\n-----");
  }
}

// Execute the demo
runDemo();
