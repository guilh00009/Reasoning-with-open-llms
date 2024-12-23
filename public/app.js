const introScreen = document.getElementById('intro-screen');
const chatInterface = document.getElementById('chat-interface');
const startButton = document.getElementById('start-button');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');

const messageHistory = {
    messages: [],
    addMessage: function(content, type, metadata = {}) {
        this.messages.push({
            content,
            type,
            metadata,
            timestamp: new Date().toISOString()
        });
    },
    clear: function() {
        this.messages = [];
        messagesContainer.innerHTML = '';
    }
};

startButton.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    window.dispatchEvent(new Event('resize'));
    displayMessageHistory();
});

function displayMessageHistory() {
    messagesContainer.innerHTML = '';
    messageHistory.messages.forEach(msg => {
        if (msg.metadata.decision) {
            createDecisionMessage(msg.metadata.decision);
        }
        if (msg.metadata.isThinking && msg.metadata.thinkingSteps) {
            const thinkingContent = createThinkingMessage();
            msg.metadata.thinkingSteps.forEach(step => {
                const thinkingStep = document.createElement('div');
                thinkingStep.classList.add('thinking-step');
                if (step.number) {
                    thinkingStep.classList.add('numbered-thinking');
                    thinkingStep.textContent = `Step ${step.number}: ${step.content}`;
                } else {
                    thinkingStep.textContent = step.content;
                }
                thinkingContent.appendChild(thinkingStep);
            });
        }
        if (msg.content) {
            addMessage(msg.content, msg.type);
        }
    });
}

function createDecisionMessage(decision) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'decision-message');
    messageDiv.textContent = decision;
    messagesContainer.appendChild(messageDiv);
    return messageDiv;
}

function createThinkingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'thinking-message');
    
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('thinking-header');
    headerDiv.innerHTML = '<span class="thinking-icon">🤔</span> Click to see reasoning process';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('thinking-content');
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    
    messageDiv.addEventListener('click', () => {
        contentDiv.classList.toggle('visible');
    });
    
    messagesContainer.appendChild(messageDiv);
    return contentDiv;
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

function processContent(content) {
    const decisionMatch = content.match(/<decide>(.*?)<\/decide>/);
    const decision = decisionMatch ? decisionMatch[1] : null;
    
    const thinkingSteps = [];
    
    const numberedThinkRegex = /<think(\d+)>(.*?)<\/think\d+>/g;
    let numberedMatch;
    while ((numberedMatch = numberedThinkRegex.exec(content)) !== null) {
        thinkingSteps.push({
            number: parseInt(numberedMatch[1]),
            content: numberedMatch[2]
        });
    }
    
    const regularThinkRegex = /<think>(.*?)<\/think>/g;
    let regularMatch;
    while ((regularMatch = regularThinkRegex.exec(content)) !== null) {
        thinkingSteps.push({
            content: regularMatch[1]
        });
    }
    
    thinkingSteps.sort((a, b) => {
        if (a.number && b.number) return a.number - b.number;
        if (a.number) return -1;
        if (b.number) return 1;
        return 0;
    });
    
    let finalAnswer = content
        .replace(/<decide>.*?<\/decide>/g, '')
        .replace(/<think\d*>.*?<\/think\d*>/g, '')
        .replace(/<think>.*?<\/think>/g, '')
        .trim();
    
    return { decision, thinkingSteps, finalAnswer };
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        messageHistory.addMessage(message, 'user');
        addMessage(message, 'user');
        messageInput.value = '';
        
        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            handleMessage({ type: 'ai', content: data.choices[0].message.content });
        } catch (error) {
            console.error('Error:', error);
            handleError('Failed to get AI response');
        }
    }
}

function handleMessage(data) {
    if (data.type === 'ai') {
        const { decision, thinkingSteps, finalAnswer } = processContent(data.content);
        
        if (decision) {
            messageHistory.addMessage('', 'decision', { decision });
            createDecisionMessage(decision);
        }
        
        if (thinkingSteps.length > 0) {
            messageHistory.addMessage('', 'ai', { 
                isThinking: true, 
                thinkingSteps 
            });
            const thinkingContent = createThinkingMessage();
            thinkingSteps.forEach(step => {
                const thinkingStep = document.createElement('div');
                thinkingStep.classList.add('thinking-step');
                if (step.number) {
                    thinkingStep.classList.add('numbered-thinking');
                    thinkingStep.textContent = `Step ${step.number}: ${step.content}`;
                } else {
                    thinkingStep.textContent = step.content;
                }
                thinkingContent.appendChild(thinkingStep);
            });
        }
        
        if (finalAnswer) {
            messageHistory.addMessage(finalAnswer, 'ai');
            addMessage(finalAnswer, 'ai');
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function handleError(error) {
    console.error('Error:', error);
    const errorMessage = 'Sorry, there was an error processing your message.';
    messageHistory.addMessage(errorMessage, 'error');
    addMessage(errorMessage, 'error');
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

const chatHeader = document.createElement('div');
chatHeader.className = 'chat-header';

const clearButton = document.createElement('button');
clearButton.textContent = 'Clear History';
clearButton.className = 'button-30';
clearButton.onclick = () => {
    messageHistory.clear();
};

chatHeader.appendChild(clearButton);
chatInterface.insertBefore(chatHeader, chatInterface.firstChild);
