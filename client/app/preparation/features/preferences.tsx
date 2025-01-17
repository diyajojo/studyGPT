import React, { useState } from 'react';
import { Laptop, Coffee, GraduationCap, Clock } from 'lucide-react';
import { supabase } from '@/app/utils/supabase';

interface PreferenceCardProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string | null;
  onChange: (option: string) => void;
}

interface RenderPreferencesProps {
  subjectId: string;
}

const PreferenceCard: React.FC<PreferenceCardProps> = ({
  title,
  icon,
  options,
  selected,
  onChange,
}) => {
  return (
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
};

const RenderPreferences: React.FC<RenderPreferencesProps> = ({ subjectId }) => {
  // State to track all preferences
  const [preferences, setPreferences] = useState({
    study_time: '',
    study_env: '',
    break_interval: '',
    learning_style: '',
  });

  // Track whether all preferences have been selected
  const [isComplete, setIsComplete] = useState(false);

  const preferenceOptions = [
    {
      title: "Best Study Time",
      icon: <Clock className="h-5 w-5 text-[#FF8C5A]" />,
      options: ['Early Morning', 'Afternoon', 'Evening', 'Late Night'],
      preferenceKey: 'study_time',
    },
    {
      title: "Study Environment",
      icon: <Laptop className="h-5 w-5 text-[#FF8C5A]" />,
      options: ['Complete Silence', 'Music', 'Coffee Shop', 'Library'],
      preferenceKey: 'study_env',
    },
    {
      title: "Break Interval",
      icon: <Coffee className="h-5 w-5 text-[#FF8C5A]" />,
      options: ['25/5 Pomodoro', '50/10 Split', '90/20 Deep Work', 'Flexible'],
      preferenceKey: 'break_interval',
    },
    {
      title: "Learning Style",
      icon: <GraduationCap className="h-5 w-5 text-[#FF8C5A]" />,
      options: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'],
      preferenceKey: 'learning_style',
    },
  ];

  // Handle individual preference selection
  const handlePreferenceChange = (preferenceKey: string, value: string) => {
    // Update the preferences state
    const updatedPreferences = {
      ...preferences,
      [preferenceKey]: value,
    };
    setPreferences(updatedPreferences);

    // Check if all preferences are selected
    const allSelected = Object.values(updatedPreferences).every(pref => pref !== '');
    setIsComplete(allSelected);

    // If all preferences are selected, save to database
    if (allSelected) {
      saveAllPreferences(updatedPreferences);
    }
  };

  // Function to save all preferences to database
  const saveAllPreferences = async (allPreferences: typeof preferences) => {
    try {
      // Prepare the complete data object for insertion
      const preferenceData = {
        subject_id: subjectId,
        study_time: allPreferences.study_time,
        study_env: allPreferences.study_env,
        break_interval: allPreferences.break_interval,
        learning_style: allPreferences.learning_style,
      };

      // Insert or update all preferences at once
      const { error } = await supabase
        .from('user_preferences')
        .upsert(preferenceData, {
           onConflict: 'subject_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
      } else {
        console.log('All preferences saved successfully!');
      }
    } catch (error) {
      console.error('Error in database operation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preferenceOptions.map(({ title, icon, options, preferenceKey }) => (
          <PreferenceCard
            key={title}
            title={title}
            icon={icon}
            options={options}
            selected={preferences[preferenceKey as keyof typeof preferences]}
            onChange={(value: string) => handlePreferenceChange(preferenceKey, value)}
          />
        ))}
      </div>
      {isComplete && (
        <div className="text-white text-center p-4 bg-green-500/20 rounded-lg">
          Your preferences have been saved!
        </div>
      )}
    </div>
  );
};

export default RenderPreferences;