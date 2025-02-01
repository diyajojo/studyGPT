import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, CheckCircle, X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import {supabase} from '../../utils/supabase';

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
  
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [saved, setSaved] = useState(false);
  const [hasExistingSchedule, setHasExistingSchedule] = useState(false);
  const [existingScheduleData, setExistingScheduleData] = useState<ScheduleResponse | null>(null);

  // Time Zone Conversion Utility Functions
  const convertISTtoUTC = (istDateString: string): string => {
    const istDate = new Date(istDateString);
    const utcDate = new Date(istDate.getTime() - (5 * 60 + 30) * 60 * 1000);
    return utcDate.toISOString();
  };

  const convertUTCtoIST = (utcDateString: string): Date => {
    const utcDate = new Date(utcDateString);
    return new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000);
  };

  // Existing methods remain the same
  const formatTime = (timeString: string) => {
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  // Check for existing schedule on component mount
  useEffect(() => {
    if (isOpen) {
      checkExistingSchedule();
    }
  }, [isOpen, subjectId]);

  // Modify existing methods to use time zone conversion
  const checkExistingSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('created_by', user.id);

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('created_by', user.id);

      if (scheduleError || assignmentError) throw scheduleError || assignmentError;

      if (scheduleData?.length > 0 || assignmentData?.length > 0) {
        setHasExistingSchedule(true);
        
        const formattedSchedule = formatDatabaseDataToScheduleResponse(scheduleData, assignmentData);
        setExistingScheduleData(formattedSchedule);
      }
    } catch (err) {
      console.error('Error checking existing schedule:', err);
      setError('Failed to check existing schedule');
    }
  };

  const formatDatabaseDataToScheduleResponse = (scheduleData: any[], assignmentData: any[]): ScheduleResponse => {
    const scheduleByDate = scheduleData.reduce((acc: any, activity: any) => {
      const istDate = convertUTCtoIST(activity.date);
      const dateKey = istDate.toISOString().split('T')[0];

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          display_date: istDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          activities: []
        };
      }
      
      acc[dateKey].activities.push({
        time: `${formatTime(activity.start_time)} - ${formatTime(activity.end_time)}`,
        topic: activity.title,
        description: activity.description,
        type: 'study'
      });
      
      return acc;
    }, {});

    const formattedAssignments = assignmentData.map(assignment => ({
      date: convertUTCtoIST(assignment.date).toISOString().split('T')[0],
      display_date: convertUTCtoIST(assignment.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      title: assignment.title,
      description: assignment.description,
      duration: assignment.duration
    }));

    return {
      schedule: Object.values(scheduleByDate),
      assignments: formattedAssignments
    };
  };

  // Fetch user preferences and goals (methods remain the same)
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

  const generateSchedule = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const preferences = await fetchUserPreferences();
      const goals = await fetchUserGoals();
  
      if (!preferences || !goals) {
        throw new Error('Please set up your preferences and goals first');
      }
  
      // Ensure goals are arrays, even if they might be strings or undefined
      const ensureArray = (input: string | string[] | undefined): string[] => {
        if (!input) return [];
        return Array.isArray(input) ? input : [input];
      };
  
      const requestData = {
        preferences: {
          study_time: preferences.study_time,
          study_environment: preferences.study_env,
          break_interval: preferences.break_interval,
          learning_style: preferences.learning_style
        },
        goals: {
          daily: ensureArray(goals.daily_goals),
          weekly: ensureArray(goals.weekly_goals),
          longTerm: ensureArray(goals.long_term_goals)
        },
        content: {
          subject: subjectName,
          topics: topics,
          questions: questions || [],
          flashcards: flashcards || []
        }
      };
  
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
  
      const data = await response.json();
  
      // More robust error checking
      if (!response.ok) {
        console.error('Schedule generation error:', data);
        throw new Error(data.error || 'Failed to generate schedule');
      }
  
      // Additional validation
      if (!data.schedule || !data.assignments) {
        throw new Error('Invalid schedule response');
      }
  
      console.log('Generated schedule:', data);
      setScheduleData(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while generating the schedule';
      
      setError(errorMessage);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeepSchedule = async () => {
    if (!scheduleData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      const parseTimeRange = (timeString: string) => {
        const [startStr, endStr] = timeString.split(' - ');
        
        const convertTo24Hour = (timeStr: string) => {
          const [time, modifier] = timeStr.split(' ');
          let [hours, minutes] = time.split(':');
          
          let hour = parseInt(hours, 10);
          
          if (modifier === 'PM' && hour < 12) {
            hour += 12;
          }
          if (modifier === 'AM' && hour === 12) {
            hour = 0;
          }
          
          const formattedHour = hour.toString().padStart(2, '0');
          return `${formattedHour}:${minutes}:00`;
        };
  
        return {
          start_time: convertTo24Hour(startStr),
          end_time: convertTo24Hour(endStr)
        };
      };
  
      const scheduleActivities = scheduleData.schedule.flatMap(day => 
        day.activities.map(activity => {
          const { start_time, end_time } = parseTimeRange(activity.time);
          return {
            subject_id: subjectId,
            date: convertISTtoUTC(day.date),
            start_time,
            end_time,
            title: activity.topic,
            description: activity.description,
            created_by: user.id
          };
        })
      );
  
      const assignmentsToInsert = scheduleData.assignments.map(assignment => ({
        subject_id: subjectId,
        date: convertISTtoUTC(assignment.date),
        title: assignment.title,
        description: assignment.description,
        duration: assignment.duration,
        status: 'pending',
        created_by: user.id
      }));
  
      if (scheduleActivities.length > 0) {
        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert(scheduleActivities);
  
        if (scheduleError) {
          console.error('Schedule insertion error:', scheduleError);
          throw new Error('Failed to create schedule activities');
        }
      }
  
      if (assignmentsToInsert.length > 0) {
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentsToInsert);
  
        if (assignmentError) {
          console.error('Assignment insertion error:', assignmentError);
          throw new Error('Failed to create assignments');
        }
      }
  
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedule';
      setError(errorMessage);
      console.error('Save error:', err);
    }
  };
  
  // Render methods remain the same as in the original implementation
  const renderScheduleContent = (data: ScheduleResponse) => (
    <div className="space-y-4">
      {data.schedule.map((day, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-noto font-semibold text-lg text-gray-800 mb-2">
            {day.display_date}
          </h3>
          <div className="space-y-2">
            {day.activities.map((activity, actIndex) => (
              <div key={actIndex} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="font-noto font-medium text-gray-700">{activity.time}</p>
                  <p className="font-noto text-gray-600">{activity.topic}</p>
                  <p className="font-noto text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAssignmentsContent = (data: ScheduleResponse) => (
    <div className="space-y-4">
      {data.assignments.map((assignment, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="font-noto flex justify-between items-start mb-2">
            <h3 className="font-noto font-semibold text-lg text-gray-800">
              {assignment.display_date}
            </h3>
            <span className="font-noto text-sm font-medium text-gray-600">
              {assignment.duration}
            </span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="font-noto font-medium text-gray-700">{assignment.title}</h4>
            <p className="fonto-noto text-gray-600 mt-1">{assignment.description}</p>
          </div>
        </div>
      ))}
    </div>
  );

 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
        </button>

        <div className="p-6">
          <div className="mb-8 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Study Schedule - {subjectName.toLocaleUpperCase()}
            </h2>
            <p className="mt-2 text-gray-600">
              {hasExistingSchedule 
                ? 'View your current study schedule and assignments' 
                : 'Plan and organize your study sessions effectively'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="mb-6 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Schedule and assignments saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Show different content based on whether schedule exists */}
          {hasExistingSchedule ? (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-blue-600">
                    Viewing your current schedule and assignments
                  </p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
                  <TabsTrigger value="schedule" className="text-lg py-3">
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="text-lg py-3">
                    Assignments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                  {renderScheduleContent(existingScheduleData!)}
                </TabsContent>

                <TabsContent value="assignments">
                  {renderAssignmentsContent(existingScheduleData!)}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // Original content for generating new schedule
            <>
              {!scheduleData && !loading && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl text-gray-600 mb-6">
                    Ready to generate your personalized study schedule?
                  </p>
                  <Button 
                    onClick={generateSchedule}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    Generate Schedule
                  </Button>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-lg text-gray-600">
                    Generating your schedule...
                  </span>
                </div>
              )}

              {scheduleData && (
                <>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
                      <TabsTrigger value="schedule" className="font-noto text-lg py-3">
                        Schedule
                      </TabsTrigger>
                      <TabsTrigger value="assignments" className="font-noto text-lg py-3">
                        Assignments
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule">
                      {renderScheduleContent(scheduleData)}
                    </TabsContent>

                    <TabsContent value="assignments">
                      {renderAssignmentsContent(scheduleData)}
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end mt-8 space-x-4 border-t pt-6">
                    <Button
                      variant="outline"
                      onClick={generateSchedule}
                      className="px-6 py-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Regenerate Schedule
                    </Button>
                    <Button
                      onClick={handleKeepSchedule}
                      className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Keep This Schedule
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;