import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { query, schema } = req.body;
  if (!query || !schema) {
    return res.status(400).json({ error: 'Missing query or schema' });
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
    res.status(200).json({ filterBody });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process NL search.' });
  }
} 