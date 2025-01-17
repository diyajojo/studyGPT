'use client';
import React, { useState, useEffect } from 'react';
import {
   Target, Settings, Gamepad2,Book
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import RenderPreferences from './features/preferences';
import RenderGoals from './features/goals';
import RenderGames from './features/games';

const StudyPrepHub = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('preferences');
  const [subjectId, setSubjectId] = useState<string>('');

  const handleButtonClick = () => {
    router.push('/schedule');
  };

  useEffect(() => {
    // Create an AbortController instance
    const abortController = new AbortController();
    let isMounted = true;

    const fetchTokens = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isMounted) {
          return;
        }

        //console.log("access token:", session.access_token);
        //console.log("refresh token:", session.refresh_token);

        try {
          const response = await fetch('https://studygpt-z5rq.onrender.com/models/get-current-subject', {
            method: 'POST',
            headers: {
              'Content-type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            }),
            signal: abortController.signal // Add abort signal to fetch
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Token verification failed:', response.status, errorText);
            throw new Error(`Token verification failed: ${response.status}`);
          }

          if (isMounted) 
           {
            const res = await response.json();
            console.log("RESPONSE FROM FAST API REQUEST:", res);
            setSubjectId(res.subject_id);
            console.log(subjectId);
          }
        } catch (error) {
          if (error === 'AbortError') {
            console.log('Fetch aborted');
            return;
          }
          console.log("error sending POST API REQUEST:", error);
        }
      } catch (error) {
        if (isMounted) {
          console.log("ERROR IN FETCHING SESSION:", error);
        }
      }
    };

    fetchTokens();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#125774] relative overflow-hidden">
       <nav className="relative z-10 flex items-center h-20 mb-10">
        <div
          className="w-1/2 h-full flex items-center pl-8"
          style={{ background: "rgba(255, 140, 90, 1)" }}
        >
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-gray-800" />
            <div className="text-2xl font-bold">
              <span className="font-montserrat text-white">Study</span>
              <span className="font-montserrat" style={{ color: "rgba(18, 87, 116, 1)" }}>GPT</span>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full bg-white" />
      </nav>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Prepare for Success
          </h1>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8 ">
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
            {activeTab === 'preferences' && <RenderPreferences subjectId={subjectId} />}
            {activeTab === 'goals' && <RenderGoals subjectId={subjectId}/>}
            {activeTab === 'games' && <RenderGames />}
          </div>
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
  );
};

export default StudyPrepHub;