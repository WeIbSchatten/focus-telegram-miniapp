-- Обратная связь по дате занятия: привязка оценки к уроку и расширение comment для ДЗ на следующий урок
-- Выполнить вручную при обновлении с предыдущей версии (если таблица grades уже существует).

ALTER TABLE grades ADD COLUMN IF NOT EXISTS lesson_date DATE;
ALTER TABLE grades ALTER COLUMN comment TYPE VARCHAR(500);
