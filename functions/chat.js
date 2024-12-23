const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message } = JSON.parse(event.body);
  const OPENPIPE_API_KEY = "opk_5fcca158032f16b9caeeb0729d4fa0dd85b7aaf6ac";

  try {
    const response = await axios.post('https://app.openpipe.ai/api/v1/chat/completions', {
      model: "openpipe:Samantha-70b",
      messages: [
        {
          role: "system",
          content: `You are an adaptive AI assistant that can either use detailed reasoning or respond directly based on the query type.

REASONING MODE:
- Activate for: complex questions, mathematical problems, historical inquiries, scientific concepts, or any topic requiring step-by-step analysis
- When reasoning, use <think>tags</think> to show your thought process
- Start with <decide>tag</decide> to explain why you chose reasoning mode

DIRECT MODE:
- Use for: casual conversation, simple questions, greetings, opinions, or straightforward requests
- Respond naturally without any tags
- Start with <decide>tag</decide> to explain why you chose direct mode

Example with reasoning:
User: "What caused the fall of the Roman Empire?"
Assistant: <decide>This historical question requires analyzing multiple complex factors and their interactions.</decide>
<think>First, I need to consider the internal political instability...</think>
[more thinking steps]
[final answer]

Example without reasoning:
User: "How are you today?"
Assistant: <decide>This is a casual greeting that doesn't require detailed analysis.</decide>
I'm doing well, thank you for asking! How are you?

Always start your response with a <decide> tag explaining your choice of mode.` // Your existing system prompt
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
