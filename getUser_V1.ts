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
    console.log(`\nQuery: "${query}"`);

    // Detect issues in the query
    const { multipleActions, unsupportedAction } = detectIssuesInQuery(query);

    if (multipleActions) {
      console.log("Multiple actions detected. Ignoring query.");
      displaySupportedActions();
      return;
    }

    if (unsupportedAction) {
      console.log("Unsupported action detected in query.");
      displaySupportedActions();
      return;
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
         console.log("OpenAI couldn't determine a valid action or identifier from the query.");
          displaySupportedActions();
           return;
        }

// Parse action and identifier from OpenAI response
    const [actionKeyword, ...identifierParts] = aiResponse.replace(/ID /gi, "").split(" ");
    const action = normalizeAction(actionKeyword);
    const identifierString = identifierParts.join(" ").trim();
    const identifier = extractIDOrEmailFromQuery(identifierString);

// Validate the identifier
      if (!identifier.id && !identifier.email) {
             console.log("Invalid identifier format. Falling back to direct parsing...");
             const fallbackIdentifier = extractIDOrEmailFromQuery(query);
      if (!fallbackIdentifier.id && !fallbackIdentifier.email) {
              console.log("No valid identifier found after fallback parsing.");
              displaySupportedActions();
              return;
           }
        }


    // Execute the identified action
    if (action === "get" || action === "fetch") {
      console.log(`Fetching user with identifier: ${JSON.stringify(identifier)} (Source: OpenAI)`);
      const user = getUserByIdentifier(identifier);
      console.log("User Object:", user);
    } else if (action === "delete" || action === "remove") {
      console.log(`Deleting user with identifier: ${JSON.stringify(identifier)} (Source: OpenAI)`);
      const result = deleteUser(identifier);
      console.log(result.error ? result : `User deleted: ${JSON.stringify(result.user)}`);
    } else {
      displaySupportedActions();
    }
  } catch (error: any) {
    console.error("Error processing query with OpenAI:", error.message || error);
  }
}

/**
 * Runs multiple test queries to demonstrate the system's behavior and capabilities.
 * INPUT: None.
 * OUTPUT: Logs results for each query in the test set.
 */
async function runDemo() {
  console.log("\n=== Running User Query Demo with OpenAI ===");

  const queries = [
    "Retrieve details for user with ID 567PVWX",
    "Can you fetch user using email chalice@example.com?",
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
/**
 * DATA FLOW ROADMAP:
 * 
 * Step 1: User Input
 * - A query is provided by the user.
 * - Entry point: `processQueryWithOpenAI(query)`
 * - Functions used:
 *   - `processQueryWithOpenAI` (Main function for handling the query)
 * 
 * Step 2: Query Validation
 * - The query is analyzed for:
 *   - Multiple actions
 *   - Unsupported actions
 * - Function: `detectIssuesInQuery(query)`
 *   - Checks if the query contains more than one action or an unsupported action.
 * - If issues are found:
 *   - Calls `displaySupportedActions()` to guide the user and terminate the process.
 * - If no issues, the flow continues.
 * 
 * Step 3: OpenAI Integration
 * - The query is sent to OpenAI GPT-3.5 for interpretation.
 * - Function: `openai.chat.completions.create()`
 *   - Extracts the action (e.g., "get", "delete") and the identifier (ID or email).
 * - If OpenAI successfully extracts data:
 *   - Calls `normalizeAction(action)` to standardize the action.
 *   - Calls `extractIDOrEmail(identifierString)` to extract the identifier from the response.
 * - If OpenAI fails to provide a valid response:
 *   - Fallback path triggers.
 * 
 * Step 4: Fallback for Failed OpenAI Response
 * - The query is directly parsed to extract an ID or email.
 * - Function: `extractIDOrEmailFromQuery(query)`
 *   - Uses regular expressions to find an ID or email in the query.
 * - If no valid identifier is found:
 *   - Calls `displaySupportedActions()` to guide the user and terminate the process.
 * 
 * Step 5: Action Normalization
 * - The action keyword is standardized to a common format (e.g., "fetch" → "get").
 * - Function: `normalizeAction(action)`
 * 
 * Step 6: Action Execution
 * - Based on the normalized action, one of the following occurs:
 *   - **Fetch User**:
 *     - Function: `getUserByIdentifier(identifier)`
 *     - Searches the mock database for a user with the provided ID or email.
 *   - **Delete User**:
 *     - Function: `deleteUser(identifier)`
 *     - Removes a user with the given ID or email from the mock database.
 * - Both functions return success or error messages.
 * 
 * Step 7: Display Results
 * - Logs the result of the action (success, error, or user details).
 * - If no valid data is found:
 *   - Calls `displaySupportedActions()` to guide the user.
 * 
 * FUNCTIONS INVOLVED:
 * 1. `processQueryWithOpenAI(query)`: Main function orchestrating the query handling.
 * 2. `detectIssuesInQuery(query)`: Validates query for multiple or unsupported actions.
 * 3. `displaySupportedActions()`: Displays a list of valid actions to the user.
 * 4. `openai.chat.completions.create()`: Interprets the query using OpenAI GPT-3.5.
 * 5. `extractIDOrEmailFromQuery(query)`: Extracts an ID or email from the query directly.
 * 6. `normalizeAction(action)`: Standardizes the action keyword to a common format.
 * 7. `getUserByIdentifier(identifier)`: Fetches a user from the mock database.
 * 8. `deleteUser(identifier)`: Deletes a user from the mock database.
 * 
 * FLOW TERMINATION POINTS:
 * - If the query has multiple or unsupported actions (`detectIssuesInQuery`).
 * - If no valid identifier is found (`extractIDOrEmailFromQuery` or OpenAI fallback).
 * - After successfully executing the requested action.
 * 
 * NOTES:
 * - The fallback mechanism ensures that even if OpenAI fails to interpret the query, the system attempts to parse it directly.
 * - All error scenarios lead to calling `displaySupportedActions()` to guide the user.
 */

/*

/**
 * FLOWCHART OF DATA FLOW:
 * 
 * 1. User Input:
 *    +---------------------+
 *    | User Input (Query)  |
 *    +---------------------+
 *               |
 *               v
 *  - User provides a query to initiate the process.
 *  - Passed to `processQueryWithOpenAI(query)`.
 * 
 * 2. Query Validation:
 *    +---------------------------------+
 *    | processQueryWithOpenAI(query)  |
 *    | - Logs the query.              |
 *    | - Calls detectIssuesInQuery.   |
 *    +---------------------------------+
 *               |
 *    +-----------------------+
 *    | detectIssuesInQuery   |
 *    | - Checks for:         |
 *    |   > Multiple actions. |
 *    |   > Unsupported actions. |
 *    +-----------------------+
 *               |
 *    Yes Multiple/Unsupported?
 *               |
 *      +-------+-------+
 *      |               |
 * +---------+    +--------------------------+
 * | Display |    | Continue Query Processing|
 * | Supported|    | (No Issues Found)       |
 * | Actions  |    +--------------------------+
 * +---------+                                |
 *                                            v
 * 
 * 3. OpenAI API Call:
 *    +-----------------------------------+
 *    | OpenAI API Call                   |
 *    | - Extracts action and identifier. |
 *    | - Parses the response.            |
 *    +-----------------------------------+
 *               |
 *     +------------------+
 *     | OpenAI Success?  |
 *     +------------------+
 *               |
 *      +-------+-------+
 *      |               |
 * +----------+    +-------------------------+
 * | Fallback |    | Process OpenAI Output   |
 * | (extract |    | - normalizeAction.      |
 * | ID/Email)|    | - extractIDOrEmail.     |
 * +----------+    +-------------------------+
 *               |
 *    +----------------------------+
 *    | normalizeAction(action)    |
 *    | - Standardizes the action. |
 *    +----------------------------+
 *               |
 *    +----------------------------+
 *    | extractIDOrEmail(query)    |
 *    | - Extracts ID or email     |
 *    |   from query or response.  |
 *    +----------------------------+
 *               |
 * 
 * 4. Action Execution:
 *    +----------------------------+
 *    | Action Execution           |
 *    | - Calls appropriate method:|
 *    |   > getUserByIdentifier.   |
 *    |   > deleteUser.            |
 *    +----------------------------+
 *               |
 *    +----------------------------+
 *    | getUserByIdentifier        |
 *    | - Searches the database.   |
 *    | - Returns user data or     |
 *    |   error message.           |
 *    +----------------------------+
 *               |
 *    +----------------------------+
 *    | deleteUser                 |
 *    | - Removes the user from    |
 *    |   the database.            |
 *    | - Returns success or error.|
 *    +----------------------------+
 *               |
 * 
 * 5. Display Results:
 *    +----------------------------+
 *    | Display Results            |
 *    | - Logs results or errors.  |
 *    | - Calls displaySupported   |
 *    |   Actions if necessary.    |
 *    +----------------------------+
 *               |
 *        (End of Process)
 */




