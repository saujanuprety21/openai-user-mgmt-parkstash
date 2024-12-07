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
// Initialize OpenAI client
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    organization: "org-GfIlfGK5Kk9gHuK89zNPrxB0", // Replace with your organization ID
});
// Mock database of users
const users = [
    { id: "567UVWX", name: "Alice", email: "alice@example.com" },
    { id: "AB789CD", name: "Bob", email: "bob@example.com" },
    { id: "9", name: "Charlie", email: "charlie@example.com" },
];
// Function to fetch a user by ID
function getUser(id) {
    const user = users.find((u) => u.id === id);
    return user || { error: "User not found" };
}
// Function to process the query using OpenAI and trigger getUser
async function processQueryWithOpenAI(query) {
    const validActions = [
        "Get user with {id}",
        "Fetch user with {id}",
    ];
    try {
        let idSource = "OpenAI"; // Default source is OpenAI
        let id = null;
        // Use OpenAI to process the query
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
        if (aiResponse === "No user ID is present in the query.") {
            console.log("OpenAI failed. Fallback activated. Parsing query...");
            const fallbackMatch = query.match(/\b[A-Za-z]*\d+[A-Za-z]*\b/);
            if (fallbackMatch) {
                id = fallbackMatch[0]; // Extracts the first matching alphanumeric ID-like pattern
                idSource = "Fallback";
                console.log(`Fallback parsed text: "${fallbackMatch[0]}"`);
            }
        }
        else {
            // Clean OpenAI response for potential extra words
            aiResponse = aiResponse.replace(/\b(ID|User ID):?\s*/gi, "").trim();
            id = aiResponse.match(/^[A-Za-z0-9]+$/)?.[0] || null;
        }
        if (id) {
            console.log(`Fetching user with ID: ${id} (Source: ${idSource})`);
            const user = getUser(id);
            console.log("User Object:", user);
        }
        else {
            console.log("No valid user ID found in query.");
            console.log("Oops, we support the following actions:");
            validActions.forEach((action, index) => {
                console.log(`${index + 1}. ${action}`);
            });
        }
    }
    catch (error) {
        console.error("Error processing query with OpenAI:", error.message || error);
    }
}
// Main function to run the demo
async function runDemo() {
    console.log("\n=== Running User Query Demo with OpenAI ===");
    // Example queries to test
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
    for (const query of queries) {
        await processQueryWithOpenAI(query);
        console.log("\n-----");
    }
}
// Execute the demo
runDemo();
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
