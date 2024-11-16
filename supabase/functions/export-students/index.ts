import { corsHeaders } from '../_shared/cors.ts';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','));
  return [header, ...rows].join('\n');
}

Deno.serve(async (req) => {
  const { method, url } = req;

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const searchParams = new URL(url).searchParams;
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return new Response(JSON.stringify({ error: 'Missing org_id parameter' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: students, error } = await supabase
      .rpc('get_students_by_org', { org_id: orgId });

    if (error) {
      throw error;
    }

    const csvContent = convertToCSV(students);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students.csv"'
      },
      status: 200
    });

  } catch (err) {
    console.error('Error while exporting CSV:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
