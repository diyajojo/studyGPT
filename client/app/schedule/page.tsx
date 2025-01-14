'use client';
import React, { useState, useEffect } from 'react';
import { Book, Bell, Calendar, ChevronRight, ChevronDown, School, GraduationCap, UserPen,LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import ModuleTopicsModal from './modal';

interface Profile {
  full_name: string;
  college_name: string;
  branch: string;
  year: string;
}

interface Topic {
  title: string;
  description: string;
}

interface ModuleTopics {
  [key: string]: Topic[];
}

interface Subject 
{
  subject_name: string;
}

const Schedule = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [subjects, setSubjects] = useState<Subject []| null>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const router =useRouter();

  const moduleTopics: ModuleTopics = {
    'Module 1': [
      {
        title: 'Introduction to the Subject',
        description: 'Basic concepts and fundamental principles of the subject.'
      },
      {
        title: 'Key Theories',
        description: 'Major theoretical frameworks and their applications.'
      },
    ],
    'Module 2': [
      {
        title: 'Advanced Concepts',
        description: 'In-depth exploration of complex topics and their relationships.'
      },
      {
        title: 'Practical Applications',
        description: 'Real-world applications and case studies.'
      },
    ],
    'Module 3': [
      {
        title: 'Advanced Concepts',
        description: 'In-depth exploration of complex topics and their relationships.'
      },
      {
        title: 'Practical Applications',
        description: 'Real-world applications and case studies.'
      },
    ], // Add topics for other modules
    'Module 4': [
      {
        title: 'Advanced Concepts',
        description: 'In-depth exploration of complex topics and their relationships.'
      },
      {
        title: 'Practical Applications',
        description: 'Real-world applications and case studies.'
      },
    ],
    'Module 5': [
      {
        title: 'Advanced Concepts',
        description: 'In-depth exploration of complex topics and their relationships.'
      },
      {
        title: 'Practical Applications',
        description: 'Real-world applications and case studies.'
      },
    ],
  };


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];


  const primaryColor = "rgba(255, 140, 90, 1)";
  const backgroundColor = "rgba(18, 87, 116, 1)";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user },error: userError} = await supabase.auth.getUser();

        if (userError)
        {
          console.error('Error fetching user:', userError);
          return;
        }

        if (user) 
          {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError)
          {
            console.error('Error fetching profile:', profileError);
          } 
          else
          {
            setProfile(profileData);
          }
          const { data: subjectsData } = await supabase
            .from('subjects')
            .select('subject_name')
            .eq('user_id', user.id);
          
          if (subjectsData) 
          {
            setSubjects(subjectsData);
          }
        }
      } 
      catch (error)
       {
        console.error('Unexpected error:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
  };

  const handleModuleClick = (module: string): void => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex h- maxscreen bg-[#125774] ">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col justify-between ">
        <div className="p-4" style={{ background: primaryColor }}>
          <div className="flex items-center gap-2 mb-8">
            <Book className="h-6 w-6 text-gray-800" />
            <div className="text-2xl font-bold">
              <span className="font-montserrat">Study</span>
              <span className="font-montserrat" style={{ color: backgroundColor }}>GPT</span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="mb-8 text-center">
      <div className="mx-auto mb-3 rounded-full overflow-hidden">
    <img
      src="/assets/pfp.png"
      alt="Profile"
      height={100}
      width={100}
      className="w-full h-full object-cover"
    />
  </div>
  <h3 className="font-bold text-gray-800 text-xl">{profile?.full_name }</h3>
  </div >
<div className='flex flex-col justify-center items-center font-semibold text-sm  text-gray-800 text-center mt-3' >
<p className=" flex items-center ">
  {/*<School className="h-4 w-4 mr-2" />*/}
  {profile?.college_name }
</p>
<p className=" flex items-center mt-2 ">
  {/*<GraduationCap className="h-4 w-4 mr-2" />*/}
  {profile?.branch }
</p>
<p className="flex items-center mt-2">
 {/* <UserPen className="h-4 w-4 mr-2" />*/}
   {profile?.year}nd year
</p>
</div>
</div>

        {/* Navigation */}
        <nav className="space-y-2 mt-10">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left rounded-lg bg-blue-50 text-blue-900"
            >
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5" />
                <span>My Courses</span>
              </div>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
        <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg z-10">
        {(subjects ?? []).length > 0 ? (
  (subjects ?? []).map((subject, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedSubject(subject.subject_name);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
              >
                {subject.subject_name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No subjects added yet
            </div>
          )}
        </div>
      )}
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-50">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-50">
            <Calendar className="h-5 w-5" />
            <span>Schedule</span>
          </button>
        </nav>
      
        <div className="mb-5 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-black hover:bg-red-400/10 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">WELCOME BACK {profile?.full_name.toLocaleUpperCase() } 👋</h1>
          <button
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Create schedule
          </button>
        </header>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Important Topics */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800"> 📚 IMPORTANT TOPICS</h2>
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
          <ModuleTopicsModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    module={selectedModule}
    topics={moduleTopics[selectedModule] || []}
  />

          {/* Previous Year Questions */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800"> ❓ FREQUENTLY ASKED PREVIOUS YEAR QUESTIONS</h2>
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
              <h2 className="text-lg font-semibold text-gray-800"> 📝 FLASHCARDS</h2>
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

          {/* Calendar */}
          <div className="grid grid-cols-3 gap-6">
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
      </div>
    </div>
  );
};

export default Schedule;