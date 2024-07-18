CREATE TABLE lesson_language_history (
  id SERIAL PRIMARY KEY,
  lesson_language_id INTEGER REFERENCES lesson_language(id),
  old_content TEXT,
  new_content TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE FUNCTION update_lesson_language_history()
  RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    INSERT INTO lesson_language_history (lesson_language_id, old_content, new_content)
    VALUES (NEW.id, COALESCE(OLD.content, ''), NEW.content);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_lesson_language_history_trigger
AFTER INSERT
OR
UPDATE ON lesson_language for each row
EXECUTE PROCEDURE update_lesson_language_history();