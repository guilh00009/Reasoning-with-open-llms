const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message } = JSON.parse(event.body);
  const OPENPIPE_API_KEY = process.env.OPENPIPE_API_KEY;

  try {
    const response = await axios.post('https://app.openpipe.ai/api/v1/chat/completions', {
      model: "openpipe:Samantha-70b",
      messages: [
        {
          role: "system",
          content: `You are an adaptive AI assistant...` // Your existing system prompt
        },
        {
          role: "user",
          content: message
        }
      ],
      store: true,
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${OPENPIPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get AI response' })
    };
  }
};
