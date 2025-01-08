'use client';
import Image from 'next/image';
import {Book,Building2,CodeXml,GraduationCap, CalendarDays} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { supabase } from '../utils/supabase';

const UserPage = () => {

  interface UserProfile
  {
    full_name:string;
    college_name:string;
    year:string;
    branch:string;
  }

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('userprofiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setProfile(profile);
      }
    } 
    catch (error)
    {
      console.log('Error fetching profile:', error);
    } 
    finally 
    {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "rgba(18, 87, 116, 1)" }}>
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative" style={{ background: "rgba(18, 87, 116, 1)" }}>
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/bgimg.jpg"
          alt="Background"
          fill
          className="object-cover opacity-10"
          priority
        />
        <div className="absolute inset-0 mix-blend-multiply" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center h-20">
        <div
          className="w-1/2 h-full flex items-center pl-8"
          style={{ background: "rgba(255, 140, 90, 1)" }}
        >
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-gray-800" />
            <div className="text-2xl font-bold">
              <span className="font-montserrat text-white">Study</span>
              <span className="font-montserrat" style={{ color: "rgba(18, 87, 116, 1)" }}>GPT</span>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full bg-white" />
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome back, {profile?.full_name}! 👋
            </h1>
            <p className="text-white/80 text-xl">Ready to continue your learning journey?</p>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center"> {/* Added text-center class */}
              <CardTitle className="text-2xl font-bold text-center" style={{ color: "rgba(18, 87, 116, 1)" }}>
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full" style={{ background: "rgba(255, 140, 90, 0.1)" }}>
                      <Building2 className="h-6 w-6" style={{ color: "rgba(255, 140, 90, 1)" }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">College</label>
                      <p className="text-lg font-medium text-black">{profile?.college_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full" style={{ background: "rgba(255, 140, 90, 0.1)" }}>
                      <CalendarDays className="h-6 w-6" style={{ color: "rgba(255, 140, 90, 1)" }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Year of Study</label>
                      <p className="text-lg font-medium text-black">{profile?.year}th Year</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full" style={{ background: "rgba(255, 140, 90, 0.1)" }}>
                      <GraduationCap className="h-6 w-6" style={{ color: "rgba(255, 140, 90, 1)" }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Student Name</label>
                      <p className="text-lg font-medium text-black">{profile?.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full" style={{ background: "rgba(255, 140, 90, 0.1)" }}>
                      <CodeXml className="h-6 w-6" style={{ color: "rgba(255, 140, 90, 1)" }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Branch</label>
                      <p className="text-lg font-medium text-black">{profile?.branch}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Robot Image */}
      <div className="absolute bottom-0 right-0 z-10 w-32 h-32 md:w-48 md:h-48">
        <Image
          src="/assets/robot.png"
          alt="AI Robot"
          width={600}
          height={600}
          className="object-contain filter hue-rotate-180 brightness-95"
        />
      </div>
    </main>
  );
};

export default UserPage;