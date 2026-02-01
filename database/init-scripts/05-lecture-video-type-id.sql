-- Поддержка YouTube, VK Video, Rutube: тип и id видео
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) NOT NULL DEFAULT 'rutube';
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS video_id VARCHAR(200) NULL;
-- Перенос старых RuTube id в video_id
UPDATE lectures SET video_id = rutube_video_id WHERE rutube_video_id IS NOT NULL AND (video_id IS NULL OR video_id = '');
