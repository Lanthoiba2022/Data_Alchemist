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
    const prompt = `You are an expert in resource allocation. Given the following data:
Clients: ${JSON.stringify(clients)}
Workers: ${JSON.stringify(workers)}
Tasks: ${JSON.stringify(tasks)}

Suggest up to 3 useful business rules that could improve scheduling. For each rule, output a JSON object with the correct structure based on the rule type.

Available rule types and their structures:

1. Co-Run Rule (tasks that must run together):
{
  "type": "coRun",
  "tasks": ["T1", "T2", "T3"],
  "description": "These tasks must run together"
}

2. Slot Restriction Rule (minimum common slots for groups):
{
  "type": "slotRestriction", 
  "targetGroup": "GroupA",
  "groupType": "worker", // or "client"
  "minCommonSlots": 2,
  "description": "GroupA workers need at least 2 common available slots"
}

3. Load Limit Rule (maximum slots per phase for worker groups):
{
  "type": "loadLimit",
  "workerGroup": "GroupA", 
  "maxSlotsPerPhase": 3,
  "description": "GroupA workers cannot exceed 3 slots per phase"
}

4. Phase Window Rule (allowed phases for specific tasks):
{
  "type": "phaseWindow",
  "taskId": "T1",
  "allowedPhases": [1, 2, 3],
  "description": "Task T1 can only run in phases 1-3"
}

5. Pattern Match Rule (regex-based rules):
{
  "type": "patternMatch",
  "regex": "T[0-9]+",
  "template": "highPriority",
  "parameters": {"priorityBoost": 1.5},
  "description": "All tasks matching T[digits] get priority boost"
}

Return a JSON array of BusinessRule objects. Use a random UUID for each id field. Do not include comments or explanations.`;

    let rulesText = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that suggests business rules for resource allocation.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
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