'use client';
import React, { useState, useEffect } from 'react';
import { Book, Bell, Calendar, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import EmptyState from './components/emptystate';
import SubjectContent from './components/subjectcontent';

interface Profile {
  full_name: string;
  college_name: string;
  branch: string;
  year: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

const Schedule = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const router = useRouter();

  const primaryColor = "rgba(255, 140, 90, 1)";
  const backgroundColor = "rgba(18, 87, 116, 1)";

  useEffect(() => {
    // Create a new AbortController instance
    const abortController = new AbortController();
    
    // Flag to track if the component is mounted
    let isMounted = true;

    const fetchUserProfile = async () => {
      try 
      {
        // Get the user data with the signal from AbortController
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // Return early if the request was aborted or component unmounted
        if (!isMounted) return;

        if (userError)
        {
          console.error('Error fetching user:', userError);
          return;
        }

        if (user) {
          // Execute both profile and subjects requests in parallel
          const [profileResponse, subjectsResponse] = await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single(),
            supabase
              .from('subjects')
              .select('id, subject_name')
              .eq('user_id', user.id)
          ]);

          // Check if component is still mounted before updating state
          if (!isMounted) return;

          // Handle profile response
          if (profileResponse.error) {
            console.error('Error fetching profile:', profileResponse.error);
          } 
          else 
          {
            setProfile(profileResponse.data);
          }

          // Handle subjects response
          if (subjectsResponse.error)
             {
            console.error('Error fetching subjects:', subjectsResponse.error);
          } else 
          {
            setSubjects(subjectsResponse.data || []);
            console.log("fetched subjects:",subjectsResponse.data);
          }
        }
      } catch (error) 
      {
        // Only log errors if the component is still mounted and the request wasn't aborted
        if (isMounted && error !== 'AbortError') {
          console.error('Unexpected error:', error);
        }
      }
    };

    // Execute the fetch function
    fetchUserProfile();

    // Cleanup function to run when the component unmounts or when the effect is re-run
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // Empty dependency array means this effect runs once on mount


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex h-minscreen bg-[#125774]">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
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
            <h3 className="font-bold text-gray-800 text-xl">{profile?.full_name}</h3>
          </div>
          <div className="flex flex-col justify-center items-center font-semibold text-sm text-gray-800 text-center mt-3">
            <p>{profile?.college_name}</p>
            <p className="mt-2">{profile?.branch}</p>
            <p className="mt-2">{profile?.year}nd year</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 mt-10 p-4">
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
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject);
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
         {/* <button className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-50">
            <Calendar className="h-5 w-5" />
            <span>Schedule</span>
          </button> */}
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
      <div className="flex-1 p-8 bg-[#125774]">
        {selectedSubject ? <SubjectContent selectedSubject={selectedSubject} /> : <EmptyState />}
      </div>
    </div>
  );
};

export default Schedule;