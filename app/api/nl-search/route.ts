import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { query, schema } = body;
  if (!query || !schema) {
    return new Response(JSON.stringify({ error: 'Missing query or schema' }), { status: 400 });
  }

  try {
    const prompt = `Given the following table schema: ${JSON.stringify(schema)}\nAnd the user query: "${query}"\nGenerate a JavaScript filter function body (as a string) that returns true for rows matching the query. Only return the function body, not a full function.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that translates natural language queries into JavaScript filter conditions for data tables.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0,
    });
    const filterBody = completion.choices[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ filterBody }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process NL search.' }), { status: 500 });
  }
} 