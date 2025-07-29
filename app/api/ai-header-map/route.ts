import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { headers, expected } = body;
  if (!headers || !expected) {
    return new Response(JSON.stringify({ error: 'Missing headers or expected schema' }), { status: 400 });
  }

  try {
    const prompt = `You are a data cleaning assistant. Map each of these uploaded file headers to the closest field in the expected schema. If a header is ambiguous, guess the best match. If no match, return null.\n\nHeaders: ${JSON.stringify(headers)}\nExpected: ${JSON.stringify(expected)}\n\nReturn a JSON object mapping each header to the expected field or null.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that maps spreadsheet headers to a known schema.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0,
    });
    let mappingText = completion.choices[0]?.message?.content?.trim();
    if (mappingText?.startsWith('```json')) {
      mappingText = mappingText.replace(/```json|```/g, '').trim();
    }
    const mapping = JSON.parse(mappingText || '{}');
    return new Response(JSON.stringify({ mapping }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to map headers.' }), { status: 500 });
  }
} 