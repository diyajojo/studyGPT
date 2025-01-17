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

  // Load existing goals when component mounts
  useEffect(() => {
    const loadExistingGoals = async () => {
      try {
        // First, verify the subject exists (important for referential integrity)
        const { data: subjectExists, error: subjectError } = await supabase
          .from('subjects')
          .select('id')
          .eq('id', subjectId)
          .single();

        if (subjectError || !subjectExists) {
          console.error('Subject not found:', subjectError);
          return;
        }

        // Load existing goals for this subject
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('subject_id', subjectId)
          .single();

        if (error) {
          // Only log error if it's not a "not found" error
          if (error.code !== 'PGRST116') {
            console.error('Error loading goals:', error);
          }
          
          // If no record exists, create one
          if (error.code === 'PGRST116') {
            const { data: newRecord, error: insertError } = await supabase
              .from('user_goals')
              .insert([{
                subject_id: subjectId,
                daily_goals: null,
                weekly_goals: null,
                long_term_goals: null
              }])
              .select()
              .single();

            if (insertError) {
              console.error('Error creating initial record:', insertError);
              return;
            }

            setExistingRecord(newRecord);
          }
          return;
        }

        // If we found existing data, store it and populate the form
        if (data) {
          setExistingRecord(data);
          setGoals({
            shortTerm: data.weekly_goals || '',
            longTerm: data.long_term_goals || '',
            todayFocus: data.daily_goals || ''
          });
        }
      } catch (error) {
        console.error('Error in loading operation:', error);
      }
    };

    if (subjectId) {
      loadExistingGoals();
    }
  }, [subjectId]);

  const handleInputChange = (field: string, value: string) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [field]: value
    }));
    setIsDirty(true);
  };

  const saveGoals = async () => {
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('user_goals')
        .upsert({
          id: existingRecord?.id,
          subject_id: subjectId,
          daily_goals: goals.todayFocus,
          weekly_goals: goals.shortTerm,
          long_term_goals: goals.longTerm
        });

      if (error) {
        console.error('Error saving goals:', error);
        setSaveStatus('error');
        return;
      }

      setSaveStatus('success');
      setIsDirty(false);
    } catch (error) {
      console.error('Error in save operation:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-6">
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