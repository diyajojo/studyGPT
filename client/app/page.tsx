// app/page.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FeatureCard from './components/featurecard';
import { Book } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/signup');
  }

  return (
    <main className="min-h-screen relative">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/bgimg.avif"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-teal-900/80 mix-blend-multiply" />
      </div>

      {/* Navigation - Split Color */}
      <nav className="relative z-10 flex items-center h-20">
        <div className="w-1/2 h-full  bg-red-500 flex items-center pl-8">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-gray-800" />
            <div className="text-2xl font-bold">
              <span className="font-montserrat text-white">Study</span>
              <span className=" font-montserrat text-blue-600">GPT</span>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full bg-white flex items-center justify-end pr-8">
          <button 
            onClick={handleClick}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-md transition duration-300 font-semibold"
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
        <p className="text-xl text-white mb-16 max-w-2xl font-medium  leading-relaxed">
          Transform your study routine with personalized learning schedules, smart analysis, 
          and integrated calendar management
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
    width={200}
    height={200}
    className="object-contain filter hue-rotate-180 brightness-95"  // This will help sync the robot color with your site's blue theme
  />
</div>
    </main>
  );
}

export default Home;