import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const welcomeEmail = defineEmail({
  id: 'welcome',
  subject: 'Welcome to ClassroomIO!',
  schema: z.object({
    name: z.string().min(1)
  }),
  render: (fields) => {
    const content = `
    <p>Dear ${fields.name},</p>
    <p>My name is Best, the founder of ClassroomIO. I saw you signed up, any questions so far?</p>
    <p>
     Would you like to get a walkthrough of the platform in a 30 minutes product demo? It's free and we won't try to sell you anything, just want to learn from your use case and show you all the cool features and flows we thought about.
    </p>
    <p>
      Interested? just book a 30-minute demo slot in our calendar!
    </p>
    <div>
      <a class="button" href="https://classroomio.com/demo">Book demo</a>
    </div>
    <p>
      PS: I reply personally to every email. We don't have an outsourced support team at the other end of the globe.. ;-)
    </p>
  `;

    return getDefaultTemplate(content);
  }
});
