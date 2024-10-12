import fs from 'fs';
import path from 'path';

// Define the load function to fetch JSON data
export const load = async () => {
  // Specify the path to the JSON file
  const dataFilePath = path.join(process.cwd(), 'src/lib/data/home.json');
  const coursesFilePath = path.join(process.cwd(), 'src/lib/data/courses.json');

  // Read the JSON file
  const dataFile = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  const coursesFile = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));

  console.log('server data', dataFile, coursesFile);
  // Return the JSON data to the page
  return {
    data: dataFile,
    courses: coursesFile
  };
};
