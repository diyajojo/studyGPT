import React, { useState ,useEffect } from 'react';
import { Laptop, Coffee, GraduationCap, Clock } from 'lucide-react';
import { supabase } from '@/app/utils/supabase';

// Define the props type for PreferenceCard
interface PreferenceCardProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string | null;
  onChange: (option: string) => void;
}

// PreferenceCard component
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


const RenderPreferences = () => {
  const [preferences, setPreferences] = useState({
    studyTime: '',
    environment: '',
    breakInterval: '',
    learningStyle: '',
  });

  const [userID,setUserID]=useState<string | null>('');
  
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
            onChange={(value: string) => {
              setPreferences(prev => ({
                ...prev,
                [preferenceKey as keyof typeof preferences]: value,
              }));
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RenderPreferences;