import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Missing rule description' });
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
    // Remove code block if present
    if (ruleText?.startsWith('```json')) {
      ruleText = ruleText.replace(/```json|```/g, '').trim();
    }
    const rule = JSON.parse(ruleText);
    // Ensure id is present
    if (!rule.id) rule.id = uuidv4();
    res.status(200).json({ rule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse rule.' });
  }
} 