// Select DOM elements
const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");

// Event listener for the "Send" button
sendButton.addEventListener("click", handleSendMessage);

// Function to handle sending user messages
async function handleSendMessage() {
  const userQuery = chatInput.value.trim(); // Get user input

  if (!userQuery) {
    addMessageBubble("Please enter a valid query.", "error-message");
    return; // Do nothing if the input is empty
  }

  // Add user's message to the chat window
  addMessageBubble(userQuery, "user-message");

  // Show a loading spinner
  const loadingBubble = addLoadingSpinner();

  try {
    // Send user input to the backend API
    const response = await fetch("http://127.0.0.1:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Process the response from the backend
    const responseData = await response.json();
    console.log("Response from backend:", responseData);

    // Remove the loading bubble
    chatWindow.removeChild(loadingBubble);

    // Add backend's response to the chat window
    if (responseData.error) {
      addMessageBubble(`Error: ${responseData.error}`, "error-message");
    } else {
      addMessageBubble(JSON.stringify(responseData, null, 2), "response-message");
    }
  } catch (error) {
    console.error("Error connecting to backend:", error);
    chatWindow.removeChild(loadingBubble); // Remove the loading bubble
    addMessageBubble(`Error: ${error.message}`, "error-message");
  } finally {
    // Clear the input field
    chatInput.value = "";
  }
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
  messageBubble.textContent = message;

  // Append the message bubble to the chat window
  chatWindow.appendChild(messageBubble);

  // Scroll to the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageBubble; // Return the created bubble for future reference
}
