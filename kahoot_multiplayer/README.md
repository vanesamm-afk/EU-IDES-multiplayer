Kahoot-like Multiplayer Quiz
============================

This project includes a simple Node.js + Socket.io server and a React (Vite) client.
The quiz questions come from server/questions.json (7 questions taken from the user's Kahoot PDF).

How to run locally:
1. Open two terminals.

Terminal 1 - server:
  cd server
  npm install
  npm start
  # server runs at http://localhost:3000

Terminal 2 - client:
  cd client
  npm install
  npm run dev
  # client runs on Vite (e.g. http://localhost:5173)

Usage:
- Open the client in a browser. Choose "Host" on one device/tab and "Player" on other devices/tabs.
- Host -> Create room -> Share room code with players.
- Players -> Join with code and name.
- Host -> Start game -> Advance questions with Next question.

Deploying:
- To make a public link you can deploy the server to Render/Heroku and the client to Vercel/Netlify.
- If you want, I can guide you step-by-step to deploy to a specific provider.
