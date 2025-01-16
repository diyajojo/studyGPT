'use client';
import React, { useState } from 'react';
import {
   Target, Settings, Gamepad2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import RenderPreferences from './features/preferences';
import RenderGoals from './features/goals';
import RenderGames from './features/games';

const StudyPrepHub = () => {

  const router=useRouter();

  const [activeTab, setActiveTab] = useState('preferences');

  const handleButtonClick=()=>
  {
    router.push('/schedule');
  }

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
            {activeTab === 'goals' && <RenderGoals />}
            {activeTab === 'games' && <RenderGames />}
          </div>
          <button
  className="flex items-center gap-12 px-12 py-10 rounded-[20px] mt-8 mx-auto"
  style={{
    background: "rgba(218, 236, 244, 0.49)",
    // Removed transform and absolute positioning to place it under the content
    top: "32px"
  }}
  onClick={handleButtonClick}
>
  <span className="text-white font-semibold">Organize Your Study Patterns 💡</span>
</button>
        </div>
      </div>

        
    </div>
  );
};

export default StudyPrepHub;