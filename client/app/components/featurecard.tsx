// app/components/featurecard.tsx
import { FC } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const features: Feature[] = [
  {
    title: "Upload syllabi and notes",
    description: "Upload your course materials and get instant smart content analysis to organize your study materials effectively",
    icon: "📚"
  },
  {
    title: "Generate important questions",
    description: "AI-powered system creates personalized important questions based on your learning materials",
    icon: "🎯"
  },
  {
    title: "Sync with Google Calendar",
    description: "Seamlessly integrate your study schedule with  Google  Calendar for organized study sessions",
    icon: "📅"
  },
  {
    title: "Optimize study time",
    description: "Smart scheduling algorithms optimize your study time with personalized recommendations",
    icon: "⏰"
  }
];

const FeatureCard: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 w-full max-w-7xl px-4 font-roboto">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-xl hover:bg-white/20 transition duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <div className="text-5xl mb-6">{feature.icon}</div>
          <h3 className="text-white font-bold text-xl mb-4">{feature.title}</h3>
          <p className="text-white/80 text-sm leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FeatureCard;