export const load = ({ params }) => {
  return {
    courseId: params.courseId || '',
    publicId: params.publicId || ''
  };
};
