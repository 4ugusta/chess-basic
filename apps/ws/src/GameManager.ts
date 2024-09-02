import { PrismaClient, User } from '@prisma/client';
import { WebSocket } from 'ws';
import { INIT_GAME, MOVE } from './messages';
import { Game as GameInstance } from './Game';

export class GameManager {
  private games: GameInstance[];
  private pendingUser: WebSocket | null;
  private users: WebSocket[];
  private db: PrismaClient; // Add Prisma client
  private userMapping: Map<WebSocket, User>; // Map for user data
  private lastConnectionTime: number = 0;

  constructor(db: PrismaClient) {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
    this.db = db; // Initialize Prisma client
    this.userMapping = new Map(); // Initialize the map
  }

  async addUser(socket: WebSocket) {
    // Check if the user is already registered with the socket
    if (!this.userMapping.has(socket)) {
      const username = `Player${Date.now()}`;
      const user = await this.db.user.create({
        data: { username },
      });

      console.log(`User ${user.username} added with ID: ${user.id}`);
      this.userMapping.set(socket, user);
      this.users.push(socket);
      this.addHandler(socket);
    } else {
      console.log('User already exists for this socket.');
    }
  }

  removeUser(socket: WebSocket) {
    const user = this.userMapping.get(socket);
    if (user) {
      console.log(`Removing user ${user.username} with ID: ${user.id}`);
    } else {
      console.log('User not found in userMapping.');
    }
    this.users = this.users.filter((user) => user !== socket);
    this.userMapping.delete(socket); // Remove user from the map
    // stop the game here because the user has left
  }

  private addHandler(socket: WebSocket) {
    socket.on('message', async (data) => {
      // try to use grpc here to send data to the game server
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          // Start a game
          console.log('Pending user found, starting game...');
          const player1 = this.userMapping.get(this.pendingUser);
          const player2 = this.userMapping.get(socket);

          if (!player1 || !player2) {
            console.error('One of the players is missing:', { player1, player2 });
            return;
          }

          console.log(`Player 1 ID: ${player1.id}, Player 2 ID: ${player2.id}`);

          const game = await this.db.game.create({
            data: {
              player1Id: player1.id,
              player2Id: player2.id,
              startTime: new Date(),
            },
          });

          console.log(`Game started between User ${game.player1Id} and User ${game.player2Id}`);
          const gameInstance = new GameInstance(this.pendingUser, socket, this.db, game.id, this.userMapping);
          //console.log('inside init game');
          this.games.push(gameInstance);
          this.pendingUser = null;
        } else {
          console.log('No pending user, setting current socket as pending user.');
          this.pendingUser = socket;
        }
      }

      if (message.type === MOVE) {
        console.log('Processing move...');
        // find the game and send the move
        const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
        if (game) {
          console.log('Game found, making move...');
          game.makeMove(socket, message.payload.move);
        } else {
          console.log('Game not found for the move.');
        }
      }
    });
  }
}
