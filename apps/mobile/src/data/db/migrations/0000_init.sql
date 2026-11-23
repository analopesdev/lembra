CREATE TABLE `card_states` (
	`card_id` text PRIMARY KEY NOT NULL,
	`due` integer NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`state` integer NOT NULL,
	`reps` integer NOT NULL,
	`lapses` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`last_review` integer,
	`is_active` integer DEFAULT 0 NOT NULL,
	`importance` integer DEFAULT 2 NOT NULL,
	`retained_until` integer,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_states_active_due` ON `card_states` (`is_active`,`due`,`card_id`,`importance`,`stability`,`last_review`);--> statement-breakpoint
CREATE INDEX `idx_states_active_retained` ON `card_states` (`is_active`,`retained_until`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`tags` text NOT NULL,
	`importance` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_cards_collection` ON `cards` (`collection_id`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`op` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_id_unique` ON `outbox` (`id`);--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`at` integer NOT NULL,
	`rating` integer NOT NULL,
	`retention` real,
	`kind` text DEFAULT 'review' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_review_logs_card` ON `review_logs` (`card_id`,`at`);