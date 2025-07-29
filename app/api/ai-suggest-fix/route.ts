import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { error, row, entityType } = body;
  if (!error || !row || !entityType) {
    return new Response(JSON.stringify({ error: 'Missing error, row, or entityType' }), { status: 400 });
  }

  try {
    const prompt = `You are a data cleaning assistant. Given the following row of a ${entityType} and a validation error, suggest a corrected value for the field.\n\nRow: ${JSON.stringify(row)}\nError: ${JSON.stringify(error)}\n\nReturn the corrected row as a JSON object. Only fix the field in error, leave other fields unchanged.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that suggests corrections for spreadsheet data errors.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0,
    });
    let fixText = completion.choices[0]?.message?.content?.trim();
    if (fixText?.startsWith('```json')) {
      fixText = fixText.replace(/```json|```/g, '').trim();
    }
    const fixedRow = JSON.parse(fixText || '{}');
    return new Response(JSON.stringify({ fixedRow }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to suggest fix.' }), { status: 500 });
  }
} 