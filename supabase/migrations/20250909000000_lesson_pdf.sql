-- Migration: Add documents column to lesson table
-- Description: Add a JSONB column to store document metadata for lessons

alter table "public"."lesson" add column documents jsonb null default '[]'::jsonb;
