import * as dotenv from "dotenv";
import * as path from "path";
import { OpenAI } from "openai";

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Initialize the OpenAI client with API key and organization ID
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your organization ID
});

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
const supportedActions = ["get", "fetch", "retrieve", "search", "show", "delete", "remove"];

// Function to extract identifiers from query
function extractIDOrEmailFromQuery(query: string): { id?: string; email?: string } {
  const idMatch = query.match(idRegex);
  const emailMatch = query.match(emailRegex);
  return {
    id: idMatch ? idMatch[0] : undefined,
    email: emailMatch ? emailMatch[0] : undefined,
  };
}

// Function to sanitize identifiers
function sanitizeIdentifier(identifier: string): string {
  const sanitized = identifier.replace(/\bID\b/gi, "").replace(/[^\w@.]/g, "").trim();
  return sanitized;
}

// Function to fetch a user by identifier
function getUserByIdentifier(identifier: { id?: string; email?: string }) {
  if (identifier.id) {
    return users.find((u) => u.id === identifier.id) || { error: "User not found" };
  }
  if (identifier.email) {
    return users.find((u) => u.email === identifier.email) || { error: "User not found" };
  }
  return { error: "No identifier provided" };
}

// Function to delete a user by identifier
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

// Check for unsupported or multiple actions in a query
function detectIssuesInQuery(query: string): { multipleActions: boolean; unsupportedAction: boolean } {
  const detectedActions = allActionKeywords.filter((action) => query.toLowerCase().includes(action));
  const multipleActions = detectedActions.length > 1;
  const unsupportedAction = detectedActions.some((action) => unsupportedActions.includes(action));
  return { multipleActions, unsupportedAction };
}

// Function to process the user query using OpenAI and trigger appropriate actions
async function processQueryWithOpenAI(query: string) {
  try {
    console.log(`\nQuery: "${query}"`);

    // Detect unsupported or multiple actions early
    const { multipleActions, unsupportedAction } = detectIssuesInQuery(query);

    if (multipleActions) {
      console.log("Multiple actions detected. Ignoring query.");
      console.log("Supported actions are:");
      console.log("1. Get user info with id OR email");
      console.log("2. Delete user by id OR email");
      return;
    }

    if (unsupportedAction) {
      console.log("Unsupported action detected in query.");
      console.log("Supported actions are:");
      console.log("1. Get user info with id OR email");
      console.log("2. Delete user by id OR email");
      return;
    }

    // OpenAI API call
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
    console.log("OpenAI Response:", aiResponse);

    // Handle OpenAI response
    if (aiResponse === "No valid action or identifier found.") {
      console.log("OpenAI failed. No valid action or identifier found.");
      console.log("Supported actions are:");
      console.log("1. Get user info with id OR email");
      console.log("2. Delete user by id OR email");
      return;
    }

    // Parse action and identifier
    const [actionKeyword, ...identifierParts] = aiResponse.split(" ");
    const action = actionKeyword.toLowerCase();
    const identifierString = sanitizeIdentifier(identifierParts.join(" ").trim());
    const identifier = extractIDOrEmailFromQuery(identifierString);

    // Fallback for invalid identifiers
    if (!identifier.id && !identifier.email) {
      console.log("OpenAI failed. Fallback activated. Parsing query...");
      const fallbackIdentifier = extractIDOrEmailFromQuery(query);
      if (!fallbackIdentifier.id && !fallbackIdentifier.email) {
        console.log("No valid action found.");
        console.log("Supported actions are:");
        console.log("1. Get user info with id OR email");
        console.log("2. Delete user by id OR email");
        return;
      }
    }

    // Execute the action
    if (action === "get" || action === "fetch") {
      console.log(`Fetching user with identifier: ${JSON.stringify(identifier)} (Source: OpenAI)`);
      const user = getUserByIdentifier(identifier);
      console.log("User Object:", user);
    } else if (action === "delete" || action === "remove") {
      console.log(`Deleting user with identifier: ${JSON.stringify(identifier)} (Source: OpenAI)`);
      const result = deleteUser(identifier);
      console.log(result.error ? result : `User deleted: ${JSON.stringify(result.user)}`);
    } else {
      console.log("No valid action found.");
      console.log("Supported actions are:");
      console.log("1. Get user info with id OR email");
      console.log("2. Delete user by id OR email");
    }
  } catch (error: any) {
    console.error("Error processing query with OpenAI:", error.message || error);
  }
}

// Run demo queries
async function runDemo() {
  console.log("\n=== Running User Query Demo with OpenAI ===");

  const queries = [
    "Retrieve details for user with ID 567UVWX",
    "Can you fetch user using email alice@example.com?",
    "Please delete the user associated with ID AB789CD",
    "I need information on the user identified as 567UVWX",
    "Add a new user with email newuser@example.com",
    "Update the user record for ID 123XYZ",
    "Look up user details for ID 567UVWX",
    "Get information on all users",
    "Delete the account associated with user ID AB789CD",
    "Remove the user with ID 567UVWX from the system",
    "abcdefg123",
    "Fetch the details for the email email@example.com",
    "Can you tell me who is linked with ID 123@AB!#",
    "Find information for user ID 9",
    "Search for user profile associated with charlie@example.com",
    "Remove Charlie’s user account with ID 567UVWX",
    "Delete user ID 567UVWX, and add a new account",
    "Get and delete user details for AB789CD",
  ];

  for (const query of queries) {
    await processQueryWithOpenAI(query);
    console.log("\n-----");
  }
}

// Execute the demo
runDemo();


/* TEST DATA FOR MOCK DB 


ALL TEST PASSED FOR BELOW:

  const queries = [
    "GET user WITH 567UVWX",
    "fetch user by EMAIL alice@example.com",
    "Delete user ID AB789CD",
    "Update user with ID 567UVWX",
    "Create user with email newuser@example.com",
    "Modify user details for 123XYZ",
    "User ID is 567UVWX",
    "Fetch details",
    "Delete account",
    "Show user information",
    "abcdefg",
    "email@example..com",
    "ID 123@AB!#",
    "Get user with ID 9",
    "Fetch user by email charlie@example.com",
    "Remove user 567UVWX",
    "Delete user ID 567UVWX and create a new user",
    "Get and delete user AB789CD",
  ];

*/