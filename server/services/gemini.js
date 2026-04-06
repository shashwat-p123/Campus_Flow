const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

async function summarizeNotes(content) {
  const prompt = `You are an academic assistant. Summarize the following notes into clear, concise key bullet points and identify the most important topics. Format with bullet points using • symbol.

Notes content:
${content}

Provide:
1. A brief overview (2-3 sentences)
2. Key Topics (bullet points)
3. Important Concepts to Remember`;

  return callGemini(prompt);
}

async function improveDescription(text) {
  const prompt = `You are a campus event coordinator. Improve the following event description to be more engaging, professional, and informative. Keep it concise but compelling.

Original description:
${text}

Provide the improved description only, no extra commentary.`;

  return callGemini(prompt);
}

async function generateDescription(roughInput) {
  const prompt = `You are helping a student write a clear lost & found item description. Based on the following rough input, generate a clear, detailed description that would help someone identify the item.

Rough input: ${roughInput}

Provide a clean, well-written description (2-3 sentences) including distinguishing features.`;

  return callGemini(prompt);
}

async function explainAnswer(question, answer) {
  const prompt = `You are a helpful academic tutor. A student is reading a discussion forum and wants a deeper explanation.

Question: ${question}

Answer given: ${answer}

Please provide:
1. A clear explanation of the answer in simpler terms
2. Why this answer is helpful
3. Any additional context or resources that might be useful

Keep it educational and encouraging.`;

  return callGemini(prompt);
}

module.exports = { summarizeNotes, improveDescription, generateDescription, explainAnswer };
