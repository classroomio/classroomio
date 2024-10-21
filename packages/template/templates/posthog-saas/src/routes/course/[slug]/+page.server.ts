// import fs from 'fs';
// import path from 'path';

// export const load = async ({ params }) => {
//   const slug = params.slug || '';
//   const courseDirPath = path.join(process.cwd(), `src/lib/courses/${slug}`);

//   // Path to the metadata.json file
//   const courseFilePath = path.join(courseDirPath, 'metadata.json');

//   // Read metadata.json
//   const metadata = JSON.parse(fs.readFileSync(courseFilePath, 'utf-8'));

//   // Get all markdown files from the course directory
//   const lessonFiles = fs.readdirSync(courseDirPath).filter((file) => file.endsWith('.md'));

//   // Extract title and position from the front matter of each lesson
//   const lessons = lessonFiles.map((lessonFile) => {
//     const lessonFilePath = path.join(courseDirPath, lessonFile);
//     const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

//     // Correct regex to extract the entire front matter block
//     const frontMatterMatch = lessonContent.match(/---\s*([\s\S]+?)\s*---/);

//     let position = 1;
//     let title = lessonFile.replace('.md', ''); // Default title from filename

//     if (frontMatterMatch) {
//       console.log('front matter', 'true', frontMatterMatch);
//       const frontMatter = frontMatterMatch[1];

//       // Extract title and position from the front matter block
//       const titleMatch = frontMatter.match(/title:\s*['"](.+?)['"]/);
//       const positionMatch = frontMatter.match(/position:\s*(\d+)/);

//       if (titleMatch) {
//         title = titleMatch[1].trim();
//       }

//       if (positionMatch) {
//         position = parseInt(positionMatch[1], 10);
//       }
//     }

//     return { title, position, filename: lessonFile };
//   });

//   // Sort lessons by position
//   lessons.sort((a, b) => a.position - b.position);
//   console.log('lesson bakend', lessons);
//   return { metadata, lessons, slug };
// };

import fs from 'fs';
import path from 'path';

export const load = async ({ params }) => {
  const slug = params.slug || '';
  const courseDirPath = path.join(process.cwd(), `src/lib/courses/${slug}`);

  // Path to the metadata.json file for the course
  const courseFilePath = path.join(courseDirPath, 'metadata.json');

  // Read metadata.json
  const metadata = JSON.parse(fs.readFileSync(courseFilePath, 'utf-8'));

  // Get all sections (directories) within the course directory
  const sections = fs
    .readdirSync(courseDirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const lessonsBySection = [];

  // Loop through each section to get its lessons
  for (const section of sections) {
    const sectionDirPath = path.join(courseDirPath, section);

    // Get all markdown files in the section directory
    const lessonFiles = fs.readdirSync(sectionDirPath).filter((file) => file.endsWith('.md'));

    // Extract title and position from each lesson's front matter
    const lessons = lessonFiles.map((lessonFile) => {
      const lessonFilePath = path.join(sectionDirPath, lessonFile);
      const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

      // Regex to extract the front matter block
      const frontMatterMatch = lessonContent.match(/---\s*([\s\S]+?)\s*---/);

      let position = 1;
      let title = lessonFile.replace('.md', ''); // Default title from filename

      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];

        // Extract title and position from the front matter
        const titleMatch = frontMatter.match(/title:\s*['"](.+?)['"]/);
        const positionMatch = frontMatter.match(/position:\s*(\d+)/);

        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        if (positionMatch) {
          position = parseInt(positionMatch[1], 10);
        }
      }

      return { title, position, filename: lessonFile };
    });

    // Sort lessons by position within the section
    lessons.sort((a, b) => a.position - b.position);

    // Add section title and published status from section metadata (if available)
    const sectionMetadataPath = path.join(sectionDirPath, 'metadata.json');
    let sectionMetadata = { title: section, published: true };

    if (fs.existsSync(sectionMetadataPath)) {
      sectionMetadata = JSON.parse(fs.readFileSync(sectionMetadataPath, 'utf-8'));
    }

    // Add the section and its sorted lessons to the result
    lessonsBySection.push({
      title: sectionMetadata.title,
      published: sectionMetadata.published,
      children: lessons.map((lesson) => lesson.title),
      lessonDetails: lessons // Extra details like position and filename
    });
  }

  return { metadata, sections: lessonsBySection, slug };
};
