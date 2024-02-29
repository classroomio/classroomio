import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import { getFeedForNotification } from '$lib/utils/services/newsfeed/index';
import sendEmail from '$defer/sendEmail';
// import sendEmails from '$defer/sendEmails';

const supabase = getSupabase();

const sendEmailNotification = async (feedId: string, authorId: string, comment?: string) => {
  const feed = await getFeedForNotification(feedId, authorId);
  console.log({ feed });
  if (!feed) return;

  const postLink = `https://${feed.org.siteName}.classroomio.com/courses/${feed.courseId}?feedId=${feed.id}`;

  if (comment) {
    // send only to teacher
    await sendEmail({
      from: `"${feed.org.name} - ClassroomIO" <notify@classroomio.com>`,
      to: feed.teacherEmail,
      subject: `[${feed.courseTitle}] - News feed comment`,
      content: `
      <p>A student left you a comment on your newsfeed post</p>
      
      <div style="font-style: italic; margin-top: 10px;">${comment}</div>
      <div>
        <a class="button" href="${postLink}">View comment</a>
      </div>
      `
    });

    // dont continue
    return;
  }
  console.log({ members: feed.courseMembers });

  if (!feed.courseMembers.length) {
    return;
  }

  // else send to everyone except the author of the post
  // const emails = feed.courseMembers.map((member) => ({
  //   from: `"${feed.org.name} - ClassroomIO" <notify@classroomio.com>`,
  //   to: member.email,
  //   replyTo: feed.teacherEmail,
  //   subject: `[${feed.courseTitle}] - New post in course`,
  //   content: `
  //   <p>${feed.teacherName} made a post in a course you are taking: ${feed.courseTitle}.</p>

  //   <div style="font-style: italic; margin-top: 10px;">${feed.content}</div>
  //   <div>
  //     <a class="button" href="${postLink}">View post</a>
  //   </div>
  //   `
  // }));
  console.log('Sending emails to all students', feed.courseMembers.length);

  // This is the defer function with a loop
  // await sendEmails(emails);

  // try sendEmail without Loop

  for (const member of feed.courseMembers) {
    console.log('Loop', member);
    await sendEmail({
      from: `"${feed.org.name} - ClassroomIO" <notify@classroomio.com>`,
      to: member.email,
      replyTo: feed.teacherEmail,
      subject: `[${feed.courseTitle}] - New post in course`,
      content: `
      <p>${feed.teacherName} made a post in a course you are taking: ${feed.courseTitle}.</p>
      
      <div style="font-style: italic; margin-top: 10px;">${feed.content}</div>
      <div>
        <a class="button" href="${postLink}">View post</a>
      </div>
      `
    });
  }
};

export async function POST({ request }) {
  const { authorId, feedId, comment } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/newsfeed');

  if (!authorId || !feedId || !accessToken) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    return json({ success: false, message: 'Unauthenticated user' }, { status: 401 });
  }

  sendEmailNotification(feedId, authorId, comment);
  // TODO: Support sending to other platforms like telegram and discord
  // sendDiscordNotification(); sendTelegramNotification();

  return json({
    success: true,
    message: 'Email sent'
  });
}
