// import fs from 'fs';
// import path from 'path';

// // Define the load function to fetch JSON data
// export const load = async () => {
//   // Specify the path to the JSON file
//   const dataFilePath = path.join(process.cwd(), 'src/lib/data/home.json');
//   const coursesFilePath = path.join(process.cwd(), 'src/lib/data/courses.json');

//   // Read the JSON file
//   const dataFile = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
//   const coursesFile = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));

//   console.log('server data', dataFile, coursesFile);
//   // Return the JSON data to the page
//   return {
//     data: dataFile,
//     courses: coursesFile
//   };
// };

import fs from 'fs';
import path from 'path';

export const load = () => {
  const courseDirPath = path.join(process.cwd(), '/src/lib/courses/');
  const orgDirPath = path.join(process.cwd(), 'src/lib/data/home.json');

  const orgData = JSON.parse(fs.readFileSync(orgDirPath, 'utf8'));

  // Read the list of course directories
  const coursesData = fs.readdirSync(courseDirPath).map((courseFolder) => {
    const courseFolderPath = path.join(courseDirPath, courseFolder);

    // Path to the metadata.json file for this course
    const metadataFilePath = path.join(courseFolderPath, 'metadata.json');

    // Read metadata.json
    const metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));

    // Get all markdown (.md) files from the course directory
    const lessonFiles = fs.readdirSync(courseFolderPath).filter((file) => file.endsWith('.md'));

    return {
      data: {
        ...metadata,
        slug: courseFolder
      }, // Course metadata
      lessons: lessonFiles.length // Number of lessons (.md files)
    };
  });

  return { org: orgData, courses: coursesData };
};
