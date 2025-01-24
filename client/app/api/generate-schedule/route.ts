import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Calculate required study days based on content
function calculateStudyDays(content: any) {
  const topicsCount = content.topics.length;
  const questionsCount = content.questions.length;
  const flashcardsCount = content.flashcards.length;
  
  // Base calculations (adjust these ratios based on your needs)
  const daysForTopics = Math.ceil(topicsCount / 3); // 3 topics per day
  const daysForQuestions = Math.ceil(questionsCount / 5); // 5 questions per day
  const daysForFlashcards = Math.ceil(flashcardsCount / 10); // 10 flashcards per day
  
  // Sum up the days and add some buffer days for revision
  const totalDays = daysForTopics + daysForQuestions + daysForFlashcards;
  const bufferDays = Math.ceil(totalDays * 0.2); // 20% buffer time
  
  return totalDays + bufferDays;
}

function generateDates(numberOfDays: number) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dates = [];
  
  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayName = days[date.getDay()];
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    dates.push({
      full: date.toISOString().split('T')[0],
      display: `${dayName}, ${formattedDate}`
    });
  }
  
  return dates;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const body = await req.json();
    const { preferences, goals, content } = body;

    if (!preferences || !goals || !content) {
      throw new Error('Missing required data');
    }

    const studyDays = calculateStudyDays(content);
    const dates = generateDates(studyDays);

    const prompt = `
    Create a detailed study schedule and assignments based on the following:

    Subject: ${content.subject}
    Required study days: ${studyDays}

    Student Preferences:
    - Study time: ${preferences.study_time}
    - Study environment: ${preferences.study_environment}
    - Break interval: ${preferences.break_interval}
    - Learning style: ${preferences.learning_style}

    Goals:
    - Daily: ${goals.daily}
    - Weekly: ${goals.weekly}
    - Long term: ${goals.longTerm}

    Content to cover:
    Topics: ${JSON.stringify(content.topics)}
    Questions: ${JSON.stringify(content.questions)}
    Flashcards: ${JSON.stringify(content.flashcards)}

    Create a ${studyDays}-day study plan with separate schedules and assignments.
    Assignments should be given every 2-3 days, not daily.
    
    Return ONLY a JSON object with this exact structure:
    {
      "schedule": [
        {
          "date": "${dates[0].full}",
          "display_date": "${dates[0].display}",
          "activities": [
            {
              "time": "9:00 AM - 10:30 AM",
              "topic": "topic name",
              "description": "what to study",
              "type": "study|practice|review"
            }
          ]
        }
      ],
      "assignments": [
        {
          "date": "${dates[0].full}",
          "display_date": "${dates[0].display}",
          "title": "Assignment title",
          "description": "Specific tasks to complete",
          "duration": "1 hour"
        }
      ]
    }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a study schedule creator that returns only valid JSON. Create engaging schedules with clear assignments spaced appropriately."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
      }, 
      {
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    return NextResponse.json(JSON.parse(responseText));

  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}