import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import ModuleTopicsModal from './topicsmodal';
import QuestionAnswerModal from './quesmodal';
import FlashcardModal from './flashcardmodal';
import ScheduleModal from './schedulemodal';
import AssignmentCard from './assignmentcard';
import NotificationsModal from './notificationsmodal';

interface Flashcard {
  id: string;
  question_text: string;
  answer_text: string;
  subject_id: string;
  module_no: number;
}

interface Topic {
  id: string;
  topic_name: string;
  subject_id: string;
  module_no: number | string;
}

interface Question {
  id: string;
  question_text: string;
  answer_text: string;
  subject_id: string;
  module_no: number | string;
}

interface Schedule {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_by: string;
}

interface ScheduleActivity {
  id: string;
  schedule_id: string;
  time: string;
  topic: string;
  description: string;
  activity_type: string;
}

interface Assignment {
  id: string;
  schedule_id: string;
  title: string;
  description: string;
  duration: string;
  status: 'pending' | 'completed';
  date: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  daysLeft: number;
  type: 'assignment' | 'schedule';
}

interface SubjectContentProps {
  selectedSubject: {
    id: string;
    subject_name: string;
    openNotifications?: boolean;
  };
}

const SubjectContent: React.FC<SubjectContentProps> = ({ selectedSubject }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isFlashcardsModalOpen, setIsFlashcardsModalOpen] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [existingSchedule, setExistingSchedule] = useState<Schedule | null>(null);
  const [scheduleActivities, setScheduleActivities] = useState<ScheduleActivity[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showScheduleAlert, setShowScheduleAlert] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<{[key: string]: any[]}>({});
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [isDateEventsModalOpen, setIsDateEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
   
    // Function to fetch data from FastAPI and Supabase
    const fetchData = async () => {
      try {
        // Get user session from Supabase
        const { data: { session }, error: userError } = await supabase.auth.getSession();
   
        if (userError) {
          console.error('Error fetching user session:', userError);
          return;
        }
   
        const accessToken = session?.access_token;
        const refreshToken = session?.refresh_token;
   
        if (!accessToken || !refreshToken) {
          console.error('Access or refresh token not available');
          return;
        }
   
        // Prepare request body
        const requestBody = {
          user_id: selectedSubject.id,
          subject: selectedSubject.subject_name,
          token: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        };
   
        console.log('Request Body:', requestBody);
   
        // Fetch from FastAPI
        const response = await fetch('https://studygpt-z5rq.onrender.com/models/get-output-json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
   
        if (!response.ok) {
          const errorData = await response.json();
          console.error('FastAPI response error:', errorData);
          throw new Error('Network response was not ok');
        }
   
        const fastApiData = await response.json();
        console.log('FastAPI data:', fastApiData);
   
        // Fetch topics
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('subject_id', selectedSubject.id)
          .abortSignal(controller.signal);
   
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', selectedSubject.id)
          .abortSignal(controller.signal);
   
        // Fetch flashcards
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('subject_id', selectedSubject.id)
          .abortSignal(controller.signal);
   
        // Add assignments fetching
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('assignments')
            .select('*')
            .eq('subject_id', selectedSubject.id)
            .eq('created_by', user.id)
            .order('date', { ascending: true })
            .abortSignal(controller.signal);
   
          if (!controller.signal.aborted) {
            if (assignmentsError) {
              console.error('Error fetching assignments:', assignmentsError);
            } else {
              setAssignments(assignmentsData || []);
            }
          }
        }
   
        // Notifications fetching
        if (user) {
          const today = new Date();
          const fiveDaysLater = new Date();
          fiveDaysLater.setDate(today.getDate() + 5);
   
          const [assignmentsResponse, schedulesResponse] = await Promise.all([
            supabase
              .from('assignments')
              .select('*')
              .eq('created_by', user.id)
              .eq('subject_id', selectedSubject.id)
              .gte('date', today.toISOString())
              .lte('date', fiveDaysLater.toISOString()),
            supabase
              .from('schedules')
              .select('*')
              .eq('created_by', user.id)
              .eq('subject_id', selectedSubject.id)
              .gte('date', today.toISOString())
              .lte('date', fiveDaysLater.toISOString())
          ]);
   
          if (assignmentsResponse.error || schedulesResponse.error) {
            console.error('Error fetching notifications', assignmentsResponse.error || schedulesResponse.error);
          } else {
            const formattedNotifications: Notification[] = [
              ...assignmentsResponse.data.map(assignment => ({
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                date: assignment.date,
                daysLeft: Math.ceil((new Date(assignment.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                type: 'assignment' as 'assignment'
              })),
              ...schedulesResponse.data.map(schedule => ({
                id: schedule.id,
                title: schedule.title,
                description: schedule.description,
                date: schedule.date,
                daysLeft: Math.ceil((new Date(schedule.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                type: 'schedule' as 'schedule'
              }))
            ].sort((a, b) => a.daysLeft - b.daysLeft);
   
            setNotifications(formattedNotifications);
          }
        }
   
        // Open notifications modal if flag is set
        if (selectedSubject.openNotifications) {
          setIsNotificationsModalOpen(true);
        }
   
        if (!controller.signal.aborted) {
          if (topicsError) {
            console.error('Error fetching topics:', topicsError);
          } else {
            setTopics(topicsData || []);
          }
   
          if (questionsError) {
            console.error('Error fetching questions:', questionsError);
          } else {
            setQuestions(questionsData || []);
          }
   
          if (flashcardsError) {
            console.error('Error fetching flashcards:', flashcardsError);
          } else {
            setFlashcards(flashcardsData || []);
          }
        }
   
        // Calendar events fetching
        const fetchCalendarEvents = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
   
            // Fetch schedules and assignments
            const [scheduleResponse, assignmentResponse] = await Promise.all([
              supabase
                .from('schedules')
                .select('*')
                .eq('subject_id', selectedSubject.id)
                .eq('created_by', user.id)
                .abortSignal(controller.signal),
              supabase
                .from('assignments')
                .select('*')
                .eq('subject_id', selectedSubject.id)
                .eq('created_by', user.id)
                .abortSignal(controller.signal)
            ]);
   
            if (scheduleResponse.error || assignmentResponse.error) {
              console.error(
                'Calendar event fetch errors:', 
                scheduleResponse.error, 
                assignmentResponse.error
              );
              return;
            }
   
            const eventsByDate: { [key: string]: any[] } = {};
   
            // Convert UTC to IST when creating date key
            const createDateKey = (dateString: string) => {
              const utcDate = new Date(dateString);
              // Add IST offset (5 hours and 30 minutes)
              const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
              return istDate.toISOString().split('T')[0];
            };
   
            // Process schedule events
            scheduleResponse.data?.forEach(schedule => {
              if (schedule.date) {
                const dateKey = createDateKey(schedule.date);
                eventsByDate[dateKey] = [
                  ...(eventsByDate[dateKey] || []), 
                  { type: 'schedule', ...schedule }
                ];
              }
            });
   
            // Process assignment events
            assignmentResponse.data?.forEach(assignment => {
              if (assignment.date) {
                const dateKey = createDateKey(assignment.date);
                eventsByDate[dateKey] = [
                  ...(eventsByDate[dateKey] || []), 
                  { type: 'assignment', ...assignment }
                ];
              }
            });
   
            // Debugging: Log the exact events and their dates
            console.log('Calendar Events:', eventsByDate);
   
            setCalendarEvents(eventsByDate);
          } catch (error) {
            console.error('Comprehensive calendar events fetch error:', error);
          }
        };
   
        // Call fetchCalendarEvents after other data fetching
        await fetchCalendarEvents();
   
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Unexpected error fetching data:', error);
        }
      }
    };
    
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
   }, [selectedSubject.id, selectedSubject.openNotifications]);
     



  const getTopicsForModule = (moduleNumber: string): Topic[] => {
    const moduleNum = moduleNumber.split(' ')[1];
    return topics.filter(topic => topic.module_no.toString() === moduleNum);
  };

  const getQuestionsForModule = (moduleNumber: string): Question[] => {
    // Extract just the number from "Module X"
    const moduleNum = moduleNumber.split(' ')[1];
    // Filter questions where module_no matches the number
    return questions.filter(question => question.module_no === moduleNum);
  };

  const getFlashcardsForModule = (moduleNumber: string): Flashcard[] => {
    const moduleNum = moduleNumber.split(' ')[1];
    return flashcards.filter(flashcard => flashcard.module_no.toString() === moduleNum);
  };

  const handleTopicModuleClick = (moduleNumber: string) => {
    setSelectedModule(moduleNumber);
    setIsTopicsModalOpen(true);
  };

  const handleQuestionModuleClick = (moduleNumber: string) => {
    setSelectedModule(moduleNumber);
    setIsQuestionsModalOpen(true);
  };

  const handleFlashcardModuleClick = (moduleNumber: string) => {
    setSelectedModule(moduleNumber);
    setIsFlashcardsModalOpen(true);
  };


  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
  };

  const handleAssignmentStatusUpdate = async (assignmentId: string, newStatus: 'pending' | 'completed') => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error updating assignment status:', error);
        return;
      }

      setAssignments(prev =>
        prev.map(assignment =>
          assignment.id === assignmentId
            ? { ...assignment, status: newStatus }
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };
  
  const renderCalendar = () => {
  const year = new Date().getFullYear();
  const firstDay = new Date(year, currentMonth, 1);
  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();

  // Get day of week in IST
  const istFirstDay = new Date(firstDay.getTime() + (5.5 * 60 * 60 * 1000));
  const adjustedFirstDay = istFirstDay.getDay() === 0 ? 6 : istFirstDay.getDay() - 1;

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array(adjustedFirstDay).fill(null);

  return [...paddingDays, ...calendarDays].map((day, index) => {
    if (day === null) {
      return <div key={`empty-${index}`} />;
    }
  
    const currentDate = new Date(year, currentMonth, day);
    // Convert to IST for comparison
    const istDate = new Date(currentDate.getTime() + (5.5 * 60 * 60 * 1000));
    const dateKey = istDate.toISOString().split('T')[0];
    
    const hasEvents = !!calendarEvents[dateKey] && calendarEvents[dateKey].length > 0;
    const isValidDay = day !== null;
  
      const buttonClasses = isValidDay && hasEvents
        ? "text-center p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
        : "text-center p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200";
  
      return isValidDay ? (
        <button
          key={dateKey}
          className={buttonClasses}
          onClick={() => {
            if (hasEvents) {
              setSelectedDate(currentDate);
              setSelectedDateEvents(calendarEvents[dateKey]);
              setIsDateEventsModalOpen(true);
            }
          }}
        >
          {day}
        </button>
      ) : null;
    }).filter(Boolean); // Remove any null entries
  };
  
 

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-noto text-2xl font-semibold text-white">
          {selectedSubject.subject_name.toUpperCase()} - OVERVIEW 📚
        </h1>
        <button
  onClick={() => setIsScheduleModalOpen(true)}
  className="font-noto px-4 py-2 rounded-lg text-white"
  style={{ backgroundColor: "rgba(255, 140, 90, 1)" }}
>
  Create/View schedule
</button>
      </header>

      <div className="space-y-6">

        {/* Important Topics */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-noto text-lg font-semibold text-gray-800">📚 IMPORTANT TOPICS</h2>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => {
              const moduleTopics = getTopicsForModule(module);
              return (
                <button
                  key={module}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
                  onClick={() => handleTopicModuleClick(module)}
                >
                  {module}
                  {moduleTopics.length > 0 && (
                    <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {moduleTopics.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>


        
              {/* Previous Year Questions Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-noto text-lg font-semibold text-gray-800">❓ REPEATED PREVIOUS YEAR QUESTIONS</h2>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => {
              const moduleQuestions = getQuestionsForModule(module);
              return (
                <button
                  key={module}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
                  onClick={() => handleQuestionModuleClick(module)}
                >
                  {module}
                  {moduleQuestions.length > 0 && (
                    <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {moduleQuestions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        
        {/* Flashcards */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-noto text-lg font-semibold text-gray-800">📝 FLASHCARDS</h2>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
          {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => {
  const moduleFlashcards = getFlashcardsForModule(module);
  return (
    <button
      key={module}
      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
      onClick={() => handleFlashcardModuleClick(module)}
    >
      {module}
      {moduleFlashcards.length > 0 && (
        <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-green-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
          {moduleFlashcards.length}
        </span>
      )}
    </button>
  );
})}
</div></div>

        {/* Calendar and Assignments Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm max-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePreviousMonth} className="text-gray-600 font-semibold hover:text-gray-800">
                &lt;
              </button>
              <h3 className="font-roboto font-semibold text-gray-800">{months[currentMonth].toLocaleUpperCase()}</h3>
              <button onClick={handleNextMonth} className="text-gray-600 font-semibold hover:text-gray-800">
                &gt;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
    <div key={day} className="text-center text-sm text-black">{day}</div>
  ))}
  {renderCalendar()}
</div>
</div>

         
           {/* Assignments Section - Modified with scrolling */}
           <div className="bg-white p-6 rounded-xl shadow-sm max-h-[400px] flex flex-col">
            <h2 className="font-noto text-lg font-semibold text-gray-800 mb-4">Assignments</h2>
            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 pr-2"> {/* Added right padding for scrollbar spacing */}
                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No assignments yet</p>
                ) : (
                  assignments.map(assignment => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onStatusUpdate={(id, status) => handleAssignmentStatusUpdate(id, status as "pending" | "completed")}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <NotificationsModal 
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
      />

      <ModuleTopicsModal
        isOpen={isTopicsModalOpen}
        onClose={() => setIsTopicsModalOpen(false)}
        module={selectedModule}
        topics={getTopicsForModule(selectedModule).map(topic => ({
          ...topic,
          module_number: Number(topic.module_no)
        }))}
      />
<QuestionAnswerModal
        isOpen={isQuestionsModalOpen}
        onClose={() => setIsQuestionsModalOpen(false)}
        module={selectedModule}
        questions={getQuestionsForModule(selectedModule).map(question => ({
          ...question,
          module_no: Number(question.module_no)
        }))}
      />
      <FlashcardModal
  isOpen={isFlashcardsModalOpen}
  onClose={() => setIsFlashcardsModalOpen(false)}
  module={selectedModule}
  flashcards={getFlashcardsForModule(selectedModule).map(flashcard => ({
    ...flashcard,
    module_no: Number(flashcard.module_no)
  }))}
/>
<ScheduleModal 
  isOpen={isScheduleModalOpen}
  onClose={() => setIsScheduleModalOpen(false)}
  subjectId={selectedSubject.id}
  subjectName={selectedSubject.subject_name}
  topics={topics.map(topic => ({
    ...topic,
    module_number: Number(topic.module_no)
  }))}
  questions={questions.map(question => ({
    ...question,
    module_no: Number(question.module_no)
  }))}
  flashcards={flashcards.map(flashcard => ({
    ...flashcard,
    module_no: Number(flashcard.module_no)
  }))}
/>
    </div>
  );
};

// Convert IST to UTC before saving to database
const convertISTtoUTC = (istDateString: string): string => {
  const istDate = new Date(istDateString);
  // Subtract 5 hours and 30 minutes to convert IST to UTC
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
  return utcDate.toISOString();
};

// Convert UTC to IST when displaying from database
const convertUTCtoIST = (utcDateString: string): Date => {
  const utcDate = new Date(utcDateString);
  // Add 5 hours and 30 minutes to convert UTC to IST
  return new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
};

export default SubjectContent;