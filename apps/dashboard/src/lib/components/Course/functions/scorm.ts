import type { Course, Lesson, LessonSection } from '$lib/utils/types';

// Helper function to escape XML special characters
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper function to generate SCORM imsmanifest.xml (SCORM 2004 4th Edition)
export function generateScormManifest(
  course: Course,
  lessons: Lesson[],
  lessonSections?: LessonSection[]
): string {
  const manifestId = `ClassroomIO_Course_${course.id}`;
  const orgId = `${course.slug || course.id}_TOC`;
  const currentDate = new Date().toISOString();

  // Escape XML content
  const courseTitle = escapeXml(course.title);
  const courseDescription = escapeXml(course.description || '');
  const courseOverview = escapeXml(course.overview || '');

  // Get organization/author info
  const authorName = course.group?.tutors?.[0]?.fullname || 'ClassroomIO';
  const authorEmail = course.group?.tutors?.[0]?.email || '';

  let manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3" 
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3" 
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3" 
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xmlns:lom="http://ltsc.ieee.org/xsd/LOM" 
          identifier="${manifestId}" 
          version="1" 
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd 
                              http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd 
                              http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd 
                              http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd 
                              http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd 
                              http://ltsc.ieee.org/xsd/LOM lom.xsd">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
    <lom:lom>
      <lom:general>
        <lom:identifier>
          <lom:catalog>URI</lom:catalog>
          <lom:entry>${course.id}</lom:entry>
        </lom:identifier>
        <lom:title>
          <lom:string language="en-US">${courseTitle}</lom:string>
        </lom:title>
        <lom:description>
          <lom:string language="en-US">${courseDescription}</lom:string>
        </lom:description>
        <lom:keyword>
          <lom:string language="en-US">classroomio</lom:string>
        </lom:keyword>
        <lom:keyword>
          <lom:string language="en-US">e-learning</lom:string>
        </lom:keyword>
      </lom:general>
      <lom:lifeCycle>
        <lom:version>
          <lom:string language="en-US">1.0</lom:string>
        </lom:version>
        <lom:status>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>final</lom:value>
        </lom:status>
        <lom:contribute>
          <lom:role>
            <lom:source>LOMv1.0</lom:source>
            <lom:value>author</lom:value>
          </lom:role>
          <lom:entity>BEGIN:VCARD
VERSION:3.0
FN:${escapeXml(authorName)}
EMAIL:${authorEmail}
ORG:ClassroomIO
END:VCARD</lom:entity>
          <lom:date>
            <lom:dateTime>${currentDate}</lom:dateTime>
          </lom:date>
        </lom:contribute>
      </lom:lifeCycle>
      <lom:technical>
        <lom:format>text/html</lom:format>
        <lom:requirement>
          <lom:orComposite>
            <lom:type>
              <lom:source>LOMv1.0</lom:source>
              <lom:value>browser</lom:value>
            </lom:type>
            <lom:name>
              <lom:source>LOMv1.0</lom:source>
              <lom:value>any</lom:value>
            </lom:name>
          </lom:orComposite>
        </lom:requirement>
      </lom:technical>
      <lom:educational>
        <lom:interactivityType>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>mixed</lom:value>
        </lom:interactivityType>
        <lom:learningResourceType>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>lesson</lom:value>
        </lom:learningResourceType>
        <lom:interactivityLevel>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>medium</lom:value>
        </lom:interactivityLevel>
        <lom:difficulty>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>medium</lom:value>
        </lom:difficulty>
        <lom:typicalLearningTime>
          <lom:duration>PT${lessons.length * 30}M</lom:duration>
        </lom:typicalLearningTime>
        <lom:description>
          <lom:string language="en-US">${courseOverview}</lom:string>
        </lom:description>
        <lom:language>en-US</lom:language>
      </lom:educational>
    </lom:lom>
  </metadata>
  
  <organizations default="${orgId}">
    <organization identifier="${orgId}" adlseq:objectivesGlobalToSystem="false">
      <title>${courseTitle}</title>`;

  // Group lessons by sections if available, otherwise treat all lessons as one section
  if (lessonSections && lessonSections.length > 0) {
    // Handle sectioned lessons
    lessonSections.forEach((section, sectionIndex) => {
      const sectionLessons = lessons.filter((lesson) => lesson.section_id === section.id);

      if (sectionLessons.length > 0) {
        const sectionTitle = escapeXml(section.title);
        manifestXml += `
      
      <item identifier="section_${sectionIndex}" isvisible="true">
        <title>${sectionTitle}</title>`;

        sectionLessons.forEach((lesson, lessonIndex) => {
          const lessonTitle = escapeXml(lesson.title);
          manifestXml += `
        <item identifier="lesson_${lesson.id}" identifierref="resource_${lesson.id}" isvisible="true">
          <title>${lessonTitle}</title>
        </item>`;
        });

        manifestXml += `
      </item>`;
      }
    });

    // Handle lessons not in any section
    const unsectionedLessons = lessons.filter((lesson) => !lesson.section_id);
    if (unsectionedLessons.length > 0) {
      manifestXml += `
      
      <item identifier="section_general" isvisible="true">
        <title>General Lessons</title>`;

      unsectionedLessons.forEach((lesson, lessonIndex) => {
        const lessonTitle = escapeXml(lesson.title);
        manifestXml += `
        <item identifier="lesson_${lesson.id}" identifierref="resource_${lesson.id}" isvisible="true">
          <title>${lessonTitle}</title>
        </item>`;
      });

      manifestXml += `
      </item>`;
    }
  } else {
    // Handle lessons without sections
    lessons.forEach((lesson, lessonIndex) => {
      const lessonTitle = escapeXml(lesson.title);
      manifestXml += `
      <item identifier="lesson_${lesson.id}" identifierref="resource_${lesson.id}" isvisible="true">
        <title>${lessonTitle}</title>
      </item>`;
    });
  }

  manifestXml += `
    </organization>
  </organizations>
  
  <resources>`;

  // Add resources for each lesson
  lessons.forEach((lesson, lessonIndex) => {
    const lessonTitle = escapeXml(lesson.title);
    manifestXml += `
    <resource identifier="resource_${lesson.id}" 
              type="webcontent" 
              adlcp:scormType="sco" 
              href="content/lessons/lesson_${lesson.id}.html">
      <file href="content/lessons/lesson_${lesson.id}.html"/>
      <file href="content/assets/css/styles.css"/>
      <file href="content/assets/js/scorm-api.js"/>
      <metadata>
        <lom:lom>
          <lom:general>
            <lom:title>
              <lom:string language="en-US">${lessonTitle}</lom:string>
            </lom:title>
          </lom:general>
          <lom:educational>
            <lom:learningResourceType>
              <lom:source>LOMv1.0</lom:source>
              <lom:value>lesson</lom:value>
            </lom:learningResourceType>
          </lom:educational>
        </lom:lom>
      </metadata>
    </resource>`;
  });

  manifestXml += `
  </resources>
</manifest>`;

  return manifestXml;
}

// Helper function to extract YouTube video ID from URL
export function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

// Helper function for embedding video
export function generateVideoHTML(videos: any[]): string {
  if (!videos || videos.length === 0) return '';

  const videoElements = videos
    .map((video) => {
      if (video.type === 'youtube') {
        const videoId = extractYouTubeId(video.link);
        return `
        <div class="video-container">
          <iframe 
            width="100%" 
            height="400" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allowfullscreen
            onload="videoLoaded()"
          ></iframe>
        </div>`;
      } else if (video.type === 'upload' || video.type === 'generic') {
        return `
        <div class="video-container">
          <video 
            width="100%" 
            height="400" 
            controls
            onloadeddata="videoLoaded()"
            onended="videoCompleted()"
          >
            <source src="${video.link}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>`;
      }
      return '';
    })
    .join('\n');

  return `
    <section class="lesson-videos">
      <h2>Videos</h2>
      ${videoElements}
    </section>`;
}

// Helper function for generating exercises HTML
export function generateExercisesHTML(exercises: any[]): string {
  if (!exercises || exercises.length === 0) return '';

  const exerciseElements = exercises
    .map((exercise, exerciseIndex) => {
      const questions = exercise.questions || [];

      const questionsHTML = questions
        .map((question, questionIndex) => {
          const hasOptions = question.options && question.options.length > 0;
          const isSingleAnswer = question.question_type_id === 1; // --- (radio buttons)
          const isMultipleAnswers = question.question_type_id === 2; // --- (checkboxes)
          const isParagraph = question.question_type_id === 3; // --- (textarea)

          let questionHTML = `
            <div class="exercise-question" data-question-id="${question.id}">
              <h4 class="question-title">
                <span class="question-number">Question ${questionIndex + 1}</span>
                ${escapeXml(question.title)}
                ${question.points > 0 ? `<span class="question-points">(${question.points} points)</span>` : ''}
              </h4>`;

          if (isParagraph || !hasOptions) {
            // Paragraph/text area question
            questionHTML += `
              <div class="question-input">
                <textarea 
                  id="question_${question.id}" 
                  name="question_${question.name}"
                  placeholder="Enter your answer here..."
                  rows="5"
                  onchange="trackQuestionInteraction('${question.id}', this.value)"
                ></textarea>
              </div>`;
          } else if (hasOptions && isSingleAnswer) {
            // Single answer question (radio buttons)
            const optionsHTML = question.options
              .map((option, optionIndex) => {
                return `
                  <label class="option-label">
                    <input 
                      type="radio" 
                      name="question_${question.name}" 
                      value="${option.value}" 
                      id="option_${option.id}"
                      onchange="trackQuestionInteraction('${question.id}', '${option.value}')"
                    />
                    <span class="option-text">${escapeXml(option.label)}</span>
                  </label>`;
              })
              .join('\n');

            questionHTML += `
              <div class="question-options">
                ${optionsHTML}
              </div>`;
          } else if (hasOptions && isMultipleAnswers) {
            // Multiple answers question (checkboxes)
            const optionsHTML = question.options
              .map((option, optionIndex) => {
                return `
                  <label class="option-label">
                    <input 
                      type="checkbox" 
                      name="question_${question.name}[]" 
                      value="${option.value}" 
                      id="option_${option.id}"
                      onchange="trackMultipleAnswers('${question.id}', '${question.name}')"
                    />
                    <span class="option-text">${escapeXml(option.label)}</span>
                  </label>`;
              })
              .join('\n');

            questionHTML += `
              <div class="question-options">
                ${optionsHTML}
              </div>`;
          }

          questionHTML += `</div>`;
          return questionHTML;
        })
        .join('\n');

      return `
        <div class="exercise-item" data-exercise-id="${exercise.id}">
          <div class="exercise-header">
            <h3 class="exercise-title">${escapeXml(exercise.title)}</h3>
            ${exercise.description ? `<p class="exercise-description">${escapeXml(exercise.description)}</p>` : ''}
            ${exercise.due_by ? `<p class="exercise-due-date">Due: ${new Date(exercise.due_by).toLocaleDateString()}</p>` : ''}
          </div>
          
          <form class="exercise-form" onsubmit="submitExercise(event, '${exercise.id}')">
            <div class="exercise-questions">
              ${questionsHTML}
            </div>
            
            <div class="exercise-actions">
              <button type="submit" class="submit-btn">
              Submit Exercise
              </button>
            </div>
          </form>
        </div>`;
    })
    .join('\n');

  return `
    <section class="lesson-exercises">
      <h2>Exercises</h2>
      <div class="exercises-container">
        ${exerciseElements}
      </div>
    </section>`;
}

// HTML page helper func
export function generateLessonHTML(lesson: Lesson, course: Course, lessonIndex: number): string {
  const videosHTML = generateVideoHTML(lesson.videos || []);
  const slideHTML = lesson.slide_url
    ? `
    <section class="lesson-slides">
      <h2>Slide</h2>
      <a href="${lesson.slide_url}" target="_blank" class="slide-link">Open Presentation Slide
      </a>
    </section>`
    : '';

  const exercisesHTML = generateExercisesHTML((lesson as any).exercises || []);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lesson.title}</title>
    <script src="../assets/js/scorm-api.js"></script>
    <link rel="stylesheet" href="../assets/css/styles.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .lesson-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        .lesson-header {
            background: rgb(2, 51, 189);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .lesson-number {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .lesson-title {
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }
        .lesson-content {
            padding: 30px;
        }
        .lesson-note {
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .lesson-videos, .lesson-slides, .lesson-exercises {
            margin-bottom: 30px;
        }
        .lesson-videos h2, .lesson-slides h2, .lesson-exercises h2 {
            color: #333;
            border-bottom: 2px solid #3a7ff7;
            padding-bottom: 10px;
        }
        .video-container {
            margin-bottom: 20px;
        }
        .slide-link {
            display: inline-block;
            background: #3a7ff7;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.3s;
        }
        .slide-link:hover {
            background: rgb(2, 51, 189);
        }
        
        /* Exercise Styles */
        .exercises-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        .exercise-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 25px;
        }
        .exercise-header {
            margin-bottom: 20px;
        }
        .exercise-title {
            color: #2c3e50;
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        .exercise-description {
            color: #6c757d;
            margin-bottom: 10px;
        }
        .exercise-due-date {
            color: #dc3545;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .exercise-questions {
            display: flex;
            flex-direction: column;
            gap: 25px;
            margin-bottom: 25px;
        }
        .exercise-question {
            background: white;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        .question-title {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        .question-number {
            background: #3a7ff7;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-right: 10px;
        }
        .question-points {
            color: #28a745;
            font-size: 0.9rem;
            font-weight: normal;
            margin-left: 10px;
        }
        .question-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .option-label {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .option-label:hover {
            background: #e7f3ff;
            border-color: #3a7ff7;
        }
        .option-label input[type="radio"] {
            margin-right: 12px;
        }
        .option-label input[type="checkbox"] {
            margin-right: 12px;
        }
        .option-text {
            flex: 1;
        }
        .question-input {
          display: flex;
        }
        .question-input textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        .question-input textarea:focus {
            outline: none;
            border-color: #3a7ff7;
            box-shadow: 0 0 0 2px rgba(58, 127, 247, 0.25);
        }
        .exercise-actions {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            align-items: center;
        }
        .reset-btn, .submit-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .reset-btn {
            background: #6c757d;
            color: white;
        }
        .reset-btn:hover {
            background: #5a6268;
        }
        .submit-btn {
            background: #28a745;
            color: white;
        }
        .submit-btn:hover {
            background: #218838;
        }
        
        .lesson-footer {
            background: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .complete-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        .complete-btn:hover {
            background: #218838;
        }
        .navigation {
            display: flex;
            gap: 10px;
        }
        .nav-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .nav-btn:hover {
            background: #5a6268;
        }
        .progress-indicator {
            font-size: 14px;
            color: #6c757d;
        }
        
        /* Success/Error Messages */
        .message {
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: 500;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body onload="initSCORM()" onunload="finishSCORM()">
    <div class="lesson-container">
        <header class="lesson-header">
            <div class="lesson-number">Lesson ${lessonIndex + 1}</div>
            <h1 class="lesson-title">${lesson.title}</h1>
        </header>
        
        <main class="lesson-content">
            <section class="lesson-note">
                <p>${lesson.note || 'No content available for this lesson.'}</p>
            </section>
            
            ${videosHTML}
            ${slideHTML}
            ${exercisesHTML}
        </main>
        
        <footer class="lesson-footer">
            <div class="progress-indicator">
                <span id="progress-text">Progress: Not started</span>
            </div>
            <div class="navigation">
                <button onclick="previousLesson()" class="nav-btn">← Previous</button>
                <button onclick="nextLesson()" class="nav-btn">Next →</button>
            </div>
        </footer>
    </div>

    <script>
        let currentProgress = 0;
        let hasViewedContent = false;
        let hasViewedVideo = false;
        let completedExercises = new Set();
        let questionResponses = {};
        
        // Track content viewing
        function trackContentView() {
            if (!hasViewedContent) {
                hasViewedContent = true;
                updateProgress(30);
                setBookmark('content_viewed');
            }
        }
        
        // Track video interactions
        function videoLoaded() {
            updateProgress(50);
            setBookmark('video_loaded');
        }
        
        function videoCompleted() {
            hasViewedVideo = true;
            updateProgress(80);
            setBookmark('video_completed');
        }
        
        // Track question interactions
        function trackQuestionInteraction(questionId, response) {
            questionResponses[questionId] = response;
            
            // Record interaction in SCORM
            if (window.scorm && window.scorm.isInitialized) {
                const result = response === '' ? 'unanswered' : 'answered';
                window.scorm.setInteraction(questionId, response, result, 'choice');
                window.scorm.commit();
            }
            
            updateProgress(Math.max(currentProgress, 60));
        }
        
        // Track multiple answer questions (checkboxes)
        function trackMultipleAnswers(questionId, questionName) {
            const checkboxes = document.querySelectorAll(\`input[name="question_\${questionName}[]"]:checked\`);
            const selectedValues = Array.from(checkboxes).map(cb => cb.value);
            const response = selectedValues.join(',');
            
            questionResponses[questionId] = response;
            
            // Record interaction in SCORM
            if (window.scorm && window.scorm.isInitialized) {
                const result = selectedValues.length > 0 ? 'answered' : 'unanswered';
                window.scorm.setInteraction(questionId, response, result, 'choice');
                window.scorm.commit();
            }
            
            updateProgress(Math.max(currentProgress, 60));
        }
        
        // Submit exercise
        function submitExercise(event, exerciseId) {
            event.preventDefault();
            
            const form = event.target;
            const formData = new FormData(form);
            const responses = {};
            
            // Collect all responses
            for (let [key, value] of formData.entries()) {
                responses[key] = value;
            }
            
            // Validate that all questions are answered
            const questions = form.querySelectorAll('.exercise-question');
            let allAnswered = true;
            
            questions.forEach(question => {
                const questionId = question.dataset.questionId;
                const inputs = question.querySelectorAll('input, textarea');
                let hasAnswer = false;
                
                inputs.forEach(input => {
                    if (input.type === 'radio' && input.checked) hasAnswer = true;
                    if (input.type === 'checkbox' && input.checked) hasAnswer = true;
                    if (input.type === 'textarea' && input.value.trim()) hasAnswer = true;
                    if (input.tagName === 'TEXTAREA' && input.value.trim()) hasAnswer = true;
                });
                
                if (!hasAnswer) {
                    allAnswered = false;
                    question.style.borderColor = '#dc3545';
                } else {
                    question.style.borderColor = '#28a745';
                }
            });
            
            if (!allAnswered) {
                showMessage('Please answer all questions before submitting.', 'error');
                return;
            }
            
            // Mark exercise as completed
            completedExercises.add(exerciseId);
            
            // Update progress
            const totalExercises = document.querySelectorAll('.exercise-item').length;
            const completionBonus = (completedExercises.size / totalExercises) * 20;
            updateProgress(Math.max(currentProgress, 80 + completionBonus));
            
            // Show success message
            showMessage('Exercise submitted successfully!', 'success');
            
            // Disable form to prevent resubmission
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitted';
            
            // Record in SCORM
            if (window.scorm && window.scorm.isInitialized) {
                const score = Math.floor(Math.random() * 20) + 80; // Simulate scoring
                window.scorm.setObjective(exerciseId, 'completed', score);
                window.scorm.commit();
            }
        }

        // Show message to user
        function showMessage(text, type = 'success') {
            // Remove existing messages
            document.querySelectorAll('.message').forEach(msg => msg.remove());
            
            const message = document.createElement('div');
            message.className = \`message \${type}\`;
            message.textContent = text;
            
            const content = document.querySelector('.lesson-content');
            content.insertBefore(message, content.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => message.remove(), 5000);
        }
        
        // Update progress display and SCORM data
        function updateProgress(percent) {
            currentProgress = Math.max(currentProgress, percent);
            const progressText = document.getElementById('progress-text');
            if (progressText) {
                progressText.textContent = \`Progress: \${currentProgress}%\`;
            }
            
            // Update SCORM progress
            if (typeof trackProgress === 'function') {
                trackProgress(currentProgress);
            }
        }
        
        // Navigation functions
        function previousLesson() {
            if (window.parent && window.parent.scormNavigation) {
                window.parent.scormNavigation.previous();
            }
        }
        
        function nextLesson() {
            // Mark current lesson as viewed before moving
            updateProgress(Math.max(currentProgress, 70));
            
            if (window.parent && window.parent.scormNavigation) {
                window.parent.scormNavigation.next();
            }
        }
        
        // Auto-track content viewing when user scrolls
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackContentView, 1000);
        });
        
        // Track initial page load
        setTimeout(trackContentView, 2000);
    </script>
</body>
</html>`;
}

// Generate SCORM API JavaScript file
export function generateScormAPI(): string {
  return `/** * SCORM API Wrapper */
class SCORMWrapper {
    constructor() {
        this.API = null;
        this.isInitialized = false;
        this.debugMode = true;
        this.data = {};
        
        // Initialize automatically
        this.initialize();
    }
    
    /**
     * Find the SCORM API in parent windows
     */
    findAPI(win = window) {
        let findAttempts = 0;
        const findAttemptLimit = 500;
        
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAttempts++;
            if (findAttempts > findAttemptLimit) {
                this.log('API search exceeded limit', 'error');
                return null;
            }
            win = win.parent;
        }
        
        if (win.API) {
            this.log('SCORM API found', 'success');
            return win.API;
        } else {
            this.log('SCORM API not found', 'warning');
            return null;
        }
    }
    
    /**
     * Initialize SCORM session
     */
    initialize() {
        if (this.isInitialized) {
            this.log('SCORM already initialized', 'warning');
            return true;
        }
        
        this.API = this.findAPI();
        
        if (this.API) {
            const result = this.API.LMSInitialize('');
            if (result === 'true') {
                this.isInitialized = true;
                this.log('SCORM initialized successfully', 'success');
                
                // Set initial values
                this.setValue('cmi.core.lesson_status', 'incomplete');
                this.setValue('cmi.core.session_time', '0000:00:00');
                this.commit();
                
                return true;
            } else {
                this.log('SCORM initialization failed: ' + this.getLastError(), 'error');
                return false;
            }
        } else {
            this.log('SCORM API not available - running in standalone mode', 'warning');
            return false;
        }
    }
    
    /**
     * Terminate SCORM session
     */
    terminate() {
        if (!this.isInitialized || !this.API) {
            this.log('SCORM not initialized, cannot terminate', 'warning');
            return false;
        }
        
        // Commit any pending data
        this.commit();
        
        const result = this.API.LMSFinish('');
        if (result === 'true') {
            this.isInitialized = false;
            this.log('SCORM terminated successfully', 'success');
            return true;
        } else {
            this.log('SCORM termination failed: ' + this.getLastError(), 'error');
            return false;
        }
    }
    
    /**
     * Get value from SCORM
     */
    getValue(parameter) {
        if (!this.isInitialized || !this.API) {
            this.log(\`Cannot get value \${parameter} - SCORM not initialized\`, 'warning');
            return this.data[parameter] || '';
        }
        
        const value = this.API.LMSGetValue(parameter);
        this.log(\`Retrieved: \${parameter} = \${value}\`, 'info');
        return value;
    }
    
    /**
     * Set value in SCORM
     */
    setValue(parameter, value) {
        if (!this.isInitialized || !this.API) {
            this.log(\`Cannot set value \${parameter} - SCORM not initialized, storing locally\`, 'warning');
            this.data[parameter] = value;
            return false;
        }
        
        const result = this.API.LMSSetValue(parameter, value);
        if (result === 'true') {
            this.log(\`Set: \${parameter} = \${value}\`, 'info');
            return true;
        } else {
            this.log(\`Failed to set \${parameter}: \` + this.getLastError(), 'error');
            return false;
        }
    }
    
    /**
     * Commit data to LMS
     */
    commit() {
        if (!this.isInitialized || !this.API) {
            this.log('Cannot commit - SCORM not initialized', 'warning');
            return false;
        }
        
        const result = this.API.LMSCommit('');
        if (result === 'true') {
            this.log('Data committed successfully', 'success');
            return true;
        } else {
            this.log('Commit failed: ' + this.getLastError(), 'error');
            return false;
        }
    }
    
    /**
     * Get last error
     */
    getLastError() {
        if (!this.API) return 'No API available';
        return this.API.LMSGetLastError() + ': ' + this.API.LMSGetErrorString(this.API.LMSGetLastError());
    }
    
    /**
     * Set lesson status
     */
    setStatus(status) {
        // Valid statuses: passed, completed, failed, incomplete, browsed, not attempted
        const validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'];
        if (!validStatuses.includes(status)) {
            this.log(\`Invalid status: \${status}\`, 'error');
            return false;
        }
        
        return this.setValue('cmi.core.lesson_status', status);
    }
    
    /**
     * Set score
     */
    setScore(raw, min = 0, max = 100) {
        const success = this.setValue('cmi.core.score.raw', raw.toString()) &&
                       this.setValue('cmi.core.score.min', min.toString()) &&
                       this.setValue('cmi.core.score.max', max.toString());
        
        if (success) {
            this.log(\`Score set: \${raw}/\${max}\`, 'info');
        }
        
        return success;
    }
    
    /**
     * Set lesson location (bookmark)
     */
    setLocation(location) {
        return this.setValue('cmi.core.lesson_location', location);
    }
    
    /**
     * Record session time
     */
    setSessionTime(timeInSeconds) {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = timeInSeconds % 60;
        
        const timeString = \`\${hours.toString().padStart(4, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        
        return this.setValue('cmi.core.session_time', timeString);
    }
    
    /**
     * Set student response for interaction
     */
    setInteraction(id, response, result, type = 'choice') {
        const interactions = this.getValue('cmi.interactions._count') || '0';
        const index = parseInt(interactions);
        
        this.setValue(\`cmi.interactions.\${index}.id\`, id);
        this.setValue(\`cmi.interactions.\${index}.student_response\`, response);
        this.setValue(\`cmi.interactions.\${index}.result\`, result);
        this.setValue(\`cmi.interactions.\${index}.type\`, type);
        this.setValue(\`cmi.interactions.\${index}.timestamp\`, new Date().toISOString());
        
        return this.setValue('cmi.interactions._count', (index + 1).toString());
    }
    
    /**
     * Record objective score
     */
    setObjective(id, status, score = null) {
        const objectives = this.getValue('cmi.objectives._count') || '0';
        const index = parseInt(objectives);
        
        this.setValue(\`cmi.objectives.\${index}.id\`, id);
        this.setValue(\`cmi.objectives.\${index}.status\`, status);
        
        if (score !== null) {
            this.setValue(\`cmi.objectives.\${index}.score.raw\`, score.toString());
        }
        
        return this.setValue('cmi.objectives._count', (index + 1).toString());
    }
    
    /**
     * Start time tracking
     */
    startTimer() {
        this.startTime = new Date().getTime();
        this.log('Timer started', 'info');
    }
    
    /**
     * Stop time tracking and record session time
     */
    stopTimer() {
        if (this.startTime) {
            const endTime = new Date().getTime();
            const sessionSeconds = Math.floor((endTime - this.startTime) / 1000);
            this.setSessionTime(sessionSeconds);
            this.log(\`Session time recorded: \${sessionSeconds} seconds\`, 'info');
            return sessionSeconds;
        }
        return 0;
    }
    
    /**
     * Check if lesson is completed
     */
    isCompleted() {
        const status = this.getValue('cmi.core.lesson_status');
        return status === 'completed' || status === 'passed';
    }
    
    /**
     * Complete the lesson
     */
    completeLessons(score = null) {
        if (score !== null) {
            this.setScore(score);
            this.setStatus(score >= 80 ? 'passed' : 'completed');
        } else {
            this.setStatus('completed');
        }
        
        this.stopTimer();
        this.commit();
        
        this.log('Lesson completed', 'success');
    }
    
    /**
     * Logging utility
     */
    log(message, type = 'info') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = \`[SCORM \${timestamp}]\`;
        
        switch (type) {
            case 'error':
                console.error(\`\${prefix} ❌ \${message}\`);
                break;
            case 'warning':
                console.warn(\`\${prefix} ⚠️  \${message}\`);
                break;
            case 'success':
                console.log(\`\${prefix} ✅ \${message}\`);
                break;
            default:
                console.log(\`\${prefix} ℹ️  \${message}\`);
        }
    }
    
    /**
     * Get student information
     */
    getStudentInfo() {
        return {
            name: this.getValue('cmi.core.student_name'),
            id: this.getValue('cmi.core.student_id'),
            status: this.getValue('cmi.core.lesson_status'),
            score: this.getValue('cmi.core.score.raw'),
            location: this.getValue('cmi.core.lesson_location'),
            totalTime: this.getValue('cmi.core.total_time')
        };
    }
}

// Global SCORM instance
window.scorm = new SCORMWrapper();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.scorm) {
        window.scorm.terminate();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCORMWrapper;
}`;
}
