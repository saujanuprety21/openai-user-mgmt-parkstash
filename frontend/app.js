// Select DOM elements
const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");

// Event listener for the "Send" button
sendButton.addEventListener("click", handleSendMessage);

// Function to handle sending user messages

async function handleSendMessage() {
  const userQuery = chatInput.value.trim(); // Get user input
  console.log("User input received:", userQuery);

  if (!userQuery) {
    addMessageBubble("Please enter a valid query.", "error-message");
    console.log("Empty input detected, prompting user to enter a valid query.");
    return; // Do nothing if the input is empty
  }

  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = ""; // Clear the card container
  console.log("Cleared any existing user card from the card container.");

  addMessageBubble(userQuery, "user-message");
  console.log("User's message added to the chat window.");

  const loadingBubble = addLoadingSpinner();
  console.log("Loading spinner added to indicate processing.");

  try {
    console.log("Sending user input to the backend API...");
    const response = await fetch("http://127.0.0.1:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: userQuery }),
    });

    chatWindow.removeChild(loadingBubble);
    console.log("Loading spinner removed after receiving backend response.");

    const responseData = await response.json();
    console.log("Response received from backend:", responseData);

    if (response.ok) {
      if (responseData.message === "User deleted successfully") {
        console.log("User deleted successfully. Clearing UI.");
        addMessageBubble(responseData.message, "response-message");
        cardContainer.innerHTML = ""; // Ensure card is cleared on deletion
      } else if (responseData.data) {
        if (responseData.data.id && responseData.data.name && responseData.data.email) {
          console.log("Valid user data detected. Creating user card.");
          createUserCard(responseData.data);
        } else {
          // ****** ISSSUE: when user is just deleted it shows this and not "User doesn't exist from backend"
          console.log("User data is invalid or incomplete. Skipping card creation."); 
          addStyledErrorMessage("User data is invalid or incomplete.");
        }
      } else {
        console.log("No specific user data in the response. Adding success message.");
        addMessageBubble("Success: " + JSON.stringify(responseData, null, 2), "response-message");
      }
    } else {
      console.log("Error from backend:", responseData.error);
      addStyledErrorMessage(responseData.error);
    }
  } catch (error) {
    console.error("Error connecting to backend:", error);
    chatWindow.removeChild(loadingBubble);
    addStyledErrorMessage("Error: Could not connect to backend.");
  } finally {
    chatInput.value = "";
    console.log("Input field cleared after processing.");
  }
}


// Function to create and display a card with user data
function createUserCard(userData) {
  const cardContainer = document.getElementById("card-container");

  // Clear any previous card
  cardContainer.innerHTML = "";

  // Create the card element
  const card = document.createElement("div");
  card.className = "card";

  // Add user details to the card
  card.innerHTML = `
    <h3>User Info</h3>
    <p><strong>ID:</strong> ${userData.id}</p>
    <p><strong>Name:</strong> ${userData.name}</p>
    <p><strong>Email:</strong> ${userData.email}</p>
  `;

  // Append the card to the container
  cardContainer.appendChild(card);
}

// Function to add a spinner as a loading bubble
function addLoadingSpinner() {
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "message loading-bubble";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  loadingBubble.appendChild(spinner);
  chatWindow.appendChild(loadingBubble);

  // Scroll to the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return loadingBubble; // Return the loading bubble for removal later
}


// Function to add a chat bubble
function addMessageBubble(message, className) {
  const messageBubble = document.createElement("div");
  messageBubble.className = `message ${className}`;

  // Check if the message is for an error and needs HTML styling
  if (className === "error-message" && typeof message === "string") {
    // Format error messages with a title and body
    messageBubble.innerHTML = `
      <div class="error-title">Error</div>
      <div class="error-body">${message}</div>
    `;
  } else {
    // Use textContent for other types of messages to prevent HTML injection
    messageBubble.textContent = message;
  }

  // Append the message bubble to the chat window
  chatWindow.appendChild(messageBubble);

  // Scroll to the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageBubble; // Return the created bubble for future reference
}

function addStyledErrorMessage(message) {
  const errorBubble = document.createElement("div");
  errorBubble.className = "message error-message"; // Use consistent error class
  errorBubble.innerHTML = `
    <div class="error-title">ERROR</div>
    <div class="error-body">${message}</div>
  `;

  // Append the error bubble to the chat window
  chatWindow.appendChild(errorBubble);

  // Scroll to the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  console.log("Styled error message displayed:", message);
}
