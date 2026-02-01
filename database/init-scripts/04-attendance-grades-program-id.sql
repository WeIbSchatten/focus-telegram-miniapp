-- Привязка занятия и оценок к программе (теме урока)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS program_id INTEGER NULL REFERENCES programs(id);
ALTER TABLE grades ADD COLUMN IF NOT EXISTS program_id INTEGER NULL REFERENCES programs(id);
