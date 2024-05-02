import { OPENAI_API_KEY } from '$env/static/private';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

// Create an OpenAI API client (that's edge friendly!)
const openAIConfig = new Configuration({
  apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(openAIConfig);

// Set the runtime to edge for best performance
export const config = {
  runtime: 'edge'
};

export async function POST({ request }) {
  const { prompt } = await request.json();

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a teaching assistant, you only spit out JSON and nothing else, dont give any explanation.'
      },
      {
        role: 'user',
        content: `
        Given this array of objects below, there are 4 keys , id, question, answer and  points. You are required to come up with a score between 0 and the point for each answer provided to the question and a simple explanation for giving that score, you are to return an array of object in json with the following keys; id which is the id provided for that object in the initial array, score which is the value you gave for that question and then your explanation in this format below:

        {
          id,
          score,
          explanation,
        }
      
        IMPORTANT: DO NOT GIVE ANY OTHER TEXT EXCEPT THE JSON

        The array you need to grade is below: 
        ${prompt}

        `
      }
    ],
    stream: true
  });

  const stream = OpenAIStream(response);

  return new StreamingTextResponse(stream);
}
