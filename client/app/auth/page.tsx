'use client';
import { HashLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { Book } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useState } from 'react';

const SignUp = () => {
  const router = useRouter();
  

  // Colors from landing page
  const primaryColor = "rgba(255, 140, 90, 1)";
  const backgroundColor = "rgba(18, 87, 116, 1)";

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) {
      console.log("user not authenticated with google");
    } else {
      console.log("user authenticated with google");
    }
  };

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
  style={{ backgroundColor: backgroundColor, 
    backgroundImage:'url("/assets/authpage.png")',
    backgroundSize:'cover',
    backgroundPosition: 'center',
  }}
>
  <div className="w-full xl:max-w-md xl:mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden p-8">
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

      {/* Authentication Button */}
      <div className="w-full max-w-xs">
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center relative p-4 rounded-full text-white text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${backgroundColor})`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}
        >
          <div className="absolute left-4">
            <svg
              className="w-7 h-7"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
            </svg>
          </div>
          Continue with Google
        </button>
      </div>
    </div>
  </div>
</div>
      </div>
    </section>
  );
}

export default SignUp;