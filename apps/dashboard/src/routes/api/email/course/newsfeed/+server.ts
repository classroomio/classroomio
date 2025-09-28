import { getFeedForNotification } from '$lib/utils/services/newsfeed/index';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';
import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';

const supabase = getServerSupabase();

const sendEmailNotification = async (
  sFetch: typeof fetch,
  feedId: string,
  authorId: string,
  comment?: string
) => {
  const feed = await getFeedForNotification({
    supabase,
    feedId,
    authorId
  });
  console.log({ feed });
  if (!feed) return;

  const postLink = `https://${feed.org.siteName}.classroomio.com/courses/${feed.courseId}?feedId=${feed.id}`;

  if (comment) {
    const emailData = [
      {
        from: `"${feed.org.name} - ClassroomIO" <notify@mail.classroomio.com>`,
        to: feed.teacherEmail,
        subject: `[${feed.courseTitle}] - News feed comment`,
        content: `
      <p>A student left you a comment on your newsfeed post</p>
      
      <div style="font-style: italic; margin-top: 10px;">${comment}</div>
      <div>
        <a class="button" href="${postLink}">View comment</a>
      </div>
      `,
        replyTo: 'noreply@classroomio.com'
      }
    ];

    await sendEmail(sFetch)(emailData);

    // dont continue
    return;
  }

  if (!feed.courseMembers.length) {
    return;
  }

  // else send to everyone except the author of the post
  const emailsData = feed.courseMembers.map((member) => ({
    from: `"${feed.org.name} - ClassroomIO" <notify@mail.classroomio.com>`,
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
  }));
  console.log('Sending emails to all students', feed.courseMembers.length);

  // This is the email sending function with a loop
  await sendEmail(sFetch)(emailsData);
};

export async function POST({ fetch, request }) {
  const { authorId, feedId, comment } = await request.json();
  console.log('/POST api/email/course/newsfeed');

  if (!authorId || !feedId) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  await sendEmailNotification(fetch, feedId, authorId, comment);
  // TODO: Support sending to other platforms like telegram and discord
  // sendDiscordNotification(); sendTelegramNotification();

  return json({
    success: true,
    message: 'Email sent'
  });
}
