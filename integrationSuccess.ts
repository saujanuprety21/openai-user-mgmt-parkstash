import express from 'express';
import path from 'path';

const app = express();
app.use(express.json());



// Serve frontend files from the "frontend" directory
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));




// API route
app.post('/api/chat', (req, res) => {
  res.json({ success: true, message: 'It works!' });
});

// Redirect all unmatched routes to the frontend
app.get('/*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://127.0.0.1:3000');
});

