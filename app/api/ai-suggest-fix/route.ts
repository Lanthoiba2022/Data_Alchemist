import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  let { error, row, entityType } = body;
  if (!error || !row || !entityType) {
    return new Response(JSON.stringify({ error: 'Missing error, row, or entityType' }), { status: 400 });
  }

  // Remove stringification of nested objects/arrays
  const safeRow = { ...row };
  // Object.keys(safeRow).forEach(key => {
  //   if (typeof safeRow[key] === 'object' && safeRow[key] !== null) {
  //     safeRow[key] = JSON.stringify(safeRow[key]);
  //   }
  // });

  try {
    const prompt = `You are a data cleaning assistant. Given the following row of a ${entityType} and a validation error, suggest a corrected value for the field.\n\nRow: ${JSON.stringify(safeRow)}\nError: ${JSON.stringify(error)}\n\nReturn the corrected row as a JSON object, preserving the original data types (arrays as arrays, objects as objects, booleans as booleans, etc). Do NOT stringify arrays or objects. Only fix the field in error, leave other fields unchanged.`;
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
    // Try to extract the first valid JSON object from the response
    let fixedRow = {};
    try {
      fixedRow = JSON.parse(fixText || '{}');
    } catch {
      // Try to find the first {...} block
      const match = fixText?.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          fixedRow = JSON.parse(match[0]);
        } catch {}
      }
    }
    return new Response(JSON.stringify({ fixedRow }), { status: 200 });
  } catch (error: any) {
    console.error('AI Suggest Fix Error:', error, { error, row, entityType });
    return new Response(JSON.stringify({ error: 'Failed to suggest fix.', details: error?.message || String(error) }), { status: 500 });
  }
} 