'use client';
import React, { useState, useEffect } from 'react';
import { 
  Brain, Target, Settings, Gamepad2, 
  CheckCircle2, Book, Volume2, Sun, Moon, Coffee,
  Clock, Laptop, GraduationCap
} from 'lucide-react';
import RenderPreferences from './features/preferences';
import RenderGoals from './features/goals';

const StudyPrepHub = () => {
  const [activeTab, setActiveTab] = useState('preferences');

  const [goals, setGoals] = useState({
    shortTerm: '',
    longTerm: '',
    todayFocus: ''
  });

  const [gameState, setGameState] = useState({
    memoryCards: [],
    flipped: [],
    matched: [],
    numberSequence: [],
    userSequence: [],
    wordScramble: { original: '', scrambled: '', userInput: '' }
  });

  // Initialize games
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
    const words = ['STUDY', 'FOCUS', 'LEARN', 'GROWTH', 'SMART'];
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

  const renderGames = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Memory Game */}
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Memory Match</h3>
        <div className="grid grid-cols-4 gap-3">
          {gameState.memoryCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleMemoryCard(card.id)}
              className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all ${
                gameState.flipped.includes(card.id) || gameState.matched.includes(card.icon)
                  ? 'bg-[#FF8C5A]'
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
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Number Sequence</h3>
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {gameState.numberSequence.map((num, idx) => (
              <div
                key={idx}
                className="w-12 h-12 bg-[#FF8C5A] rounded-lg flex items-center justify-center text-white text-xl font-bold"
              >
                {num}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleNumberSequence(i + 1)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word Scramble */}
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Word Scramble</h3>
        <div className="space-y-4">
          <div className="text-center text-3xl font-bold text-white">
            {gameState.wordScramble.scrambled}
          </div>
          <input
            type="text"
            value={gameState.wordScramble.userInput}
            onChange={(e) => handleWordScramble(e.target.value)}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 text-center uppercase"
            placeholder="Unscramble the word"
          />
        </div>
      </div>
    </div>
  );

  // Helper Components
  const PreferenceCard = ({ title, icon, options, selected, onChange }) => (
    <div className="bg-white/20 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`p-3 rounded-lg transition-all ${
              selected === option
                ? 'bg-[#FF8C5A] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#125774] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Prepare for Success
          </h1>

          {/* Navigation Tabs */}
<div className="flex justify-center mb-8">
  <div className="bg-white/20 rounded-xl p-2 flex gap-2">
    <button
      onClick={() => setActiveTab('preferences')}
      className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
        activeTab === 'preferences'
          ? 'bg-[#FF8C5A] text-white'
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Settings />
      PREFERENCES
    </button>
    <button
      onClick={() => setActiveTab('goals')}
      className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
        activeTab === 'goals'
          ? 'bg-[#FF8C5A] text-white'
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Target />
      GOALS
    </button>
    <button
      onClick={() => setActiveTab('games')}
      className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
        activeTab === 'games'
          ? 'bg-[#FF8C5A] text-white'
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Gamepad2 />
      BRAIN TRAINING
    </button>
  </div>
</div>
          {/* Content */}
          <div className="mt-8">
          {activeTab === 'preferences' && <RenderPreferences />}
            {activeTab === 'goals' && <RenderGoals/>}
            {activeTab === 'games' && renderGames()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPrepHub;