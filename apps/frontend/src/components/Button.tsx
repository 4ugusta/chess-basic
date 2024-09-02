export const Button = ({
  onClick,
  children,
  color,
}: {
  onClick: () => void;
  children: React.ReactNode;
  color: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`mt-4 bg-${color}-500 hover:bg-${color}-700 text-white 
  font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105`}
    >
      {children}
    </button>
  );
};
