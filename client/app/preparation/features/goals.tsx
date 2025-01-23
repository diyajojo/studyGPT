'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { supabase } from '@/app/utils/supabase';

interface RenderGoalsProps {
  subjectId: string;
}

interface GoalsData {
  id: string;
  subject_id: string;
  daily_goals: string | null;
  weekly_goals: string | null;
  long_term_goals: string | null;
  created_at: string;
  updated_at: string;
}

const RenderGoals: React.FC<RenderGoalsProps> = ({ subjectId }) => {
  // State to store form values
  const [goals, setGoals] = useState({
    shortTerm: '',
    longTerm: '',
    todayFocus: ''
  });
  
  // UI state management
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // State to track if a record exists and store its ID
  const [existingRecord, setExistingRecord] = useState<GoalsData | null>(null);

  useEffect(() => {
    const loadExistingGoals = async () => {
      // Early return if no subject ID
      if (!subjectId) {
        console.warn('No subject ID provided');
        return;
      }
  
      try {
        // Subject validation with more detailed error handling
        const { data: subjectExists, error: subjectError } = await supabase
          .from('subjects')
          .select('id')
          .eq('id', subjectId)
          .single();
  
        if (subjectError) {
          // Differentiate between different types of errors
          if (subjectError.code === 'PGRST116') {
            console.error(`Subject with ID ${subjectId} does not exist`);
          } else {
            console.error('Unexpected error validating subject:', subjectError);
          }
          return;
        }
  
        // Fetch goals with more comprehensive query
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('subject_id', subjectId)
          .limit(1)  // Explicitly limit to one record
          .single();
  
        if (error) {
          if (error.code === 'PGRST116') {
            // No existing goals - initialize with empty state
            setGoals({
              shortTerm: '',
              longTerm: '',
              todayFocus: ''
            });
            console.info(`No existing goals found for subject ${subjectId}. Ready to create new goals.`);
            return;
          }
  
          // Log other potential errors
          console.error('Error fetching user goals:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
          return;
        }
  
        // Populate existing goals
        if (data) {
          setGoals({
            shortTerm: data.weekly_goals || '',
            longTerm: data.long_term_goals || '',
            todayFocus: data.daily_goals || ''
          });
          setExistingRecord(data);
        }
  
      } catch (error) {
        // Catch-all for unexpected errors
        console.error('Unexpected error in goal loading process:', error);
      }
    };
  
    // Trigger goal loading when subject ID is available
    if (subjectId) {
      loadExistingGoals();
    }
  }, [subjectId]);
  
  const saveGoals = async () => {
    // Prevent saving if no subject ID
    if (!subjectId) {
      console.error('Cannot save goals: No subject ID');
      setSaveStatus('error');
      return;
    }
  
    setSaveStatus('saving');
  
    try {
      // Validate input before saving
      const sanitizedGoals = {
        daily_goals: goals.todayFocus?.trim() || null,
        weekly_goals: goals.shortTerm?.trim() || null,
        long_term_goals: goals.longTerm?.trim() || null
      };
  
      // Upsert with explicit error handling
      const { data, error } = await supabase
        .from('user_goals')
        .upsert({
          subject_id: subjectId,
          ...sanitizedGoals
        })
        .select()
        .single();
  
      if (error) {
        // Detailed error logging
        console.error('Goal save error:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
  
        // User-friendly error status
        setSaveStatus('error');
        return;
      }
  
      // Successful save
      setExistingRecord(data);
      setSaveStatus('success');
      setIsDirty(false);
  
      // Optional: Log successful save
      console.info('Goals saved successfully for subject', subjectId);
  
    } catch (error) {
      // Unexpected error handling
      console.error('Unexpected error during goal save:', error);
      setSaveStatus('error');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [field]: value
    }));
    setIsDirty(true);
  };

  return (
    <div className="font-noto space-y-6">
      <div className="bg-white/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Daily Goals</h3>
        <textarea
          value={goals.todayFocus}
          onChange={(e) => handleInputChange('todayFocus', e.target.value)}
          placeholder="What specific topics or subjects will you focus on today?"
          className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Weekly Goals</h3>
          <textarea
            value={goals.shortTerm}
            onChange={(e) => handleInputChange('shortTerm', e.target.value)}
            placeholder="What do you want to achieve this week?"
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
          />
        </div>
        <div className="bg-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Ultimate Goal</h3>
          <textarea
            value={goals.longTerm}
            onChange={(e) => handleInputChange('longTerm', e.target.value)}
            placeholder="What are your academic goals for this semester?"
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 min-h-[100px]"
          />
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={saveGoals}
          disabled={saveStatus === 'saving'}
          className="px-8 py-3 rounded-[20px] transition-all duration-300 transform hover:scale-105"
          style={{
            background: saveStatus === 'saving' ? 'rgba(128, 128, 128, 0.5)' : 'rgba(218, 236, 244, 0.49)',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Goals'}
        </button>
        
        {isDirty && (
          <div className="text-center">
            {saveStatus === 'error' && (
              <span className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">
                Error saving goals. Please try again.
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="text-green-500 bg-green-500/10 px-4 py-2 rounded-lg">
                Goals saved successfully!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
};

  export default RenderGoals;