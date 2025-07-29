import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  let { clients, workers, tasks } = body;
  if (!clients || !workers || !tasks) {
    return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400 });
  }

  // Limit data size for prompt safety
  clients = Array.isArray(clients) ? clients.slice(0, 2) : clients;
  workers = Array.isArray(workers) ? workers.slice(0, 2) : workers;
  tasks = Array.isArray(tasks) ? tasks.slice(0, 2) : tasks;

  try {
    const prompt = `You are an expert in resource allocation. Given the following data:\nClients: ${JSON.stringify(clients)}\nWorkers: ${JSON.stringify(workers)}\nTasks: ${JSON.stringify(tasks)}\n\nSuggest up to 3 useful business rules (coRun, slotRestriction, loadLimit, phaseWindow, patternMatch) that could improve scheduling. For each, output a JSON object with the following TypeScript type:\ninterface BusinessRule { id: string; type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch'; description: string; config: any; }\n\nReturn a JSON array of BusinessRule objects. Use a random UUID for each id. Do not include comments or explanations.`;
    let rulesText = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that suggests business rules for resource allocation.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.2,
      });
      rulesText = completion.choices[0]?.message?.content?.trim() || '';
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return new Response(JSON.stringify({ error: 'OpenAI API error', details: String(openaiError) }), { status: 500 });
    }
    if (rulesText?.startsWith('```json')) {
      rulesText = rulesText.replace(/```json|```/g, '').trim();
    }
    let rules = [];
    try {
      rules = JSON.parse(rulesText || '[]');
    } catch (parseError) {
      console.error('Failed to parse LLM output:', rulesText, parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse LLM output', rulesText }), { status: 500 });
    }
    for (const rule of rules) {
      if (!rule.id) rule.id = uuidv4();
    }
    return new Response(JSON.stringify({ rules }), { status: 200 });
  } catch (error) {
    console.error('Suggest Rules API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to suggest rules.' }), { status: 500 });
  }
} 