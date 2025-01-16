'use client';
import { useState } from 'react';
import React from 'react';


const RenderGoals = () => {

  const [goals, setGoals] = useState({
    shortTerm: '',
    longTerm: '',
    todayFocus: ''
  });

  
  return(
  <div className="space-y-6">
    <div className="bg-white/20 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Daily Goals</h3>
      <textarea
        value={goals.todayFocus}
        onChange={(e) => setGoals(prev => ({ ...prev, todayFocus: e.target.value }))}
        placeholder="What specific topics or subjects will you focus on today?"
        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Weekly Goals</h3>
        <textarea
          value={goals.shortTerm}
          onChange={(e) => setGoals(prev => ({ ...prev, shortTerm: e.target.value }))}
          placeholder="What do you want to achieve this week?"
          className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
        />
      </div>
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Ultimate Goal</h3>
        <textarea
          value={goals.longTerm}
          onChange={(e) => setGoals(prev => ({ ...prev, longTerm: e.target.value }))}
          placeholder="What are your academic goals for this semester?"
          className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
        />
      </div>
    </div>
  </div>
)
};


export default RenderGoals;