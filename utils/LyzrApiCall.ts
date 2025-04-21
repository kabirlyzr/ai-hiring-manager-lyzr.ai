import axios from 'axios';
import crypto from 'crypto';

function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(5).toString('hex');
  return `${timestamp}-${randomStr}`;
}

export async function callLyzrAgent(message: string, lyzrApiKey: string, agentId: string, sessionId?: string) {
  const userId = generateUniqueId();
  const chatSessionId = sessionId || generateUniqueId();
  console.log(userId, agentId, chatSessionId, message)
  try {
    const response = await axios.post(
      'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
      {
        user_id: "harshit@lyzr.ai",
        agent_id: agentId,
        session_id: chatSessionId,
        message: message,
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': lyzrApiKey,
        }
      }
    );

    return {
      ...response.data,
      user_id: userId,
      session_id: chatSessionId
    };
  } catch (error) {
    console.error('Error calling Lyzr API:', error);
    throw new Error('An error occurred while processing your request');
  }
}