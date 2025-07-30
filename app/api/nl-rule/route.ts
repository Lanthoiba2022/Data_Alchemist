import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const body = await req.json();
  const { description, clients, workers, tasks } = body;
  if (!description) {
    return new Response(JSON.stringify({ error: 'Missing rule description' }), { status: 400 });
  }

  try {
    const prompt = `You are an expert in resource allocation. The user has uploaded the following data:\nClients: ${JSON.stringify(clients)}\nWorkers: ${JSON.stringify(workers)}\nTasks: ${JSON.stringify(tasks)}\n\nGiven the following user description of a business rule: "${description}", generate a JSON object for a rule with the correct structure and values that make sense for the provided data. Use real IDs, group names, and other values from the uploaded data wherever possible.\n\nAvailable rule types and their structures:\n\n1. Co-Run Rule (tasks that must run together):\n{\n  "type": "coRun",\n  "tasks": ["T1", "T2", "T3"],\n  "description": "These tasks must run together"\n}\n\n2. Slot Restriction Rule (minimum common slots for groups):\n{\n  "type": "slotRestriction", \n  "targetGroup": "GroupA",\n  "groupType": "worker", // or "client"\n  "minCommonSlots": 2,\n  "description": "GroupA workers need at least 2 common available slots"\n}\n\n3. Load Limit Rule (maximum slots per phase for worker groups):\n{\n  "type": "loadLimit",\n  "workerGroup": "GroupA", \n  "maxSlotsPerPhase": 3,\n  "description": "GroupA workers cannot exceed 3 slots per phase"\n}\n\n4. Phase Window Rule (allowed phases for specific tasks):\n{\n  "type": "phaseWindow",\n  "taskId": "T1",\n  "allowedPhases": [1, 2, 3],\n  "description": "Task T1 can only run in phases 1-3"\n}\n\n5. Pattern Match Rule (regex-based rules):\n{\n  "type": "patternMatch",\n  "regex": "T[0-9]+",\n  "template": "highPriority",\n  "parameters": {"priorityBoost": 1.5},\n  "description": "All tasks matching T[digits] get priority boost"\n}\n\nGenerate a valid JSON object with the appropriate structure and use real values from the uploaded data. Use a random UUID for the id field. Do not include comments or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that translates natural language business rules into structured JSON for resource allocation systems.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
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