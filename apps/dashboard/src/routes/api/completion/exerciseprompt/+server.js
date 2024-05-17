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

export async function POST({ request }) {
  const { prompt } = await request.json();
  const { questionNumber, optionNumber, lessonNote } = JSON.parse(prompt);

  const refinedPrompt = `
Please note this typescript interface:

interface Question_type {
  id: number;
  label: any;
}
const QuestionTypes: Question_type[] = [
  {
    id: 1,
    label: 'RADIO'
  },
  {
    id: 2,
    label: 'CHECKBOX'
  },
  {
    id: 3,
    label: 'TEXTAREA'
  }
];

interface ExerciseTemplate {
  title: string;
  description: string;
  questionnaire: {
    questions: {
      title: string;
      name: string;
      points: number; // a number out of 10 to score the student if student gets the correct answer
      order: number; // a unique number from 0 to n+1, that orders the question in ascending order
      question_type: Question_type;
      options: {
        label: string;
        is_correct: boolean;
      };
    }[]
  };
}

I am a teacher and I need your help evaluating my students after I have taught a lesson. Please generate a test with ${questionNumber} questions and ${optionNumber} options. The sourse of this test should come from my lesson note in thripple quotes: """${lessonNote}""". Format the quiz to match the ExerciseTemplate interface above and VERY IMPORTANTANTLY: ONLY RETURN JSON FORMAT AND DO NOT EXPLAIN ANTHING.
NB: Ask a mixture of ${optionNumber} options and ${questionNumber} DIFFERENT Question Types(RADIO, CHECKBOX AND TEXTAREA), mark the correct answer.`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You only spit out JSON and nothing else, dont give any explanation.'
      },
      {
        role: 'user',
        content: refinedPrompt
      }
    ],
    stream: true
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
