import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple fallback search patterns
const searchPatterns = {
  'longer than': (value: number, threshold: number) => value > threshold,
  'less than': (value: number, threshold: number) => value < threshold,
  'equal to': (value: any, target: any) => value == target,
  'contains': (value: string, search: string) => value.toLowerCase().includes(search.toLowerCase()),
  'starts with': (value: string, prefix: string) => value.toLowerCase().startsWith(prefix.toLowerCase()),
  'ends with': (value: string, suffix: string) => value.toLowerCase().endsWith(suffix.toLowerCase()),
  'priority': (value: number, level: number) => value >= level,
  'skill': (value: string[], skill: string) => value.some(s => s.toLowerCase().includes(skill.toLowerCase())),
  'category': (value: string, category: string) => value.toLowerCase().includes(category.toLowerCase()),
};

function createSimpleFilter(query: string, schema: any[]) {
  const lowerQuery = query.toLowerCase();
  
  // Extract numbers from query
  const numbers = query.match(/\d+/g)?.map(Number) || [];
  const firstNumber = numbers[0];
  
  // Check for common patterns
  if (lowerQuery.includes('longer than') && firstNumber) {
    return `return row.Duration > ${firstNumber}`;
  }
  
  if (lowerQuery.includes('less than') && firstNumber) {
    return `return row.Duration < ${firstNumber}`;
  }
  
  if (lowerQuery.includes('priority') && firstNumber) {
    return `return row.PriorityLevel >= ${firstNumber}`;
  }
  
  if (lowerQuery.includes('skill')) {
    const skillMatch = query.match(/skill[:\s]+(\w+)/i);
    if (skillMatch) {
      const skill = skillMatch[1];
      return `return row.Skills && row.Skills.some(s => s.toLowerCase().includes('${skill.toLowerCase()}'))`;
    }
  }
  
  if (lowerQuery.includes('category')) {
    const categoryMatch = query.match(/category[:\s]+(\w+)/i);
    if (categoryMatch) {
      const category = categoryMatch[1];
      return `return row.Category && row.Category.toLowerCase().includes('${category.toLowerCase()}')`;
    }
  }
  
  // Generic text search
  const words = query.split(/\s+/).filter(word => word.length > 2);
  if (words.length > 0) {
    const conditions = words.map(word => 
      `Object.values(row).some(val => 
        String(val).toLowerCase().includes('${word.toLowerCase()}') ||
        (Array.isArray(val) && val.some(item => String(item).toLowerCase().includes('${word.toLowerCase()}')))
      )`
    ).join(' && ');
    return `return ${conditions}`;
  }
  
  // Default: search in all string fields
  return `return Object.values(row).some(val => 
    typeof val === 'string' && val.toLowerCase().includes('${lowerQuery}') ||
    (Array.isArray(val) && val.some(item => String(item).toLowerCase().includes('${lowerQuery}')))
  )`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { query, schema } = body;
  
  if (!query || !schema) {
    return new Response(JSON.stringify({ error: 'Missing query or schema' }), { status: 400 });
  }

  try {
    let filterBody: string;
    
    // Try OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `Given the following table schema: ${JSON.stringify(schema)}\nAnd the user query: "${query}"\nGenerate a JavaScript filter function body (as a string) that returns true for rows matching the query. Only return the function body, not a full function. The function should handle arrays, objects, and primitive values appropriately.`;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful assistant that translates natural language queries into JavaScript filter conditions for data tables. Return only the function body, not a complete function declaration.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0,
        });
        
        filterBody = completion.choices[0]?.message?.content?.trim() || '';
        
        // Validate the generated code
        if (filterBody && !filterBody.includes('return')) {
          filterBody = `return ${filterBody}`;
        }
      } catch (openaiError) {
        console.warn('OpenAI API error, falling back to simple search:', openaiError);
        filterBody = createSimpleFilter(query, schema);
      }
    } else {
      // Use simple pattern matching
      filterBody = createSimpleFilter(query, schema);
    }
    
    return new Response(JSON.stringify({ filterBody }), { status: 200 });
  } catch (error) {
    console.error('NL Search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process NL search.' }), { status: 500 });
  }
} 