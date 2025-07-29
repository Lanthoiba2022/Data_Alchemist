import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { description } = body;
  if (!description) {
    return new Response(JSON.stringify({ error: 'Missing rule description' }), { status: 400 });
  }

  try {
    const prompt = `You are an expert in resource allocation. Given the following user description of a business rule: "${description}", generate a JSON object for a rule with the following TypeScript type:\n\ninterface BusinessRule { id: string; type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch'; description: string; config: any; }\n\nGenerate a valid JSON object (do not include comments or explanations). Use a random UUID for the id field.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that translates natural language business rules into structured JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0,
    });
    let ruleText = completion.choices[0]?.message?.content?.trim();
    if (ruleText?.startsWith('```json')) {
      ruleText = ruleText.replace(/```json|```/g, '').trim();
    }
    const rule = JSON.parse(ruleText || '{}');
    if (!rule.id) rule.id = uuidv4();
    return new Response(JSON.stringify({ rule }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to parse rule.' }), { status: 500 });
  }
} 