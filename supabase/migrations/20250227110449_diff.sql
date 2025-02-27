set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.clone_course(input_course_id uuid, new_title text, input_profile_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    group_record RECORD;
    user_record RECORD;
    course_record RECORD;
    new_group RECORD;
    new_course RECORD;
    lesson_record RECORD;
    new_lesson RECORD;
    exercises_cursor CURSOR FOR SELECT * FROM exercise WHERE lesson_id = lesson_record.id;
    exercise_record RECORD;
    new_exercise RECORD;
    questions_cursor CURSOR FOR SELECT * FROM question WHERE exercise_id = exercise_record.id; 
    question_record RECORD;
    new_question RECORD;
    options_cursor CURSOR FOR SELECT * FROM option WHERE question_id = question_record.id;
    option_record RECORD;
    new_option RECORD;
    lessons_cursor CURSOR FOR SELECT * FROM lesson WHERE course_id = input_course_id;
    section_record RECORD;
    new_section RECORD;
    sections_cursor CURSOR FOR SELECT * FROM lesson_section WHERE course_id = input_course_id;  -- Cursor for lessons_section

    -- Arrays to hold cloned records
    cloned_lessons jsonb[] := '{}';
    cloned_questions jsonb[] := '{}';
    cloned_options jsonb[] := '{}';
    cloned_sections jsonb[] := '{}';  -- Array for cloned sections

BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('question_id_lock'));


    -- Fetch the existing course details
    SELECT * INTO course_record FROM course WHERE id = input_course_id;
    SELECT * INTO group_record FROM "group" WHERE id = course_record.group_id;

    -- Insert a new group
    INSERT INTO "group" (name, description, organization_id)
    VALUES (new_title, course_record.description, group_record.organization_id)
    RETURNING * INTO new_group;

    -- Insert a new groupmember
    SELECT * INTO user_record FROM profile WHERE id = input_profile_id;
    INSERT INTO "groupmember" (group_id, role_id, email, profile_id)
    VALUES (new_group.id, 2, user_record.email, input_profile_id);

    -- Insert a new course with the new group_id
    INSERT INTO course (title, overview, description, group_id)
    VALUES (new_title, course_record.overview, course_record.description, new_group.id)
    RETURNING * INTO new_course;

    -- Open the cursor for lessons associated with the input_course_id
    OPEN lessons_cursor;

    -- Loop through each lesson and insert a new lesson for the new course
    LOOP
        FETCH lessons_cursor INTO lesson_record;
        EXIT WHEN NOT FOUND;

        -- Insert a new lesson with the new course_id
        INSERT INTO lesson (title, videos, slide_url, note, "order", call_url, is_unlocked, lesson_at, public, section_id, course_id)
        VALUES (lesson_record.title, lesson_record.videos, lesson_record.slide_url, lesson_record.note, lesson_record."order", lesson_record.call_url, lesson_record.is_unlocked, lesson_record.lesson_at, lesson_record.public, lesson_record.section_id, new_course.id)
        RETURNING * INTO new_lesson;

        -- Append the new lesson to the cloned lessons array
        cloned_lessons := array_append(cloned_lessons, to_jsonb(new_lesson));

        -- Open a cursor for exercises associated with the current lesson
        OPEN exercises_cursor;

        -- Loop through each exercise and insert a new exercise for the new lesson
        LOOP
            FETCH exercises_cursor INTO exercise_record;
            EXIT WHEN NOT FOUND;

            -- Insert a new exercise with the new lesson_id
            INSERT INTO exercise (title, description, due_by, lesson_id)
            VALUES (exercise_record.title, exercise_record.description, exercise_record.due_by, new_lesson.id)
            RETURNING * INTO new_exercise;

            -- Open a cursor for questions associated with the current exercise
            OPEN questions_cursor;

            -- Loop through each question and insert a new question for the new exercise
            LOOP
                FETCH questions_cursor INTO question_record;
                EXIT WHEN NOT FOUND;

                -- Insert a new question with the new exercise_id
                INSERT INTO question (question_type_id, title, name, points, "order", exercise_id)  
                VALUES (question_record.question_type_id, question_record.title, question_record.name, question_record.points, question_record."order", new_exercise.id)
                RETURNING * INTO new_question;

                -- Append the new question to the cloned questions array
                cloned_questions := array_append(cloned_questions, to_jsonb(new_question));

                -- Open a cursor for options associated with the current question
                OPEN options_cursor;

                -- Loop through each option and insert a new option for the new question
                LOOP
                    FETCH options_cursor INTO option_record;
                    EXIT WHEN NOT FOUND;

                    -- Insert a new option with the new question_id
                    INSERT INTO option (label, is_correct, "value", question_id)  
                    VALUES (option_record.label, option_record.is_correct, option_record.value, new_question.id)
                    RETURNING * INTO new_option;

                    -- Append the new option to the cloned options array
                    cloned_options := array_append(cloned_options, to_jsonb(new_option));

                END LOOP;

                CLOSE options_cursor;

            END LOOP;

            -- Close the questions cursor
            CLOSE questions_cursor;

        END LOOP;

        -- Close the exercises cursor
        CLOSE exercises_cursor;

    END LOOP;

    -- Close the lessons cursor
    CLOSE lessons_cursor;

    -- Open the cursor for sections associated with the input_course_id
    OPEN sections_cursor;

    -- Loop through each section and insert a new section for the new course
    LOOP
        FETCH sections_cursor INTO section_record;  -- Declare section_record
        EXIT WHEN NOT FOUND;

        -- Insert a new section with the new course_id
        INSERT INTO lesson_section (title, "order", course_id)  -- Adjust columns as per your lessons_section table structure
        VALUES (section_record.title, section_record."order", new_course.id)
        RETURNING * INTO new_section;  -- Declare new_section

        -- Append the new section to the cloned sections array
        cloned_sections := array_append(cloned_sections, to_jsonb(new_section));

    END LOOP;

    -- Close the sections cursor
    CLOSE sections_cursor;

    -- Return the new course, cloned lessons, questions, options, and sections as JSON
    RETURN jsonb_build_object(
        'newCourse', new_course, 
        'clonedLessons', cloned_lessons, 
        'clonedQuestions', cloned_questions, 
        'clonedOptions', cloned_options,
        'clonedSections', cloned_sections  -- Include cloned sections
    );
END;
$function$
;


