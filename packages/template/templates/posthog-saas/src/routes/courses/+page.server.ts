import fs from 'fs';
import path from 'path';

export const load = async () => {
  const dataFilePath = path.join(process.cwd(), 'src/lib/data/home.json');
  const coursesFilePath = path.join(process.cwd(), 'src/lib/data/courses.json');

  const dataFile = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  const coursesFile = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));

  return {
    data: dataFile,
    courses: coursesFile
  };
};
