// script.js
// -----------------------------------------------------------
// JavaScript makes your web page interactive.
// HTML = the structure (bones), CSS = the style (skin),
// JavaScript = the behavior (muscles).
//
// This file runs in the browser after the page loads.
// -----------------------------------------------------------

// "Hello World" — the traditional first thing every programmer prints.
console.log('Hello, World! Your JavaScript is working.');

// --- Button interaction example ---
// document.getElementById finds a piece of your HTML by its id="..."
const button = document.getElementById('greet-btn');
const message = document.getElementById('message');

// addEventListener listens for a "click" and runs a function when it happens
button.addEventListener('click', function () {
  message.textContent = '🎉 It works! You just ran JavaScript.';
  message.style.color = '#4f46e5';
  message.style.fontWeight = 'bold';
});
