import { Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";

interface BoardSquare {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

interface ChessBoardProps {
  chess: any;
  setBoard: any;
  socket: WebSocket;
  board: (BoardSquare | null)[][];
}

export const ChessBoard = ({
  board,
  socket,
  chess,
  setBoard,
}: ChessBoardProps) => {
  const [from, setFrom] = useState<Square | null>(null);

  return (
    <div>
      {board.map((row, i) => (
        <div key={i} className="flex">
          {row.map((square, j) => {
            const squareRepresentation = (String.fromCharCode(97 + (j % 8)) +
              "" +
              (8 - i)) as Square;

            return (
              <div
                onClick={() => {
                  if (!from) {
                    setFrom(squareRepresentation);
                  } else {
                    socket.send(
                      JSON.stringify({
                        type: MOVE,
                        payload: {
                          move: {
                            from,
                            to: squareRepresentation,
                          },
                        },
                      })
                    );
                    setFrom(null);
                    chess.move({
                      from,
                      to: squareRepresentation,
                    });
                    setBoard(chess.board());
                    console.log({
                      from,
                      to: squareRepresentation,
                    });
                  }
                }}
                key={j}
                className={`w-20 h-20 flex justify-center items-center ${
                  (i + j) % 2 === 0 ? "bg-green-500" : "bg-slate-500"
                }`}
              >
                {square ? (
                  <img
                    className="w-12 h-12"
                    src={`/${
                      square?.color === "b"
                        ? square?.type
                        : `${square?.type?.toUpperCase()} Copy`
                    }.png`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
