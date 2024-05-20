import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { OPENAI_API_KEY } from '$env/static/private';

// Create an OpenAI API client (that's edge friendly!)
const openAIConfig = new Configuration({
  apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(openAIConfig);

// Set the runtime to edge for best performance
export const config = {
  runtime: 'edge'
};

const instruction = {
  outline: 'a structured lesson outline',
  note: 'a sample lesson note',
  activities: 'few interactive lesson activities to my lecture'
};

export async function POST({ request }) {
  const { prompt } = await request.json();
  const { courseTitle, lessonTitle, type, locale } = JSON.parse(prompt);

  const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Act like an assistant of a lecturer'
      },
      {
        role: 'user',
        content: `Generate ${instruction[type]} given the course title is "${courseTitle}" and the title of the lesson is "${lessonTitle}". Format in HTML without any styling. MOST IMPORTANT DON'T include the title of the course and don't include the lesson title: "${lessonTitle}" in your output. Please make sure the content is well detailed and you output the content in this locale: ${locale}`
      }
    ],
    stream: true
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
