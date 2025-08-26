import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { canUserChat, incrementDailyUsage, hasFeature, getUserPlan } from '@/lib/subscription';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await getUserPlan(user.id)

    // Check if learning mode is available
    if (!hasFeature(plan, 'learning_mode')) {
      return NextResponse.json({ 
        error: 'Learning mode is only available with MiniMind Plus',
        upgradeRequired: true 
      }, { status: 403 })
    }

    // Check if user can chat (usage limits)
    const { allowed, reason } = await canUserChat(user.id)
    if (!allowed) {
      return NextResponse.json({ error: reason, limitReached: true }, { status: 429 })
    }

    const { question, age = 6, subject } = await req.json();

    if (!question || question.trim() === '') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const gradeLevel = Math.max(1, Math.min(5, Math.floor((age - 4) / 2) + 1)); // Age 4-5 = Grade 1, 6-7 = Grade 2, etc.

    const systemPrompt = `You are an educational assistant specializing in age-appropriate learning for children.

Student Info:
- Age: ${age} years old
- Approximate grade level: ${gradeLevel}
${subject ? `- Subject focus: ${subject}` : ''}

Guidelines:
- Adjust vocabulary and complexity for age ${age}
- Use simple, clear explanations
- Include fun examples and analogies
- Make learning engaging and interactive
- Encourage curiosity and further questions
- Keep explanations concise but thorough
- Use positive, encouraging language

Question: "${question}"

Return as JSON:
{
  "answer": "Age-appropriate explanation of the concept",
  "funFact": "An interesting related fact that would engage a ${age}-year-old",
  "activity": "A simple activity or experiment they could try (optional)",
  "nextQuestions": ["2-3 follow-up questions to encourage further learning"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
      });

      const rawText = completion.choices[0].message.content || '';

      // Clean the response text to handle control characters
      let cleanedText = rawText.trim();

      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to parse JSON with better error handling
      let learningData;
      try {
        learningData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw text:', rawText);
        console.error('Cleaned text:', cleanedText);

        // Fallback learning response
        learningData = {
          answer: rawText.replace(/```json|```/g, '').trim(),
          funFact: "Learning is always an adventure!",
          nextQuestions: ["What else would you like to know?", "Can you think of more questions about this topic?"]
        };
      }

      // Save learning session if user has save feature
      if (hasFeature(plan, 'save_and_replay')) {
        await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            mode: 'learning',
            messages: [
              { role: 'user', content: question },
              { role: 'assistant', content: learningData }
            ],
            token_usage: 0, // Could implement token counting if needed
          })
      }

      // Increment usage counter after successful completion
      await incrementDailyUsage(user.id)

      return NextResponse.json(learningData);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
