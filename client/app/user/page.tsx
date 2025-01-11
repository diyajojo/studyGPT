'use client'; // Correct directive for Next.js app

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Upload, Book } from 'lucide-react';

const UserPage = () => {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#125774]">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#125774] relative overflow-hidden">
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

      {/* Main Content */}
      <div className="container mx-auto relative">
        {/* Welcome Section */}
        <div className="flex items-center gap-0 mt-20">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white">
            <Image
              src="/assets/pfp.png"
              alt="Profile Picture"
              width={128}
              height={128}
              className="object-cover rounded-full"
            />
          </div>

          <div className="flex flex-col">
            <div
              className="w-[568px] h-[130px] rounded-[30px_0_0_0] p-6"
              style={{
                background: "rgba(218, 236, 244, 0.49)",
                marginLeft: "156px",
              }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                Hi {profile?.full_name}!
              </h2>
            </div>
            <p className="text-white/90 ml-[156px] mt-2 text-lg font-semibold">
              Organize, share, and succeed—all in one place!
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mt-16 ml-8">
          <h3 className="text-[#FF8C5A] text-2xl font-bold mb-6">
            Upload your essentials:
          </h3>

          {/* Step Bar */}
          <div className="flex justify-center items-center gap-10 mb-10">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`w-6 h-6 rounded-full transition ${
                  activeStep === step ? "bg-white" : "bg-white/40"
                }`}
              ></div>
            ))}
          </div>

          {/* Upload Boxes */}
          <div className="flex flex-row gap-10">
            {[
              { title: "Syllabus", desc: "Upload your syllabus pdf" },
              { title: "PYQ papers", desc: "Upload your PYQ pdf." },
              { title: "Notes", desc: "Upload your study notes pdf." },
            ].map((item, index) => (
              <div
                key={index}
                className="w-[465px] h-[347px] p-6 cursor-pointer rounded-[30px]"
                style={{
                  border: "6px solid rgba(245, 245, 245, 1)",
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                }}
                onClick={() => setActiveStep(index)}
              >
                <h4 className="text-white text-2xl font-semibold mb-2 mt-5">
                  {item.title}
                </h4>
                <p className="text-white/80 text-lg font-medium mb-4 mt-5">
                  {item.desc}
                </p>
                <button className="w-full bg-[#FF8C5A] text-white py-4 rounded-lg flex items-center justify-center gap-2 mt-10">
                  <Upload className="h-5 w-5" />
                  Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Laptop Image */}
      <div className="absolute right-0 top-[100px] w-[700px] h-[700px]">
        <Image
          src="/assets/userpg.png"
          alt="Laptop"
          width={700}
          height={700}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default UserPage;
