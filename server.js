const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');

app.use(express.static('public'));
app.use(express.json());

const OPENPIPE_API_KEY = 'opk_5fcca158032f16b9caeeb0729d4fa0dd85b7aaf6ac';

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('sendMessage', async (message) => {
        console.log('Message received:', message);
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

Always start your response with a <decide> tag explaining your choice of mode.`
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

            const content = response.data.choices[0].message.content;
            socket.emit('message', { type: 'ai', content: content });

        } catch (error) {
            console.error('Error:', error);
            socket.emit('error', 'Failed to get AI response');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});