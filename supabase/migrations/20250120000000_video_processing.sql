-- Add video processing fields
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hls_manifest_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS encoding_job_id VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS available_qualities JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add caption fields
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_srt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_vtt_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_transcript TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_language VARCHAR(10);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption_status VARCHAR(20) DEFAULT 'pending';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_processing_status ON videos(processing_status);
CREATE INDEX IF NOT EXISTS idx_videos_encoding_job_id ON videos(encoding_job_id);
CREATE INDEX IF NOT EXISTS idx_videos_caption_status ON videos(caption_status);

-- Add comment for documentation
COMMENT ON COLUMN videos.processing_status IS 'Status of video processing: pending, processing, completed, failed';
COMMENT ON COLUMN videos.hls_manifest_url IS 'URL to HLS master playlist (.m3u8)';
COMMENT ON COLUMN videos.encoding_job_id IS 'BullMQ job ID for tracking processing';
COMMENT ON COLUMN videos.available_qualities IS 'Array of available quality variants: ["720p", "1080p", "2160p"]';
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
COMMENT ON COLUMN videos.caption_srt_url IS 'URL to SRT caption file';
COMMENT ON COLUMN videos.caption_vtt_url IS 'URL to VTT caption file';
COMMENT ON COLUMN videos.caption_transcript IS 'Full transcript text';
COMMENT ON COLUMN videos.caption_language IS 'Detected or specified language code (e.g., en, es, fr)';
COMMENT ON COLUMN videos.caption_status IS 'Status of caption generation: pending, processing, completed, failed';
