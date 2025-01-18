import React, { useState, useEffect,useRef } from 'react';
import { ChevronRight,BookOpen,Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import ModuleTopicsModal from './modal';

interface Topic {
  id: string;
  topic_name: string;
  subject_id: string;
  module_no: number;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const abortControllerRef = useRef<AbortController | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Create new AbortController for this effect instance
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchTopics = async () => {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('subject_id', selectedSubject.id)
          .abortSignal(controller.signal);

        // Only update state if the request wasn't aborted
        if (!controller.signal.aborted) {
          if (error) {
            console.error('Error fetching topics:', error);
          } else {
            setTopics(data || []);
          }
        }
      } catch (error) {
        // Only log error if it's not an abort error
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Unexpected error fetching topics:', error);
        }
      }
    };

    fetchTopics();

    // Cleanup: abort any ongoing request when component unmounts or selectedSubject changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedSubject.id]); // Only depend on selectedSubject.id

  const getTopicsForModule = (moduleNumber: string): Topic[] => {
    // Extract just the number from "Module X"
    const moduleNum = moduleNumber.split(' ')[1];
    // Filter topics where module_no matches our target module number
    return topics.filter(topic => topic.module_no.toString() === moduleNum);
  };

  const handleModuleClick = (moduleNumber: string) => {
    const filteredTopics = getTopicsForModule(moduleNumber);
    console.log(`Topics for ${moduleNumber}:`, filteredTopics);
    setSelectedModule(moduleNumber);
    setIsModalOpen(true);
  };

  const EmptyModuleState = () => (
    <div className="py-8 px-4 text-center">
      <div className="flex justify-center mb-4">
        <Sparkles className="h-12 w-12 text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        You're in for a treat! 🎉
      </h3>
      <p className="text-gray-600 mb-4">
        This module is special - it's so straightforward that it doesn't need any important topics highlighted.
        You're already a step ahead! 
      </p>
      <div className="flex items-center justify-center gap-2 text-purple-600">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm font-medium">Ready to explore the basics!</span>
      </div>
    </div>
  );


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
            {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => (
              <button
                key={module}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => handleModuleClick(module)}
              >
                {module}
              </button>
            ))}
          </div>
        </div>

        {/* Previous Year Questions */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">❓ REPEATED PREVIOUS YEAR QUESTIONS</h2>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => (
              <button
                key={module}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {module}
              </button>
            ))}
          </div>
        </div>
        
        {/* Flashcards */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📝 FLASHCARDS</h2>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'].map((module) => (
              <button
                key={module}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {module}
              </button>
            ))}
          </div>
        </div>

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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        module={selectedModule}
        topics={getTopicsForModule(selectedModule).map(topic => ({
          ...topic,
          module_number: Number(topic.module_no)
        }))}
        EmptyStateComponent={EmptyModuleState}
      />
    </div>
  );
};


export default SubjectContent;