export async function load({ fetch }) {
    let githubStars = 0;
  
    try {
      const response = await fetch('http://api.github.com/repos/classroomio/classroomio');
      const data = await response.json();
      githubStars = data?.stargazers_count || 0;
    } catch (error) {
      console.error('Error fetching GitHub stars:', error);
    }
  
    return {
      githubStars
    };
  }