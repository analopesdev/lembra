DROP INDEX `idx_cards_collection`;--> statement-breakpoint
CREATE INDEX `idx_cards_collection` ON `cards` (`collection_id`,`deleted_at`,`created_at`);