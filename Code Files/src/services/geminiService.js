const { GoogleGenerativeAI } = require('@google/generative-ai');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName
  });

  // Try up to 3 times for temporary Gemini errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Gemini request attempt ${attempt}/3...`);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Invalid Gemini response');
      }

      return text;

    } catch (error) {
      console.error(`Gemini API Error (attempt ${attempt}):`, error.message);

      // Retry only for temporary server/load errors
      if (
        (error.message.includes('[503]') ||
         error.message.includes('503') ||
         error.message.includes('high demand')) &&
        attempt < 3
      ) {
        console.log('Gemini is temporarily busy. Retrying in 3 seconds...');
        await sleep(3000);
        continue;
      }

      throw error;
    }
  }
};

module.exports = {
  callGemini,
};
