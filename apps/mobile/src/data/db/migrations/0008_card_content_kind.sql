ALTER TABLE `cards` ADD `front_doc` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `back_doc` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `kind` text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `direction` text DEFAULT 'forward' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `pair_id` text;