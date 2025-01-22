'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Book } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../utils/supabase';
import { useState } from 'react';

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');


  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error)
    {
      console.log("user not authenticated with google");
    } 
    else
    {
      console.log("user authenticated with google");
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  return (
    <main
      className="min-h-screen flex justify-center items-center relative"
      style={{ background: "rgba(18, 87, 116, 1)" }}
    >
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
      <nav className="absolute top-0 left-0 right-0 z-10 flex items-center h-20">
        <div
          className="w-1/2 h-full flex items-center pl-8 cursor-pointer"
          style={{ background: "rgba(255, 140, 90, 1)" }}
          onClick={handleHomeClick}
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

      {/* Centered Sign Up Card */}
      <div className="relative z-10">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-600 mt-2">Join StudyGPT and unlock your learning potential</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <Button
                onClick={handleGoogleAuth}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-300"
                variant="outline"
                disabled={loading}
              >
                <Image
                  src="/assets/google.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="font-medium">Continue with Google</span>
              </Button>
            </div>
          </CardContent>
        </Card>
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

export default SignUp;
