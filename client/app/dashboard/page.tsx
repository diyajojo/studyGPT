'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {Book} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import Loader from '../components/loader';

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

  const primaryColor = "rgba(255, 140, 90, 1)";
  const backgroundColor = "rgba(18, 87, 116, 1)";

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
    return <Loader/>;
  }

  return (
    <section className="bg-white">
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
      <div className="relative flex items-end rounded-full px-4 pb-10 pt-60 sm:pb-16 md:justify-center lg:pb-24 bg-green-50 sm:px-6 lg:px-8">
        <div className="absolute inset-0 rounded-full">
          <img
            className="object-cover w-full h-full rounded-r-xl"
            src="https://i.pinimg.com/736x/ee/e5/47/eee5478efb6b88e83aa554c82716d99f.jpg"
            alt="Authentication background"
          />
        </div>
        <div className="relative flex justify-center items-center"></div>
      </div>

      <div 
        className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 sm:py-16 lg:py-24"
        style={{ 
          backgroundColor: backgroundColor, 
          backgroundImage:'url("/assets/authpage.png")',
          backgroundSize:'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full xl:max-w-xl xl:mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Logo Section */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Book className="h-8 w-8 text-white" />
              <div className="font-josefinSans text-3xl font-bold">
                <span className="text-white">Study</span>
                <span className="font-montserrat" style={{ color: primaryColor }}>GPT</span>
              </div>
            </div>

            {/* Welcome Header */}
            <div className="text-center">
              <h2 className="font-oswald text-4xl font-extrabold text-white mb-3">
                Welcome Back, Learner
              </h2>
              <p className="font-roboto text-gray-300 text-center max-w-sm mx-auto">
                Unlock your study potential with StudyGPT
                <span className="text-sm mt-1 block text-gray-400">
                  Your personalized AI-powered learning companion for academic excellence
                </span>
              </p>
            </div>

            <div className="w-full max-w-xl mx-auto">
              <Card 
                className="w-full bg-white/95 backdrop-blur-sm shadow-2xl border-none rounded-3xl"
              >
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex justify-center mb-4">
                    <Book 
                      className="h-12 w-12" 
                      style={{ color: backgroundColor }}
                    />
                  </div>
                  <CardTitle 
                    className="text-4xl font-bold mb-2" 
                    style={{ color: backgroundColor }}
                  >
                    Complete Your Profile
                  </CardTitle>
                  <p className="text-gray-600 mt-2 text-lg">
                    Help us personalize your learning journey
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Full Name */}
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
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      {/* College Name */}
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
                          placeholder="Your college name"
                          required
                        />
                      </div>

                      {/* Year of Study */}
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
                          <option value="" className="text-gray-500">Select Year</option>
                          <option value="1" className="text-black">1st Year</option>
                          <option value="2" className="text-black">2nd Year</option>
                          <option value="3" className="text-black">3rd Year</option>
                          <option value="4" className="text-black">4th Year</option>
                        </select>
                      </div>

                      {/* Branch */}
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
                          placeholder="Your academic branch"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-12 mt-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      style={{ 
                        backgroundColor: primaryColor,
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
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

export default Dashboard;