// server.js
// -----------------------------------------------------------
// This is a tiny web server built with Express.
// A server is a program that listens for requests from a browser
// and sends back responses (like a waiter taking orders).
//
// Run it with:   node server.js
// Then visit:    http://localhost:3000
// -----------------------------------------------------------

// Load environment variables from your .env file
require('dotenv').config();

// Import Express — the library that makes building servers easy
const express = require('express');

// Create your app (think of this as "opening the restaurant")
const app = express();

// Choose which port the server listens on
// Port 3000 is a common choice for local development
const PORT = process.env.PORT || 3000;

// --- Routes ---
// A route is a URL path + what to do when someone visits it.

// When someone visits http://localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

// When someone visits http://localhost:3000/about
app.get('/about', (req, res) => {
  res.json({
    message: 'This is the about page — served as JSON data.',
    app: 'my-first-app',
    built_with: 'Express + Node.js',
  });
});

// --- Demo: using an environment variable ---
// This shows the API key from your .env file WITHOUT exposing the real value.
// Never send real secret keys to the browser!
app.get('/env-check', (req, res) => {
  const keyExists = !!process.env.MY_API_KEY;
  res.json({
    message: keyExists
      ? 'MY_API_KEY is loaded from .env (value hidden for safety)'
      : 'MY_API_KEY is not set — check your .env file',
  });
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop it.');
  console.log(`MY_API_KEY loaded: ${process.env.MY_API_KEY ? 'yes' : 'no'}`);
});
