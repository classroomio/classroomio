// Octokit.js
import { Octokit } from 'octokit';

// Initialize Octokit with your GitHub token
const octokit = new Octokit({
  auth: 'YOUR-TOKEN'
});

export async function POST({ request }) {
  try {
    // Extract the data from the request body
    const { assignees, labels, title, description } = await request.json();

    // Make the API request to create a GitHub issue
    const result = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: 'Rotimi-best', // Replace with your GitHub username
      repo: 'classroomio', // Replace with your repository name
      title,
      body: description,
      assignees: assignees || ['rotimi-best'], // Default assignee
      milestone: 1, // Optional milestone
      labels: labels || ['bug'], // Default label
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
