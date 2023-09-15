import { supabase } from '$lib/utils/functions/supabase';

export async function sendTeacherStudentJoinRequest(params: {
  to: string;
  courseName: string;
  studentEmail: string;
  studentFullname: string;
}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/email/course/teacher_student_buycourse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();

    console.log('Sent invite email', result);
  } catch (error) {
    console.error('Error sending invite email', error);
  }
}

export async function sendStudentRequestReceipt(params: {
  to: string;
  courseName: string;
  orgName: string;
  studentFullname: string;
  teacherEmail: string;
}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/email/course/student_prove_payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();

    console.log('Sent invite email', result);
  } catch (error) {
    console.error('Error sending invite email', error);
  }
}
