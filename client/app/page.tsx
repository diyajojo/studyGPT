'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FeatureCard from './components/featurecard';
import { Book } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  const handleSignupClick = () => {
    router.push('/auth');
  }

  const primaryColor = "rgba(255, 140, 90, 1)";
  const backgroundColor = "rgba(18, 87, 116, 1)";

  return (
    <main
      className="min-h-screen relative"
      style={{ background: backgroundColor }}
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

      <nav className="relative z-10 flex items-center h-20">
        <div
          className="w-1/2 h-full flex items-center pl-8"
          style={{ background: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-gray-800" />
            <div className="text-2xl font-bold">
              <span className="font-montserrat text-white">Study</span>
              <span className="font-montserrat" style={{ color: backgroundColor }}>GPT</span>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full bg-white flex items-center justify-end pr-8">
          <button
            onClick={handleSignupClick}
            className="text-white px-8 py-2 transition-all duration-300 font-semibold rounded-lg"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-12 tracking-tight">
          Your AI Study Assistant
        </h1>
        <p className="text-xl text-white mb-16 max-w-2xl font-medium leading-relaxed">
          Transform your study routine with personalized learning schedules, smart analysis, and integrated calendar management
        </p>

        {/* Feature Cards Component */}
        <div className="mt-16">
          <FeatureCard />
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
}

export default Home;