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

    // Check if bedtime mode is available
    if (!hasFeature(plan, 'bedtime_mode')) {
      return NextResponse.json({ 
        error: 'Bedtime mode is only available with MiniMind Plus',
        upgradeRequired: true 
      }, { status: 403 })
    }

    // Check if user can chat (usage limits)
    const { allowed, reason } = await canUserChat(user.id)
    if (!allowed) {
      return NextResponse.json({ error: reason, limitReached: true }, { status: 429 })
    }

    const { prompt, childId, includePoem = false } = await req.json();

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    let childInfo = ''
    if (childId) {
      // Get child profile for personalization
      const { data: child } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .eq('user_id', user.id)
        .single()

      if (child) {
        childInfo = `The story is for ${child.name}, age ${child.age}. Their favorites include: ${JSON.stringify(child.favorites)}.`
      }
    }

    const systemPrompt = `You are a gentle bedtime storyteller. Create calm, soothing stories perfect for bedtime.

${childInfo}

Guidelines:
- Use a calm, gentle tone
- Create peaceful, dreamy scenarios
- Include soft imagery (clouds, stars, gentle animals)
- Avoid excitement or action that might keep children awake
- End with a peaceful resolution
- Keep it short and soothing (2-3 paragraphs)
${includePoem ? '- Include a short, gentle lullaby or poem at the end' : ''}

Create a bedtime story based on: "${prompt}"

Return as JSON:
{
  "title": "Bedtime Story Title",
  "content": "The soothing story content...",
  ${includePoem ? '"poem": "A gentle lullaby or poem",' : ''}
  "sleepyMessage": "A gentle goodnight message"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.6, // Lower temperature for more consistent, calmer output
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
      let bedtimeData;
      try {
        bedtimeData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw text:', rawText);
        console.error('Cleaned text:', cleanedText);

        // Fallback bedtime story
        bedtimeData = {
          title: "A Peaceful Dream",
          content: rawText.replace(/```json|```/g, '').trim(),
          sleepyMessage: "Sweet dreams! 🌙"
        };
      }

      // Save story if user has save feature
      if (hasFeature(plan, 'save_and_replay')) {
        await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            child_id: childId || null,
            title: bedtimeData.title,
            mode: 'bedtime',
            content: bedtimeData.content,
            metadata: {
              prompt,
              includePoem,
              poem: bedtimeData.poem,
              sleepyMessage: bedtimeData.sleepyMessage,
            },
          })
      }

      // Increment usage counter after successful completion
      await incrementDailyUsage(user.id)

      return NextResponse.json(bedtimeData);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
