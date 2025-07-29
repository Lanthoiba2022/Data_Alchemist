import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { clients, workers, tasks } = req.body;
  if (!clients || !workers || !tasks) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const prompt = `You are an expert in resource allocation. Given the following data:\nClients: ${JSON.stringify(clients)}\nWorkers: ${JSON.stringify(workers)}\nTasks: ${JSON.stringify(tasks)}\n\nSuggest up to 3 useful business rules (coRun, slotRestriction, loadLimit, phaseWindow, patternMatch) that could improve scheduling. For each, output a JSON object with the following TypeScript type:\ninterface BusinessRule { id: string; type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch'; description: string; config: any; }\n\nReturn a JSON array of BusinessRule objects. Use a random UUID for each id. Do not include comments or explanations.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that suggests business rules for resource allocation.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.2,
    });
    let rulesText = completion.choices[0]?.message?.content?.trim();
    // Remove code block if present
    if (rulesText?.startsWith('```json')) {
      rulesText = rulesText.replace(/```json|```/g, '').trim();
    }
    const rules = JSON.parse(rulesText || '[]');
    // Ensure ids are present
    for (const rule of rules) {
      if (!rule.id) rule.id = uuidv4();
    }
    res.status(200).json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest rules.' });
  }
} 