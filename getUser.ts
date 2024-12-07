import * as dotenv from "dotenv";
import * as path from "path";
import { OpenAI } from "openai";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Initialize OpenAI client with API key and organization ID
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your organization ID
});

// Mock database of users
// This is an array of user objects. Each object contains an ID, name, and email.
const users = [
  { id: "567UVWX", name: "Alice", email: "alice@example.com" },
  { id: "AB789CD", name: "Bob", email: "bob@example.com" },
  { id: "9", name: "Charlie", email: "charlie@example.com" },
];

// Function to fetch a user by ID
// INPUT: Takes an alphanumeric `id` as a string.
// OUTPUT: Returns a matching user object from the `users` array, or an error object if no match is found.
function getUser(id: string) {
  const user = users.find((u) => u.id === id); // Search the user with the given ID
  return user || { error: "User not found" }; // Return user object or an error message
}

// Function to process a user query using OpenAI and fetch user details
// INPUT: Takes a `query` string from the user, such as "Find user with 567UVWX".
// OUTPUT: Logs the extracted user ID and the corresponding user details or supported actions if no valid ID is found.
async function processQueryWithOpenAI(query: string) {
  const validActions = [
    "Get user with {id}",
    "Fetch user with {id}",
  ];

  try {
    let idSource = "OpenAI"; // Default source for extracting ID is OpenAI
    let id: string | null = null; // Initialize ID as null

    // Send the query to OpenAI for processing
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Extract the alphanumeric user ID from the query. The user ID will always be a sequence of letters and/or numbers. Ignore extra context or unrelated words. Respond with only the extracted user ID or 'No user ID is present in the query.'",
        },
        { role: "user", content: `Query: "${query}"` },
      ],
      max_tokens: 50,
    });

    let aiResponse = response.choices[0]?.message?.content?.trim() || "";

    console.log(`\nQuery: "${query}"`);
    console.log("OpenAI Response:", aiResponse);

    // If OpenAI explicitly states that no ID is present in the query
    if (aiResponse === "No user ID is present in the query.") {
      console.log("OpenAI failed. Fallback activated. Parsing query...");

      // Fallback: Extract an alphanumeric ID-like pattern directly from the query
      const fallbackMatch = query.match(/\b[A-Za-z]*\d+[A-Za-z]*\b/);
      if (fallbackMatch) {
        id = fallbackMatch[0]; // Extract the first matching ID
        idSource = "Fallback"; // Mark the source as fallback
        console.log(`Fallback parsed text: "${fallbackMatch[0]}"`);
      }
    } else {
      // Clean the OpenAI response by removing unnecessary prefixes
      aiResponse = aiResponse.replace(/\b(ID|User ID):?\s*/gi, "").trim();

      // Match a valid alphanumeric ID in OpenAI's response
      id = aiResponse.match(/^[A-Za-z0-9]+$/)?.[0] || null;
    }

    // If a valid ID was found
    if (id) {
      console.log(`Fetching user with ID: ${id} (Source: ${idSource})`);
      const user = getUser(id); // Fetch the user from the mock database
      console.log("User Object:", user); // Log the user details
    } else {
      // If no valid ID was found, log the supported actions
      console.log("No valid user ID found in query.");
      console.log("Oops, we support the following actions:");
      validActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
    }
  } catch (error: any) {
    console.error("Error processing query with OpenAI:", error.message || error);
  }
}

// Main function to run the demo
// Loops through an array of test queries and processes each query using the `processQueryWithOpenAI` function.
async function runDemo() {
  console.log("\n=== Running User Query Demo with OpenAI ===");

  // Test queries to simulate user input
  const queries = [
    "Find user with 567UVWX",
    "Retrieve details for user AB789CD",
    "Provide information for user ID 9",
    "Tell me about user with code 123LMNO",
    "Show user associated with 999PQRS",
    "Search for user profile",
    "List registered accounts",
    "567UVWX is the user I need information on",
    "What can you retrieve for user ID 10?",
    "The identifier is ZX654321",
    "Locate user record 432HJKL in the system",
    "Share details for Rachel with ID 9",
  ];
  // Process each query in the array
  for (const query of queries) {
    await processQueryWithOpenAI(query);
    console.log("\n-----");
  }
}

// Execute the demo
runDemo();

/*
Notes:
- The mock database (`users` array) should be updated to test for different user IDs.
- Example queries test a range of valid, invalid, and ambiguous inputs.
- The fallback logic ensures robustness even when OpenAI fails to extract a valid ID.
*/
// Since it's not connected to a db 
// gotta update the code with the db connections
// db edits/updates, etc.
// and wherever it may apply, 
  /* multiple of sets of data to test, update the mock db/array IDs with some of the IDs mentioned below
  to get some correct matches

  const queries = [
    "Find user with 567UVWX",
    "Retrieve details for user AB789CD",
    "Provide information for user ID 9",
    "Tell me about user with code 123LMNO",
    "Show user associated with 999PQRS",
    "Search for user profile",
    "List registered accounts",
    "567UVWX is the user I need information on",
    "What can you retrieve for user ID 10?",
    "The identifier is ZX654321",
    "Locate user record 432HJKL in the system",
    "Share details for Rachel with ID 9",
  ];

   const queries = [
    "Locate user with 456GHTY",
    "Pull user info for AB123XZ",
    "Show details for user ID 5",
    "Provide user information for 9MNOPQ",
    "Who is associated with 789RSTU?",
    "Display the user profile",
    "Show all registered users",
    "456GHTY is the person I’m looking for",
    "What can you tell me about user 12?",
    "The user ID is ZY9876KL",
    "Could you find user 321WXYZ from the system?",
    "Give me details for Mike with ID 5",
  ];
  */

  /**
 * === Summary of Code Behavior ===
 *
 * 1. Environment Variables:
 *    - Loads the API key and organization ID from a `.env` file to securely authenticate with the OpenAI API.
 *
 * 2. Request Logic:
 *    - Processes user queries like "Get user with {ID}" or "Fetch user with {ID}".
 *    - Sends the query to OpenAI's `gpt-3.5-turbo` model to extract the user ID from the natural language query.
 *
 * 3. Mock Database:
 *    - Maintains a mock database (`users` array) of user objects with fields `id`, `name`, and `email`.
 *    - Uses the extracted ID to fetch user details from this database.
 *
 * 4. Fallback Logic:
 *    - If OpenAI cannot extract the user ID (e.g., unclear or unsupported query), a fallback mechanism
 *      attempts to directly extract an alphanumeric pattern resembling an ID from the query text.
 *
 * 5. Error Handling:
 *    - Handles errors from OpenAI (e.g., invalid responses, network errors) and logs relevant error messages.
 *
 * 6. Supported Actions:
 *    - If no valid user ID is found in the query, logs a message showing the supported query formats:
 *      - "Get user with {ID}"
 *      - "Fetch user with {ID}"
 *
 * 7. Data Flow:
 *    - Input: Natural language query from the user.
 *    - Output: Logs either:
 *        - The fetched user object (if the ID matches the database).
 *        - An error message or supported actions (if no valid ID is found).
 *
 * 8. Retries:
 *    - No retries are implemented as this script is not rate-limited like `helloWorld.ts`.
 *
 * 9. Use Case:
 *    - A robust query processor that can handle natural language queries for user lookup,
 *      integrating OpenAI's capabilities with fallback mechanisms for handling unsupported or vague queries.
 */
/*
/**
 * === Data Flow for processQueryWithOpenAI(query: string) ===
 *
 * Input:
 *   ┌───────────────────────────────────────────────────┐
 *   │ User Query (e.g., "Get user with 567UVWX")        │
 *   └───────────────────────────────────────────────────┘
 *                             │
 *                             ▼
 * Step 1: Send Query to OpenAI
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ - Pass query to OpenAI API                                  │
 *   │ - System instruction to extract user ID from query          │
 *   │ - OpenAI Response (e.g., "567UVWX" or "No user ID present") │
 *   └─────────────────────────────────────────────────────────────┘
 *                             │
 *             ┌───────────────┴────────────────┐
 *             ▼                                ▼
 *   OpenAI Extracted ID                 No ID in OpenAI Response
 *             │                                │
 *             ▼                                ▼
 * Step 2A: Clean & Validate ID       Step 2B: Fallback Parsing
 *   ┌─────────────────────────────┐   ┌──────────────────────────────────────┐
 *   │ - Remove prefixes like "ID" │   │ - Use regex to extract first alphan- │
 *   │   or "User ID"              │   │   umeric pattern resembling a user  │
 *   │ - Validate as alphanumeric  │   │   ID (e.g., "567UVWX").             │
 *   └─────────────────────────────┘   └──────────────────────────────────────┘
 *             │                                │
 *             ▼                                ▼
 *          Valid ID                       Valid Fallback ID
 *             │                                │
 *             ▼                                ▼
 *   ┌───────────────────────────┐    ┌──────────────────────────────┐
 *   │ Fetch User from Database  │    │ Fetch User from Database     │
 *   │ - Call `getUser(id)`      │    │ - Call `getUser(id)`         │
 *   │ - Return user or error    │    │ - Return user or error       │
 *   └───────────────────────────┘    └──────────────────────────────┘
 *             │                                │
 *             ▼                                ▼
 *          Log Result                      Log Result
 *   ┌───────────────────────────┐    ┌──────────────────────────────┐
 *   │ User Object or Error      │    │ User Object or Error         │
 *   │ - Example: { id: "567UVWX"│    │ - Example: { id: "567UVWX",  │
 *   │   name: "Alice", email:...│    │   name: "Alice", email:...   │
 *   │ }                         │    │ }                            │
 *   └───────────────────────────┘    └──────────────────────────────┘
 *                             │
 *                             ▼
 * Step 3: No ID Found in Query
 *   ┌───────────────────────────────────────────┐
 *   │ - If no valid ID found via OpenAI or      │
 *   │   fallback, log "No valid user ID found." │
 *   │ - Suggest supported actions:             │
 *   │   - "Get user with {id}"                 │
 *   │   - "Fetch user with {id}"               │
 *   └───────────────────────────────────────────┘
 *
 * Output:
 *   ┌───────────────────────────────────────────────────┐
 *   │ Logs user object, error, or supported actions     │
 *   └───────────────────────────────────────────────────┘
 */

