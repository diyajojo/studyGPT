'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {Book} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';


const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    college_name: '',
    year: '',
    branch: '',
  });
  const [currentUser, setCurrentUser] = useState<null | User>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) 
      {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile)
        {
          router.push('/user');
        } 
        else 
        {
          setLoading(false);
        }
      }
    } 
    catch (error) 
    {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentUser) {
      console.error('No user found');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: currentUser.id,
            full_name: formData.full_name,
            college_name: formData.college_name,
            year: formData.year,
            branch: formData.branch  
          }
        ]);

      if (error) throw error;
      
      router.push('/user');
    } 
    catch (error)
    {
      console.error('Error saving profile:', error);
      setLoading(false);
    }
  };

  const handleChange = (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      {/* Rest of the JSX remains the same */}
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

      <div className="relative z-10 min-h-[calc(100vh-5rem)] flex justify-center items-center px-4">
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold" style={{ color: "rgba(18, 87, 116, 1)" }}>
              Complete Your Profile
            </CardTitle>
            <p className="text-gray-600 mt-2 mb-8">Help us personalize your learning experience</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    College Name
                  </label>
                  <input
                    type="text"
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Year of Study
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full h-12 mt-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                style={{ 
                  backgroundColor: "rgba(255, 140, 90, 1)",
                  color: 'white'
                }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-0 right-0 z-10 w-32 h-32 md:w-48 md:h-48">
        <Image
          src="/assets/robot.png"
          alt="AI Robot"
          width={600}
          height={600}
          className="object-contain filter hue-rotate-180 brightness-95"
          priority
        />
      </div>
    </main>
  );
};

export default Dashboard;