import React from 'react';
import { Book, Bell, Calendar, BookOpen } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-white">
      <BookOpen className="h-20 w-20 mb-6 opacity-80" />
      <h2 className="text-2xl font-semibold mb-3">Select a Subject to Begin</h2>
      <p className="text-lg opacity-80 text-center max-w-md">
        Choose a subject from the courses menu to view its topics, questions, flashcards, and schedule
      </p>
      <div className="mt-8 flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
          <Book className="h-5 w-5" />
          <span>Topics</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
          <Calendar className="h-5 w-5" />
          <span>Schedule</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
          <Bell className="h-5 w-5" />
          <span>Reminders</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;


