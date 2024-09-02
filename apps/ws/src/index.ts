import { WebSocketServer } from 'ws';
import { db } from './db'; // Import the shared db client
import { GameManager } from './GameManager';

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager(db); // Pass the shared db client to GameManager

wss.on('connection', function connection(ws) {
  console.log('New WebSocket connection established.');

  try {
    gameManager.addUser(ws);
  } catch (error) {
    console.error('Error during addUser:', error);
    ws.close(); // Optionally close the WebSocket on error
  }

  ws.on('close', () => {
    console.log('WebSocket connection closed.');
    gameManager.removeUser(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle server shutdown
process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});
