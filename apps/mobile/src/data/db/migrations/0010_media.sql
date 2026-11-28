CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`local_path` text NOT NULL,
	`byte_size` integer NOT NULL,
	`uploaded_at` integer,
	`created_at` integer NOT NULL
);
