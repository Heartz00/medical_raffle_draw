// components/RaffleAnimation.jsx
import React, { useState, useEffect } from "react";

const RaffleAnimation = ({ participants, onComplete }) => {
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!isSpinning || participants.length === 0) return;

    const interval = setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % participants.length);
    }, 100);

    // Stop after 3 seconds and select a winner
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);

      // Select a random winner
      const randomIndex = Math.floor(Math.random() * participants.length);
      const selectedWinner = participants[randomIndex];
      setWinner(selectedWinner);

      // Notify parent component
      if (onComplete) {
        onComplete(selectedWinner);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, participants, onComplete]);

  const resetAnimation = () => {
    setIsSpinning(true);
    setWinner(null);
  };

  if (participants.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No participants available
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Raffle Draw Animation</h3>

      <div className="h-64 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`p-3 border-b border-gray-100 ${
              index === currentHighlight && isSpinning
                ? "bg-blue-100 font-semibold"
                : winner && winner.id === participant.id
                ? "bg-green-100 font-semibold"
                : "bg-white"
            }`}
          >
            {participant.name} - {participant.points} points
          </div>
        ))}
      </div>

      {winner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <h4 className="text-lg font-semibold text-green-800 mb-2">
            Winner Selected!
          </h4>
          <p className="text-green-700">{winner.name}</p>
          <p className="text-green-600">{winner.contact_email}</p>
          <p className="text-green-600">{winner.points} points</p>
        </div>
      )}

      <div className="flex justify-center">
        {!isSpinning && (
          <button
            onClick={resetAnimation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Draw Again
          </button>
        )}
      </div>
    </div>
  );
};

export default RaffleAnimation;
