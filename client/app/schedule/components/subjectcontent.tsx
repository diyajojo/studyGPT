import React, { useState, useEffect,useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import ModuleTopicsModal from './topicsmodal';
import QuestionAnswerModal from './quesmodal';
import FlashcardModal from './flashcardmodal';
import ScheduleModal from './schedulemodal';

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

interface SubjectContentProps
 {
  selectedSubject: {
    id: string;
    subject_name: string;
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

      if (!response.ok) 
      {
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
          console.log("questions are", questionsData);
        }

        if (flashcardsError) {
          console.error('Error fetching flashcards:', flashcardsError);
        } else {
          setFlashcards(flashcardsData || []);
        }
      }
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
}, [selectedSubject.id]);



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

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {selectedSubject.subject_name.toUpperCase()} - OVERVIEW 📚
        </h1>
        <button
  onClick={() => setIsScheduleModalOpen(true)}
  className="px-4 py-2 rounded-lg text-white"
  style={{ backgroundColor: "rgba(255, 140, 90, 1)" }}
>
  Create schedule
</button>
      </header>

      <div className="space-y-6">

        {/* Important Topics */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📚 IMPORTANT TOPICS</h2>
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
            <h2 className="text-lg font-semibold text-gray-800">❓ REPEATED PREVIOUS YEAR QUESTIONS</h2>
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
            <h2 className="text-lg font-semibold text-gray-800">📝 FLASHCARDS</h2>
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
          <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePreviousMonth} className="text-gray-600 font-semibold hover:text-gray-800">
                &lt;
              </button>
              <h3 className="font-semibold text-gray-800">{months[currentMonth].toLocaleUpperCase()}</h3>
              <button onClick={handleNextMonth} className="text-gray-600 font-semibold hover:text-gray-800">
                &gt;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <div key={day} className="text-center text-sm text-black">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <button
                  key={i}
                  className="text-center p-2 rounded-full bg-red-100 text-red-600"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assignments</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Chemistry</h4>
                  <p className="text-sm text-gray-500">14 Jan, 12:00 PM</p>
                </div>
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">In progress</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Physics</h4>
                  <p className="text-sm text-gray-500">12 Jan, 11:30 AM</p>
                </div>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Completed</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">LSD</h4>
                  <p className="text-sm text-gray-500">16 Jan, 7:00 PM</p>
                </div>
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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


export default SubjectContent;