import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { ChessBoard } from '../components/ChessBoard';
import { useSockets } from '../hooks/useSockets';
import { Chess } from 'chess.js';

// Define the Move interface
interface Move {
  from: string;
  to: string;
  player: 'player1' | 'player2'; // Match this with the player info from backend
}

export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const GAME_OVER = 'game_over';

export const Game = () => {
  const socket = useSockets();
  const chess = useMemo(() => new Chess(), []);
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [moves, setMoves] = useState<Move[]>([]);
  const [gameId, setGameId] = useState<number>(0);
  const [player1Id, setPlayer1Id] = useState<number | null>(null); // Store player1Id
  const [player2Id, setPlayer2Id] = useState<number | null>(null); // Store player2Id

  const fetchMoves = async (currentGameId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/games/${currentGameId}/moves`);
      if (response.ok) {
        const data = await response.json();
        console.log('data:', data);

        if (data.length === 0) {
          console.warn('No moves found for game ID:', currentGameId);
        }

        if (Array.isArray(data)) {
          setMoves(
            data.map((move, index) => ({
              from: move.from,
              to: move.to,
              player: move.playerId === player1Id ? 'player1' : 'player2',
              moveNum: index + 1,
            }))
          );
          console.log('updated moves:', moves);
        } else {
          console.log('Data is not an array:', data);
        }
      } else {
        console.error('Failed to fetch moves:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching moves:', error);
    }
  };

  useEffect(() => {
    if (gameId > 0 && player1Id !== null && player2Id !== null) {
      console.log(player1Id, player2Id);
      console.log('game Id:', gameId);
      fetchMoves(gameId);
    }
  }, [gameId, player1Id, player2Id, moves]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data); // Log received messages

      switch (data.type) {
        case INIT_GAME: {
          setBoard(chess.board());
          setStarted(true);
          console.log('Game initialized for Player:', data.payload.color); // Log initialization
          console.log('Game ID:', data.payload.gameId); // Log game ID
          setGameId(data.payload.gameId);
          //console.log('game ID:', gameId);
          //fetchMoves(data.payload.gameId); // Fetch moves for the new game
          setPlayer1Id(data.payload.player1Id); // Set player1Id
          setPlayer2Id(data.payload.player2Id); // Set player2Id
          break;
        }

        case MOVE: {
          const move: Move = data.payload;
          console.log('Move received by Player:', move); // Log moves to see if Player 2's moves are being received
          chess.move({ from: move.from, to: move.to });
          setBoard(chess.board());

          // Add the move to the moves array
          setMoves((prevMoves) => [...prevMoves, move]);
          console.log('Move made:', move); // Log the move to ensure it's correctly handled
          console.log('setting in moves:', moves);
          break;
        }

        case GAME_OVER: {
          console.log('Game over');
          break;
        }

        case 'error': {
          alert(data.payload.message); // Show error message to the user
          break;
        }
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket, chess, gameId]); // Dependency on gameId ensures this effect runs when gameId is updated

  if (!socket) {
    return <div>Connecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center">
      <div className="w-5/6 mx-auto p-4 bg-white shadow-lg rounded-lg px-4">
        <div className="flex rounded-lg">
          <div className="flex justify-center items-center flex-grow">
            <ChessBoard board={board} chess={chess} setBoard={setBoard} socket={socket} />
          </div>
          <div className="flex flex-col justify-center bg-white flex-grow py-4 px-10 rounded-r-lg">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Chess Game</h1>
            <p className="text-gray-600 mb-4">
              Play a game of chess with another player. Make your moves and see them reflected on the board in
              real-time.
            </p>
            {!started && (
              <Button
                onClick={() => {
                  socket.send(JSON.stringify({ type: INIT_GAME }));
                }}
                color="green"
              >
                Start Game
              </Button>
            )}
            {started && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Moves:</h2>
                <ul className="list-disc pl-5">
                  {moves.map((move, index) => (
                    <li key={index}>
                      {`${index + 1}. ${move.from} to ${move.to} (${move.player === 'player1' ? 'Player 1' : 'Player 2'})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
