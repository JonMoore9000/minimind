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

    // Check if user can chat (usage limits)
    const { allowed, reason } = await canUserChat(user.id)
    if (!allowed) {
      return NextResponse.json({ error: reason, limitReached: true }, { status: 429 })
    }

    const { prompt, childId, personalized = false } = await req.json();

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const plan = await getUserPlan(user.id)

    // Check if personalization is requested but not available
    if (personalized && !hasFeature(plan, 'story_personalization')) {
      return NextResponse.json({ 
        error: 'Story personalization is only available with MiniMind Plus',
        upgradeRequired: true 
      }, { status: 403 })
    }

    let childInfo = ''
    if (personalized && childId) {
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

    const systemPrompt = `You are a creative storyteller for children aged 3-10. Create engaging, safe, and age-appropriate stories.

${childInfo}

Guidelines:
- Keep stories positive and educational
- Use simple, clear language
- Include fun characters and gentle adventures
- Avoid scary, violent, or inappropriate content
- Make it engaging and imaginative
- Length should be appropriate for a short story (3-5 paragraphs)
- Separate paragraphs with double line breaks (\\n\\n) for proper formatting

Create a story based on: "${prompt}"

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "title": "Story Title Here",
  "content": "The full story content goes here. Use \\n for line breaks if needed.",
  "moral": "Optional lesson or moral from the story"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.8,
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
      let storyData;
      try {
        storyData = JSON.parse(cleanedText);

        // Validate that we have the expected structure
        if (!storyData.title || !storyData.content) {
          throw new Error('Invalid story structure');
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw text:', rawText);
        console.error('Cleaned text:', cleanedText);

        // Try to extract a story from the raw text
        const lines = rawText.split('\n').filter(line => line.trim());
        let title = "A Wonderful Story";
        let content = rawText;

        // Look for a title in the first few lines
        for (const line of lines.slice(0, 3)) {
          if (line.includes('title') || line.includes('Title')) {
            const titleMatch = line.match(/["']([^"']+)["']/);
            if (titleMatch) {
              title = titleMatch[1];
              break;
            }
          }
        }

        // Clean up content - remove JSON-like formatting
        content = rawText
          .replace(/^\s*{\s*$/gm, '')
          .replace(/^\s*}\s*$/gm, '')
          .replace(/^\s*"[^"]*":\s*"?/gm, '')
          .replace(/",?\s*$/gm, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .trim();

        // Ensure proper paragraph spacing
        content = content
          .split(/\n\s*\n/)  // Split on double line breaks
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .join('\n\n');  // Join with double line breaks

        // If content still looks like JSON, extract just the story part
        if (content.includes('"content"')) {
          const contentMatch = content.match(/"content":\s*"([^"]+)"/);
          if (contentMatch) {
            content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
        }

        storyData = {
          title: title,
          content: content,
          moral: "Every story has something to teach us!"
        };
      }

      // Save story if user has save feature
      if (hasFeature(plan, 'save_and_replay')) {
        await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            child_id: childId || null,
            title: storyData.title,
            mode: 'custom',
            content: storyData.content,
            metadata: {
              prompt,
              personalized,
              moral: storyData.moral,
            },
          })
      }

      // Increment usage counter after successful completion
      await incrementDailyUsage(user.id)

      return NextResponse.json(storyData);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
