// import lodash from 'lodash'
import { corsHeaders } from '../_shared/cors.ts';

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { url, method } = req;

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const key = new URL(url).searchParams.get('key');

  // Use a secret key inplace of Authorization header
  if (key !== Deno.env.get('SECRET_KEY')) {
    return new Response('Bad request', {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const taskPattern = new URLPattern({ pathname: '/grades-tmp/:id' });
    const matchingPath = taskPattern.exec(url);
    const courseId = matchingPath ? matchingPath.pathname.groups.id : null;

    const { data: exercises, error: exercisesError } = await supabase
      .rpc('get_exercises')
      .eq('course_id', courseId);

    if (exercisesError) {
      throw exercisesError;
    }

    const { data: marks, error } = await supabase.rpc('get_marks').eq('course_id', courseId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ exercises, marks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
