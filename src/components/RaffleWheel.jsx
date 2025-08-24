// components/RaffleWheel.jsx
import React, { useState } from "react";

const RaffleWheel = ({ entries, onSpin }) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  const handleSpin = () => {
    setSpinning(true);

    // Simulate spinning animation
    setTimeout(() => {
      // This would actually select a winner based on entry weights
      const randomWinner =
        entries.length > 0
          ? entries[Math.floor(Math.random() * entries.length)]
          : null;

      setWinner(randomWinner);
      setSpinning(false);
      if (onSpin) onSpin(randomWinner);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 mb-8">
        <div
          className={`absolute inset-0 rounded-full border-4 border-blue-500 ${
            spinning ? "animate-spin" : ""
          }`}
        ></div>
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          {spinning ? (
            <span className="text-blue-600 font-bold">Spinning...</span>
          ) : winner ? (
            <div className="text-center p-4">
              <span className="block text-lg font-bold text-blue-700">
                Winner!
              </span>
              <span className="block text-sm text-blue-600">{winner.name}</span>
            </div>
          ) : (
            <span className="text-blue-600 font-bold">
              {entries.length} Entries
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={spinning || entries.length === 0}
        className={`px-8 py-3 rounded-full font-bold text-white ${
          spinning || entries.length === 0
            ? "bg-gray-400"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        }`}
      >
        {entries.length === 0 ? "No Entries" : "Spin the Wheel"}
      </button>
    </div>
  );
};

export default RaffleWheel;
