import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kmpdoztwluxrgnthfkau.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRvenR3bHV4cmdudGhma2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTA1NjAsImV4cCI6MjA3Mjk4NjU2MH0.A9pIKBSMNQXgumNYEzhQV6PjBV7iCc1bZ42hYkO0sC8'
);

const localSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function main() {
  const { data, error } = await supabase.from('profile').select('*');

  console.log(data);
  console.log(error);
}

main();
