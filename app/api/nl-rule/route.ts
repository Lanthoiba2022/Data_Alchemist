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
    const prompt = `You are an expert in resource allocation. Given the following user description of a business rule: "${description}", generate a JSON object for a rule with the correct structure based on the rule type.

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

Generate a valid JSON object with the appropriate structure based on the user's description. Use a random UUID for the id field. Do not include comments or explanations.`;

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