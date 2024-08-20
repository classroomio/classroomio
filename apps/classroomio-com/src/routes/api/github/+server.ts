// Octokit.js
import { Octokit } from 'octokit';
import { PUBLIC_GITHUB_KEY } from '$env/static/public';

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: PUBLIC_GITHUB_KEY
});

export async function POST({ request }) {
  try {
    const { assignees, labels, title, description } = await request.json();

    const result = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: 'rotimi-best',
      repo: 'classroomio',
      title: title,
      body: description,
      assignees: assignees || ['rotimi-best'],
      labels: labels || ['bug'],
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Return the result as a response
    return new Response(
      JSON.stringify({
        message: 'Issue created successfully',
        issue: result.data
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    // Handle errors and return a response
    console.log('errors from backend', error);
    return new Response(
      JSON.stringify({
        message: 'Failed to create issue',
        error: error.message
      }),
      {
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
