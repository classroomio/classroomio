import { db, exercise } from '@db/drizzle';

interface SeedExercise {
  mvcSectionId: string;
  reactSectionId: string;
  pandasSectionId: string;
}

export async function seedExercise({ mvcSectionId, reactSectionId, pandasSectionId }: SeedExercise) {
  const existingExercises = await db.select().from(exercise);
  const existingExerciseIds = existingExercises.map((e) => e.id);

  const exercisesToInsert = [
    {
      id: 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862',
      title: 'MVC essentials quiz',
      description: "<p>This exercise tests your knowledge of what we've covered in the first lesson.</p>",
      lessonId: '5c75f4f1-c222-44a9-a8c6-81773ea33872',
      sectionId: mvcSectionId
    },
    {
      id: '8b6084b0-a936-411d-9408-a1289aeed068',
      title: 'MVC Components quiz',
      lessonId: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
      sectionId: mvcSectionId
    },
    {
      id: '43f43374-7df0-4e02-b839-56403f71473a',
      title: 'NodeJS MVC Quiz',
      lessonId: '266b3daa-1eb2-401e-9510-1819952b44b7',
      sectionId: mvcSectionId
    },
    {
      id: 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
      title: 'Introduction To React: Quiz',
      lessonId: '6f2d8142-0903-425c-8534-f5105b624752',
      sectionId: reactSectionId
    },
    {
      id: '43ead5d7-af88-47cf-8f86-99124f5eb0cd',
      title: 'Components And Props Quiz',
      lessonId: '0a39ab2f-9451-4a90-902c-3030bf965637',
      sectionId: reactSectionId
    },
    {
      id: 'b0770deb-a8a0-4efe-9d28-8bf1298c04b2',
      title: 'React State And Lifecycle Quiz',
      lessonId: '80b79665-733b-41bf-9853-34fd8ab50496',
      sectionId: reactSectionId
    },
    {
      id: '6f1063ed-3791-43fe-81e9-ad3b007834fa',
      title: 'Introduction to Python - Quiz',
      lessonId: '5e5c8221-4c11-4c40-8664-11743bb79579',
      dueBy: '2023-12-21T18:21:00.000Z',
      sectionId: pandasSectionId
    },
    {
      id: 'bd6e81c7-3d28-4037-acf0-a3028c583771',
      title: 'Delving Into Data Analysis With Pandas - Quiz',
      lessonId: '829da386-8ccd-4c81-b2fb-b9891102c83c',
      sectionId: pandasSectionId
    },
    {
      id: 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1',
      title: 'Data Cleaning And Preprocessing Techniques - Quiz',
      lessonId: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1',
      sectionId: pandasSectionId
    }
  ].filter((e) => !existingExerciseIds.includes(e.id));

  if (exercisesToInsert.length > 0) {
    await db.insert(exercise).values(exercisesToInsert);
    console.log(`   ✓ Inserted ${exercisesToInsert.length} exercise(s)`);
  } else {
    console.log('   ✓ Exercises already exist, skipping');
  }
}
