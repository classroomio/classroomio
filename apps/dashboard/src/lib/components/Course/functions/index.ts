import JSZip from 'jszip';

import type { Course, Lesson, LessonSection } from '$lib/utils/types';
import { ROUTES } from '../constants';
import { generateLessonHTML, generateScormAPI, generateScormManifest } from './scorm';

// Generate SCORM index.html file
export function generateScormIndexHTML(course: Course, lessons: Lesson[]): string {
  const lessonList = lessons
    .map(
      (lesson, index) => `
    <li class="lesson-item">
      <a href="lesson_${lesson.id}.html" class="lesson-link" onclick="launchLesson('lesson_${lesson.id}.html', '${lesson.title}')">
        <span class="lesson-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="lesson-title">${lesson.title}</span>
        <span class="lesson-duration">${(lesson as any).exercises?.length || 0} exercises</span>
      </a>
    </li>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${course.title} - SCORM Course</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: rgb(2, 51, 189);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .course-info {
            padding: 30px 40px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .course-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .meta-item {
            width: 40%;
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .meta-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .meta-value {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .lessons-container {
            padding: 40px;
        }
        
        .lessons-header {
            margin-bottom: 30px;
        }
        
        .lessons-header h2 {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .lessons-list {
            list-style: none;
            display: grid;
            gap: 15px;
        }
        
        .lesson-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .lesson-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border-color: #667eea;
        }
        
        .lesson-link {
            display: flex;
            align-items: center;
            padding: 20px;
            text-decoration: none;
            color: inherit;
            gap: 20px;
        }
        
        .lesson-number {
            background: rgb(2, 51, 189);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
        }
        
        .lesson-title {
            flex: 1;
            font-size: 1.1rem;
            font-weight: 500;
            color: #2c3e50;
        }
        
        .lesson-duration {
            color: #6c757d;
            font-size: 0.9rem;
        }
        
        .footer {
            padding: 30px 40px;
            background: #f8f9fa;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .btn {
            background: rgb(2, 51, 189);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .container { margin: 10px; border-radius: 8px; }
            .header, .lessons-container { padding: 20px; }
            .lesson-link { padding: 15px; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${course.title}</h1>
            <p>${course.description || 'Welcome to this SCORM course'}</p>
        </header>
        
        <div class="course-info">
            <div class="course-meta">
                <div class="meta-item">
                    <div class="meta-label">Total Lessons</div>
                    <div class="meta-value">${lessons.length}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Version</div>
                    <div class="meta-value">${course.version || 'V1'}</div>
                </div>
            </div>
        </div>
        
        <div class="lessons-container">
            <div class="lessons-header">
                <h2>Lessons</h2>
                <p>Click on any lesson below to begin learning</p>
            </div>
            
            <ul class="lessons-list">
                ${lessonList}
            </ul>
        </div>
        
        <footer class="footer">
            <button class="btn" onclick="startCourse()">Start Course</button>
        </footer>
    </div>

    <script src="scorm-api.js"></script>
    <script>
        function launchLesson(lessonFile, lessonTitle) {
            // Track lesson access
            if (window.scorm && window.scorm.isInitialized) {
                window.scorm.setLocation(lessonFile);
                window.scorm.commit();
            }
            
            // Open lesson in current window
            window.location.href = lessonFile;
        }
        
        function startCourse() {
            const firstLesson = document.querySelector('.lesson-link');
            if (firstLesson) {
                // Start timing
                if (window.scorm) {
                    window.scorm.startTimer();
                }
                firstLesson.click();
            }
        }
        
        // Initialize course tracking
        document.addEventListener('DOMContentLoaded', function() {
            if (window.scorm && window.scorm.isInitialized) {
                // Get student info and display if needed
                const studentInfo = window.scorm.getStudentInfo();
                console.log('Student Info:', studentInfo);
                
                // Set course entry point
                window.scorm.setLocation('index.html');
                window.scorm.commit();
            }
        });
    </script>
</body>
</html>`;
}

// Generate common CSS file for SCORM package
export function generateScormCSS(): string {
  return `/* SCORM Package Common Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

.scorm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  min-height: 100vh;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
}

.scorm-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.scorm-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 300;
}

.scorm-content {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.scorm-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 30px;
}

.scorm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.scorm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.scorm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.scorm-progress {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 20px 0;
}

.scorm-progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.scorm-quiz {
  background: white;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin: 20px 0;
}

.scorm-question {
  margin-bottom: 30px;
}

.scorm-question h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.scorm-options {
  list-style: none;
  margin: 15px 0;
}

.scorm-options li {
  margin: 10px 0;
}

.scorm-options input[type="radio"],
.scorm-options input[type="checkbox"] {
  margin-right: 10px;
}

.scorm-options label {
  cursor: pointer;
  padding: 10px;
  display: block;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.scorm-options label:hover {
  background-color: #f8f9fa;
}

.scorm-video {
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  display: block;
  border-radius: 8px;
}

.scorm-alert {
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
}

.scorm-alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.scorm-alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.scorm-alert.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 768px) {
  .scorm-container {
    padding: 10px;
  }
  
  .scorm-header {
    padding: 20px;
  }
  
  .scorm-header h1 {
    font-size: 1.5rem;
  }
  
  .scorm-navigation {
    flex-direction: column;
    gap: 15px;
  }
  
  .scorm-btn {
    width: 100%;
    text-align: center;
  }
}

@media print {
  .scorm-navigation,
  .scorm-btn {
    display: none;
  }
  
  .scorm-container {
    box-shadow: none;
    padding: 0;
  }
}`;
}

// Create file structure for SCORM package
export function createScormPackageStructure(course: Course, content: any) {
  const files = {
    // Main files
    'index.html': content.indexHTML,
    'imsmanifest.xml': content.manifestXml,
    'scorm-api.js': content.scormAPI,
    'styles.css': generateScormCSS(),

    // Lesson files
    ...Object.keys(content.lessonHTMLPages).reduce(
      (acc, lessonId) => {
        acc[`lesson_${lessonId}.html`] = content.lessonHTMLPages[lessonId];
        return acc;
      },
      {} as Record<string, string>
    )
  };

  return files;
}

export function getGroupMemberId(people, profileId) {
  const groupMember = people.find((person) => person.profile_id === profileId);

  return groupMember ? groupMember.id : null;
}

export function getNavItemRoute(courseId, routeId?: string) {
  const path = `/${ROUTES.COURSES}/${courseId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}

export function getLessonsRoute(courseId, lessonId?: string) {
  const path = getNavItemRoute(courseId, ROUTES.LESSONS);

  if (!lessonId) {
    return path;
  }

  return `${path}/${lessonId}`;
}

export function getLectureNo(index, initNo = '0') {
  if (index <= 9) {
    return `${initNo}${index}`;
  }

  return index;
}

export function formatAnswers(data) {
  const answers: Record<string, string> = {};
  const questionByIdAndName = {};

  for (const question of data.questions) {
    questionByIdAndName[question.id] = question.name;
  }

  for (const answer of data.answers) {
    const questionName = questionByIdAndName[answer.question_id];

    answers[questionName] =
      Array.isArray(answer.answers) && answer.answers.length ? answer.answers : answer.open_answer;
  }

  return answers;
}

// Test function to preview generated HTML and manifest (server-side version)
export const testScormHtmlGeneration = (
  course: Course,
  lessons?: Lesson[],
  lessonSections?: LessonSection[]
) => {
  console.log('🧪 Testing SCORM HTML & Manifest Generation...');

  if (!lessons || lessons.length === 0) {
    console.error('❌ No lessons provided for testing');
    return;
  }

  // Generate HTML for first lesson
  const firstLesson = lessons[0];
  const generatedHTML = generateLessonHTML(firstLesson, course, 0);

  // Generate SCORM manifest
  const manifestXml = generateScormManifest(course, lessons, lessonSections);

  console.log('✅ Generation Test Results:');
  console.log(`📝 Course: "${course.title}"`);
  console.log(`📊 Total lessons: ${lessons.length}`);
  console.log(`🗂️ Lesson sections: ${lessonSections?.length || 0}`);
  console.log(`📄 HTML length: ${generatedHTML.length} characters`);
  console.log(`📋 Manifest length: ${manifestXml.length} characters`);

  // Server-side: Just log the content for debugging
  console.log('📋 Manifest preview:');
  console.log(manifestXml.substring(0, 800) + '...');

  console.log('📄 HTML preview (first 500 chars):');
  console.log(generatedHTML.substring(0, 500) + '...');

  return {
    lessonTitle: firstLesson.title,
    htmlContent: generatedHTML,
    manifestXml: manifestXml,
    courseTitle: course.title,
    lessonsCount: lessons.length,
    success: true
  };
};

export const handleScormExport = (course: Course) => {
  console.log('course:', course);

  // Extract lessons and lesson sections from the course object
  const lessons = course.lessons || [];
  const lessonSections = course.lesson_section || [];

  console.log('Lessons:', lessons);
  console.log('Lesson Sections:', lessonSections);

  if (!lessons || lessons.length === 0) {
    console.warn('No lessons found for SCORM export');
    return;
  }

  // Generate HTML for each lesson
  const lessonHTMLPages: { [key: string]: string } = {};

  lessons.forEach((lesson, index) => {
    const lessonHTML = generateLessonHTML(lesson, course, index);
    lessonHTMLPages[lesson.id] = lessonHTML;

    if (index === 0) {
      console.log('Sample lesson HTML generated:', lessonHTML.substring(0, 500) + '...');
    }
  });

  // Generate SCORM manifest
  const manifestXml = generateScormManifest(course, lessons, lessonSections);
  console.log('SCORM manifest generated');

  // Generate SCORM index.html
  const indexHTML = generateScormIndexHTML(course, lessons);
  console.log('SCORM index.html generated');

  // Generate SCORM API JavaScript
  const scormAPI = generateScormAPI();
  console.log('SCORM API JavaScript generated');

  // Create complete package structure
  const packageContent = {
    indexHTML,
    scormAPI,
    lessonHTMLPages,
    manifestXml,
    lessons,
    course
  };

  const scormFiles = createScormPackageStructure(course, packageContent);
  console.log('SCORM package structure created');

  // testScormHtmlGeneration(course, lessons, lessonSections);

  // Return complete SCORM package ready for ZIP creation
  return {
    files: scormFiles,
    packageInfo: {
      name: course.slug || 'scorm-course',
      version: course.version || '1.0.0',
      title: course.title,
      lessonsCount: lessons.length,
      fileCount: Object.keys(scormFiles).length
    },
    ...packageContent
  };
};

export async function createScormZip(scormExportResult: any): Promise<Blob> {
  const zip = new JSZip();

  // Add all files to ZIP
  Object.entries(scormExportResult.files).forEach(([filename, content]) => {
    zip.file(filename, content as string);
  });

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
