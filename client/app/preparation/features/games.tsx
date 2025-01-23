'use client';
import React, { useState, useEffect } from 'react';

interface Card {
  id: number;
  icon: string;
}

interface WordScramble {
  original: string;
  scrambled: string;
  userInput: string;
}

interface GameState {
  memoryCards: Card[];
  flipped: number[];
  matched: string[];
  numberSequence: number[];
  userSequence: number[];
  wordScramble: WordScramble;
}

const RenderGames = () => {
  const [gameState, setGameState] = useState<GameState>({
    memoryCards: [],
    flipped: [],
    matched: [],
    numberSequence: [],
    userSequence: [],
    wordScramble: { original: '', scrambled: '', userInput: '' }
  });

  useEffect(() => {
    initializeGames();
  }, []);

  const initializeGames = () => {
    // Memory game setup
    const icons = ['📚', '🎯', '💡', '⏰', '📝', '🎨'];
    const memoryCards = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon }));
    
    // Number sequence game
    const numberSequence = Array.from({ length: 5 }, () => 
      Math.floor(Math.random() * 9) + 1
    );

    // Word scramble setup
    const words = [
      'STUDY', 'FOCUS', 'LEARN', 'GROWTH', 'SMART', 'LOGIC',
      'THINK', 'BRAIN', 'KNOWLEDGE', 'INSIGHT', 'WISDOM', 'INTELLECT',
      'REASON', 'ANALYZE', 'UNDERSTAND', 'COMPREHEND', 'DISCOVER', 'INNOVATE',
      'CREATE', 'IMAGINE', 'INSPIRE', 'ACHIEVE', 'DEVELOP', 'PROGRESS'
    ];
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = word.split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    setGameState(prev => ({
      ...prev,
      memoryCards,
      numberSequence,
      wordScramble: { original: word, scrambled, userInput: '' }
    }));
  };

  // Memory Card Game Handler
  const handleMemoryCard = (id: number) => {
    if (gameState.flipped.length === 2 || gameState.flipped.includes(id)) return;

    const newFlipped = [...gameState.flipped, id];
    setGameState(prev => ({ ...prev, flipped: newFlipped }));

    if (newFlipped.length === 2) {
      const firstCard = gameState.memoryCards[newFlipped[0]];
      const secondCard = gameState.memoryCards[newFlipped[1]];

      if (firstCard.icon === secondCard.icon) {
        setGameState(prev => ({
          ...prev,
          matched: [...prev.matched, firstCard.icon],
          flipped: []
        }));
      } else {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, flipped: [] }));
        }, 1000);
      }
    }
  };

  // Number Sequence Game Handler
  const handleNumberSequence = (num: number) => {
    const newUserSequence = [...gameState.userSequence, num];
    setGameState(prev => ({ ...prev, userSequence: newUserSequence }));

    const currentIndex = newUserSequence.length - 1;
    if (newUserSequence[currentIndex] !== gameState.numberSequence[currentIndex]) {
      // Wrong sequence
      setTimeout(() => {
        setGameState(prev => ({ ...prev, userSequence: [] }));
      }, 500);
    } else if (newUserSequence.length === gameState.numberSequence.length) {
      // Completed sequence correctly
      setTimeout(() => {
        initializeGames();
      }, 1000);
    }
  };

  // Word Scramble Game Handler
  const handleWordScramble = (input: string) => {
    const newInput = input.toUpperCase();
    setGameState(prev => ({
      ...prev,
      wordScramble: { ...prev.wordScramble, userInput: newInput }
    }));

    if (newInput === gameState.wordScramble.original) {
      // Correct word
      setTimeout(() => {
        initializeGames();
      }, 1000);
    }
  };

  return (
    <div className="font-noto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
      {/* Memory Game */}
      <div className="bg-white/20 rounded-xl p-6 transform transition-all duration-300 hover:scale-[1.02]">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🧠</span> Memory Match
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {gameState.memoryCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleMemoryCard(card.id)}
              className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                gameState.flipped.includes(card.id) || gameState.matched.includes(card.icon)
                  ? 'bg-gradient-to-br from-[#FF8C5A] to-[#FF6B3D] shadow-lg'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {gameState.flipped.includes(card.id) || gameState.matched.includes(card.icon)
                ? card.icon
                : '?'}
            </button>
          ))}
        </div>
      </div>

      {/* Number Sequence Game */}
      <div className="bg-white/20 rounded-xl p-6 transform transition-all duration-300 hover:scale-[1.02]">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🔢</span> Number Sequence
        </h3>
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {gameState.numberSequence.map((num, idx) => (
              <div
                key={idx}
                className="w-12 h-12 bg-gradient-to-br from-[#FF8C5A] to-[#FF6B3D] rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg transform transition-all duration-300 hover:scale-110"
              >
                {num}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleNumberSequence(i + 1)}
                className="w-full h-12 bg-white/10 hover:bg-white/20 rounded-lg text-white text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word Scramble */}
      <div className="bg-white/20 rounded-xl p-6 transform transition-all duration-300 hover:scale-[1.02]">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">📝</span> Word Scramble
        </h3>
        <div className="space-y-6">
          <div className="text-center text-4xl font-bold text-white bg-white/10 rounded-lg p-4">
            {gameState.wordScramble.scrambled.split('').map((letter, idx) => (
              <span
                key={idx}
                className="inline-block mx-1 transform transition-all duration-300 hover:scale-110 hover:text-[#FF8C5A]"
              >
                {letter}
              </span>
            ))}
          </div>
          <input
            type="text"
            value={gameState.wordScramble.userInput}
            onChange={(e) => handleWordScramble(e.target.value)}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-4 text-center uppercase text-xl transition-all duration-300 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF8C5A]"
            placeholder="Unscramble the word"
          />
        </div>
      </div>
    </div>
  );
};

export default RenderGames;