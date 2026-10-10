export interface CustomerStoryStat {
  value: string;
  label: string;
}

export interface CustomerStory {
  eyebrow: string;
  heading: string;
  subtitle: string;
  quote: string;
  speakerName: string;
  speakerRole: string;
  videoLabel: string;
  videoDuration: string;
  videoUrl: string;
  videoDialogTitle: string;
  closeLabel: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  watchLabel: string;
  playAriaLabel: string;
  logoUrl: string;
  logoAlt: string;
  cardHeading: string;
  cardBody: string;
  stats: CustomerStoryStat[];
  statsCaption: string;
  ctaLabel: string;
  ctaHref: string;
}

export const CUSTOMER_STORY: CustomerStory = {
  eyebrow: 'Customer stories',
  heading: 'Fixed by the end of the day, every time.',
  subtitle:
    "Andrew Bedell built SensorHubb's customer training on ClassroomIO as a summer intern. Here is what he says about working with our team.",
  quote: 'Every single time, they fixed it by the end of the day, without fail.',
  speakerName: 'Andrew Bedell',
  speakerRole: 'Intern, SensorHubb',
  videoLabel: 'Customer story',
  videoDuration: '1:39',
  videoUrl: 'https://assets.cdn.clsrio.com/www/home/andrew-bedell-sensorhubb-website.mp4',
  videoDialogTitle: 'Andrew Bedell on building SensorHubb customer training with ClassroomIO',
  closeLabel: 'Close video',
  thumbnailUrl: '/customer-stories/sensorhubb/thumbnail.webp',
  thumbnailAlt: 'Andrew Bedell, intern at SensorHubb, looking at the camera',
  watchLabel: 'Watch the story',
  playAriaLabel: 'Play the customer story from Andrew Bedell, 1 minute 39 seconds',
  logoUrl: '/customer-stories/sensorhubb/logo.png',
  logoAlt: 'SensorHubb',
  cardHeading: 'SensorHubb built its customer training on ClassroomIO.',
  cardBody:
    "Andrew built a self-paced programme that teaches SensorHubb's customers how to use its product. He found customisation options and edge-case support he had not seen in other learning platforms, and a team that answers bug reports within an hour.",
  stats: [
    { value: 'Within an hour', label: 'first reply to his bug reports' },
    { value: 'Same day', label: 'fix, every time he reported one' }
  ],
  statsCaption: 'As reported by Andrew Bedell',
  ctaLabel: 'Become an early adopter',
  ctaHref: '/pricing'
};
