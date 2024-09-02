import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex justify-center items-center">
            <img
              src="/chessboard.jpeg"
              alt="Chessboard"
              className="rounded-lg shadow-md"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Chess
            </h1>
            <p className="text-gray-600 mb-4">
              Chess is a two-player strategy board game played on a checkered
              gameboard with 64 squares arranged in an 8×8 grid. The game is
              played by millions of people worldwide. Chess is believed to be
              derived from the Indian game chaturanga sometime before the 7th
              century. Chaturanga is also the likely ancestor of the Eastern
              strategy games xiangqi, janggi, and shogi. Chess reached Europe by
              the 9th century, due to the Umayyad conquest of Hispania. The
              pieces assumed their current powers in Spain in the late 15th
              century; the rules were finally standardized in the 19th century.
            </p>
            <Button
              onClick={() => {
                navigate("/game");
              }}
              color="green"
            >
              Play Chess
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
