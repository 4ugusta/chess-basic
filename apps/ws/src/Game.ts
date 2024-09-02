import { PrismaClient, User } from '@prisma/client';
import { Chess } from 'chess.js';
import { WebSocket } from 'ws';
import { GAME_OVER, INIT_GAME, MOVE } from './messages';

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private gameId: number; // Store the Game ID
  private db: PrismaClient; // Prisma client instance
  private startTime: Date;
  private moveCount = 0;
  private userMapping: Map<WebSocket, User>; // Map WebSocket to User

  // Define player IDs
  private player1Id: number | null = null;
  private player2Id: number | null = null;

  constructor(
    player1: WebSocket,
    player2: WebSocket,
    db: PrismaClient,
    gameId: number,
    userMapping: Map<WebSocket, User>
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.db = db; // Assign the passed Prisma client to the class property
    this.gameId = gameId;
    this.userMapping = userMapping; // Initialize user mapping
    this.board = new Chess();
    this.startTime = new Date();

    // Assign player IDs from userMapping
    this.player1Id = this.userMapping.get(player1)?.id ?? null;
    this.player2Id = this.userMapping.get(player2)?.id ?? null;

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: 'white',
          gameId: this.gameId,
          player1Id: this.player1Id,
          player2Id: this.player2Id,
        },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: 'black',
          gameId: this.gameId,
          player1Id: this.player1Id,
          player2Id: this.player2Id,
        },
      })
    );
  }

  async makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    const isPlayer1Turn = this.moveCount % 2 === 0;
    const isPlayer1 = socket === this.player1;

    if ((isPlayer1 && !isPlayer1Turn) || (!isPlayer1 && isPlayer1Turn)) {
      console.error('Not your turn!');
      socket.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'It is not your turn!' },
        })
      );
      return;
    }

    try {
      const result = this.board.move(move);

      if (!result) {
        console.error('Invalid move!');
        socket.send(
          JSON.stringify({
            type: 'error',
            payload: { message: 'Invalid move!' },
          })
        );
        return;
      }

      const playerId = isPlayer1 ? this.player1Id : this.player2Id;
      if (!playerId) {
        console.error('Player ID not found');
        return;
      }

      await this.db.move.create({
        data: {
          gameId: this.gameId,
          playerId,
          from: move.from,
          to: move.to,
          moveNum: this.moveCount + 1,
        },
      });

      if (this.board.isGameOver()) {
        await this.db.game.update({
          where: { id: this.gameId },
          data: { endTime: new Date() },
        });

        const winner = this.board.turn() === 'w' ? 'black' : 'white';

        this.player1.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: { winner },
          })
        );
        this.player2.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: { winner },
          })
        );
        return;
      }

      this.moveCount++;
      const player = isPlayer1 ? 'player1' : 'player2';

      console.log(`Move by ${player}: ${move.from} -> ${move.to}`);

      // Send move update to both players
      const movePayload = {
        type: MOVE,
        payload: { ...move, player },
      };

      this.player1.send(JSON.stringify(movePayload));
      this.player2.send(JSON.stringify(movePayload));
    } catch (e) {
      console.error('Error making move:', e);
      socket.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Server error, try again later.' },
        })
      );
    }
  }
}
