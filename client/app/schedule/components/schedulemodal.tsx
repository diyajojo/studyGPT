import React, { useState } from 'react';
import { Loader2, Calendar, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/app/utils/supabase';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';

// Define interfaces for our data structures
interface ScheduleActivity {
  time: string;
  topic: string;
  description: string;
  type: string;
}

interface ScheduleDay {
  date: string;
  display_date: string;
  activities: ScheduleActivity[];
}

interface Assignment {
  date: string;
  display_date: string;
  title: string;
  description: string;
  duration: string;
}

interface ScheduleResponse {
  schedule: ScheduleDay[];
  assignments: Assignment[];
}

interface UserPreferences {
  study_time: string;
  study_env: string;
  break_interval: number;
  learning_style: string;
}

interface UserGoals {
  daily_goals: string[];
  weekly_goals: string[];
  long_term_goals: string[];
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  topics: Array<{ id: string; topic_name: string; subject_id: string; module_no: number | string }>;
  questions: Array<{ id: string; question_text: string; answer_text: string; subject_id: string; module_no: number | string }>;
  flashcards: Array<{ id: string; question_text: string; answer_text: string; subject_id: string; module_no: number }>;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  topics,
  questions,
  flashcards
}) => {
  // State management for component
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [saved, setSaved] = useState(false);

  // Fetch user preferences from Supabase
  const fetchUserPreferences = async (): Promise<UserPreferences | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('subject_id', subjectId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }

    return data;
  };

  // Fetch user goals from Supabase
  const fetchUserGoals = async (): Promise<UserGoals | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('subject_id', subjectId)
      .single();

    if (error) {
      console.error('Error fetching goals:', error);
      return null;
    }

    return data;
  };

  // Generate study schedule based on user preferences and goals
  const generateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const preferences = await fetchUserPreferences();
      const goals = await fetchUserGoals();

      if (!preferences || !goals) {
        throw new Error('Please set up your preferences and goals first');
      }

      const requestData = {
        preferences: {
          study_time: preferences.study_time,
          study_environment: preferences.study_env,
          break_interval: preferences.break_interval,
          learning_style: preferences.learning_style
        },
        goals: {
          daily: goals.daily_goals,
          weekly: goals.weekly_goals,
          longTerm: goals.long_term_goals
        },
        content: {
          subject: subjectName,
          topics: topics,
          questions: questions,
          flashcards: flashcards
        }
      };

      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate schedule');
      }

      const data = await response.json();
      setScheduleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  // Save the generated schedule to Supabase
  const handleKeepSchedule = async () => {
    if (!scheduleData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Save schedules
      const { data: scheduleInserts, error: scheduleError } = await supabase
        .from('schedules')
        .insert(
          scheduleData.schedule.map(day => ({
            subject_id: subjectId,
            date: day.date,
            activities: day.activities
          }))
        )
        .select();

      if (scheduleError) throw scheduleError;

      // Save assignments
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert(
          scheduleData.assignments.map(assignment => ({
            subject_id: subjectId,
            schedule_id: scheduleInserts[0].id,
            date: assignment.date,
            title: assignment.title,
            description: assignment.description,
            duration: assignment.duration,
            status: 'pending'
          }))
        );

      if (assignmentError) throw assignmentError;

      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError('Failed to save schedule and assignments');
      console.error('Save error:', err);
    }
  };

  // Handle modal close with cleanup
  const handleClose = () => {
    setScheduleData(null);
    setError(null);
    setSaved(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Study Schedule - {subjectName}</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Schedule and assignments saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {!scheduleData && !loading && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Ready to generate your personalized study schedule?
              </p>
              <Button onClick={generateSchedule}>
                Generate Schedule
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Generating your schedule...</span>
            </div>
          ) : scheduleData ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                  <div className="space-y-4">
                    {scheduleData.schedule.map((day, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                          {day.display_date}
                        </h3>
                        <div className="space-y-2">
                          {day.activities.map((activity, actIndex) => (
                            <div key={actIndex} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                              <div className="flex-1">
                                <p className="font-medium text-gray-700">{activity.time}</p>
                                <p className="text-gray-600">{activity.topic}</p>
                                <p className="text-sm text-gray-500">{activity.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="assignments">
                  <div className="space-y-4">
                    {scheduleData.assignments.map((assignment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {assignment.display_date}
                          </h3>
                          <span className="text-sm font-medium text-gray-600">
                            {assignment.duration}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <h4 className="font-medium text-gray-700">{assignment.title}</h4>
                          <p className="text-gray-600 mt-1">{assignment.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end mt-6 space-x-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleKeepSchedule}>
                  Keep This Schedule
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;