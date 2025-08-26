// /app/api/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { canUserChat, incrementDailyUsage } from '@/lib/subscription';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can chat (usage limits)
    const { allowed, reason } = await canUserChat(user.id)
    if (!allowed) {
      return NextResponse.json({ error: reason, limitReached: true }, { status: 429 })
    }

    const { topic } = await req.json();

    if (!topic || topic.trim() === '') {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

  const prompt = `You are an educational assistant.

Given the topic: "${topic}"

Return this:
🧒 Kid: Explain the topic clearly to a 5-year-old in 1–2 sentences.
👨‍👩 Parent: Explain the same topic to an adult (non-expert) in 2–3 sentences.
💡 Fun: Add a playful quiz question, analogy, or tip a child might enjoy.

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "kid": "Simple explanation for kids here",
  "parent": "More detailed explanation for parents here",
  "fun": "Fun fact or question here"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
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
      let json;
      try {
        json = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw text:', rawText);
        console.error('Cleaned text:', cleanedText);

        // Fallback response
        json = {
          kid: "That's a great question! Let me think about how to explain this in a simple way.",
          parent: "This is an interesting topic that requires some context to explain properly.",
          fun: "Here's something fun to think about related to your question!"
        };
      }

      // Increment usage counter after successful completion
      await incrementDailyUsage(user.id)

      return NextResponse.json(json);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}