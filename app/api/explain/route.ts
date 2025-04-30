// /app/api/explain/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
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

Format as JSON:
{
  "kid": "...",
  "parent": "...",
  "fun": "..."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const rawText = completion.choices[0].message.content || '';
    const json = JSON.parse(rawText);

    return NextResponse.json(json);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}