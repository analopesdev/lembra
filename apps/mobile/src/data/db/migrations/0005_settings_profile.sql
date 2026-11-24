ALTER TABLE `settings` ADD `new_cards_per_day` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `theme` text DEFAULT 'auto' NOT NULL;