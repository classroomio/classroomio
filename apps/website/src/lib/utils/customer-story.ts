export interface CustomerStoryStat {
  value: string;
  label: string;
}

export interface CustomerStory {
  eyebrow: string;
  heading: string;
  subtitle: string;
  quote: string;
  '\u201cI think my favorite part of using ClassroomIO, however, has been the extremely professional and prompt response from their team.\u201d';
  speakerRole: string;
  videoLabel: string;
  videoDuration: string;
  videoUrl: string;
  videoDialogTitle: string;
  closeLabel: string;
  posterUrl: string;
  posterAlt: string;
  watchLabel: string;
  playAriaLabel: string;
  logoUrl: string;
  logoAlt: string;
  cardHeading: string;
  cardBody: string;
  stats: CustomerStoryStat[];
  ctaLabel: string;
  ctaHref: string;
}

export const CUSTOMER_STORY: CustomerStory = {
  eyebrow: 'Customer stories',
  heading: 'An extremely professional and prompt response.',
  subtitle: "Andrew Bedell built SensorHubb's customer training on ClassroomIO. Here is what he says about our team.",
  quote:
    '\u201cI think my favorite part of using ClassroomIO, however, has been the extremely professional and prompt response from their team.\u201d',
  speakerName: 'Andrew Bedell',
  speakerRole: 'Strategy and Operations Intern, SensorHubb',
  videoLabel: 'Customer story',
  videoDuration: '1:39',
  videoUrl: 'https://assets.cdn.clsrio.com/www/home/andrew-bedell-sensorhubb-website.mp4',
  videoDialogTitle: 'Andrew Bedell on building SensorHubb customer training with ClassroomIO',
  closeLabel: 'Close video',
  posterUrl: '/customer-stories/sensorhubb/poster.webp',
  posterAlt: 'Andrew Bedell, Strategy and Operations Intern at SensorHubb, looking at the camera',
  watchLabel: 'Watch the story',
  playAriaLabel: 'Play the customer story from Andrew Bedell, 1 minute 39 seconds',
  logoUrl: '/customer-stories/sensorhubb/logo.png',
  logoAlt: 'SensorHubb',
  cardHeading: 'SensorHubb built its customer training on ClassroomIO.',
  cardBody:
    "Andrew built a self-paced programme that teaches SensorHubb's customers how to use its product. He found customisation options and edge-case support he had not seen in other learning platforms, and says the team's quick, professional replies show they care about their customers and the experience.",
  stats: [
    { value: '5 stars', label: 'what Andrew would give us' },
    { value: 'Recommended', label: 'for any SaaS platform that trains customers' }
  ],
  ctaLabel: 'Become an early adopter',
  ctaHref: '/pricing'
};
