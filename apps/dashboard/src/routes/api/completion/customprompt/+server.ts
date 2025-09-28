import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';

import { env } from '$env/dynamic/private';

// Create an OpenAI API client (that's edge friendly!)
const openAIConfig = new Configuration({
  apiKey: env.OPENAI_API_KEY
});
const openai = new OpenAIApi(openAIConfig);

// Set the runtime to edge for best performance
export const config = {
  runtime: 'edge'
};

export async function POST({ request }) {
  const { prompt } = await request.json();

  const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Act like an assistant of a lecturer or an educator'
      },
      {
        role: 'user',
        content: `${prompt}. DONT ADD ANY CSS STYLE TO THE HTML FORMATTING AND DON'T USE CODE HTML TAG. ALSO DON'T INLUDE THREE BACKTICKS AND html`
      }
    ],
    stream: true
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
