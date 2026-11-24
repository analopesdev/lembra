CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_minutes` integer NOT NULL,
	`off_weekdays` text NOT NULL,
	`goal_text` text NOT NULL,
	`updated_at` integer NOT NULL
);
