import React from 'react';
import { HashLoader } from 'react-spinners';
import { Book } from 'lucide-react';

const Loader = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen"
      style={{
        backgroundColor: "rgba(18, 87, 116, 1)",
        background: `
          radial-gradient(circle at center, 
            rgba(18, 87, 116, 1) 0%, 
            rgba(18, 87, 116, 0.95) 50%, 
            rgba(18, 87, 116, 0.9) 100%
          )
        `,
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Animated Logo */}
      <div className="mb-8 flex items-center gap-4 animate-pulse">
        <Book 
          className="h-12 w-12 text-white" 
          strokeWidth={1.5}
        />
        <div className="text-4xl font-bold">
          <span className="text-white">Study</span>
          <span className="text-[#FF8C5A]">GPT</span>
        </div>
      </div>

      {/* Enhanced Loader Container */}
      <div className="relative">
        <HashLoader
          color="#FF8C5A"
          size={80}
          speedMultiplier={0.7}
        />
        
        {/* Decorative Loader Background */}
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-30" 
          style={{
            background: 'radial-gradient(circle, rgba(255,140,90,0.3) 0%, transparent 70%)',
            zIndex: -1
          }}
        />
      </div>

      {/* Subtle Loading Text */}
      <p 
        className="mt-8 text-xl text-white/70 tracking-widest uppercase"
        style={{
          animation: 'fadeInOut 2s infinite',
          fontFamily: 'monospace'
        }}
      >
        Preparing Your Learning Journey
      </p>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Loader;