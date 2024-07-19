export async function updatePathway(
  // collectionId: Course['id'],
  // avatar: string | undefined,
  // course: Partial<Course>
) {
  console.log('update successful');
  
  // if (avatar && collectionId) {
  //   const filename = `course/${collectionId + Date.now()}.webp`;

  //   const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
  //     cacheControl: '3600',
  //     upsert: false
  //   });

  //   if (data) {
  //     const { data: response } = supabase.storage.from('avatars').getPublicUrl(filename);

  //     if (!response.publicUrl) return;

  //     course.logo = response.publicUrl;
  //   }
  // }

  // await supabase.from('course').update(course).match({ id: collectionId });

  // return course.logo;
}
