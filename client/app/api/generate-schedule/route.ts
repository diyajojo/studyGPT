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
    - Break interval: ${preferences.break_interval} minutes
    - Learning style: ${preferences.learning_style}

    Goals:
    - Daily: ${goals.daily.join(', ')}
    - Weekly: ${goals.weekly.join(', ')}
    - Long term: ${goals.longTerm.join(', ')}

    Content to cover:
    Topics: ${content.topics.map((t: { topic_name: string }) => t.topic_name).join(', ')}
    Questions: ${content.questions.length} practice questions
    Flashcards: ${content.flashcards.length} review cards

    IMPORTANT INSTRUCTIONS:
    1. Create a ${studyDays}-day study plan
    2. Schedule activities between 8:00 AM - 8:00 PM
    3. Include 15-30 minute breaks between study sessions
    4. Vary study methods (reading, practice, review)
    5. Align activities with learning style
    6. Assignments every 2-3 days
    
    Respond ONLY with a JSON object matching this structure:
    {
      "schedule": [
        {
          "date": "YYYY-MM-DD",
          "display_date": "Day, Month Date",
          "activities": [
            {
              "time": "Start Time - End Time",
              "topic": "Topic Name",
              "description": "Detailed study description",
              "type": "study|practice|review"
            }
          ]
        }
      ],
      "assignments": [
        {
          "date": "YYYY-MM-DD",
          "display_date": "Day, Month Date",
          "title": "Assignment Title",
          "description": "Specific tasks",
          "duration": "Duration in hours"
        }
      ]
    }`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system", 
            content: "You are an AI study schedule generator. Produce precise, JSON-formatted study schedules with clear, actionable activities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = completion.choices[0].message.content;
      
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      try {
        const parsedResponse = JSON.parse(responseText);
        
        // Validate response structure
        if (!parsedResponse.schedule || !parsedResponse.assignments) {
          throw new Error('Invalid schedule response structure');
        }

        return NextResponse.json(parsedResponse);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        return NextResponse.json(
          { 
            error: 'Failed to parse schedule JSON',
            rawResponse: responseText 
          },
          { status: 500 }
        );
      }

    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json(
        { 
          error: openaiError instanceof Error ? openaiError.message : 'OpenAI API request failed',
          details: JSON.stringify(openaiError)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate schedule',
        type: 'general_error'
      },
      { status: 500 }
    );
  }
}