const title = 'Customer academy ROI calculator | ClassroomIO';
const description =
  'Estimate what a customer academy could save in support tickets. Enter your own ticket volume, cost per ticket and academy cost. Free, no signup.';

export function load() {
  return {
    pageMetaTags: {
      title,
      description,
      openGraph: { title, description },
      twitter: { title, description }
    }
  };
}
