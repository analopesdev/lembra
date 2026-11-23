export const MIGRATIONS: readonly (readonly string[])[] = [
  [
    "CREATE TABLE `card_states` (\n\t`card_id` text PRIMARY KEY NOT NULL,\n\t`due` integer NOT NULL,\n\t`stability` real NOT NULL,\n\t`difficulty` real NOT NULL,\n\t`state` integer NOT NULL,\n\t`reps` integer NOT NULL,\n\t`lapses` integer NOT NULL,\n\t`scheduled_days` integer NOT NULL,\n\t`last_review` integer,\n\t`is_active` integer DEFAULT 0 NOT NULL,\n\t`importance` integer DEFAULT 2 NOT NULL,\n\t`retained_until` integer,\n\tFOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action\n);",
    "CREATE INDEX `idx_states_active_due` ON `card_states` (`is_active`,`due`,`card_id`,`importance`,`stability`,`last_review`);",
    "CREATE INDEX `idx_states_active_retained` ON `card_states` (`is_active`,`retained_until`);",
    "CREATE TABLE `cards` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`collection_id` text NOT NULL,\n\t`front` text NOT NULL,\n\t`back` text NOT NULL,\n\t`tags` text NOT NULL,\n\t`importance` integer NOT NULL,\n\t`status` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\t`deleted_at` integer\n);",
    "CREATE INDEX `idx_cards_collection` ON `cards` (`collection_id`);",
    "CREATE TABLE `outbox` (\n\t`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`id` text NOT NULL,\n\t`entity` text NOT NULL,\n\t`entity_id` text NOT NULL,\n\t`op` text NOT NULL,\n\t`payload` text NOT NULL,\n\t`created_at` integer NOT NULL\n);",
    "CREATE UNIQUE INDEX `outbox_id_unique` ON `outbox` (`id`);",
    "CREATE TABLE `review_logs` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`card_id` text NOT NULL,\n\t`at` integer NOT NULL,\n\t`rating` integer NOT NULL,\n\t`retention` real,\n\t`kind` text DEFAULT 'review' NOT NULL\n);",
    "CREATE INDEX `idx_review_logs_card` ON `review_logs` (`card_id`,`at`);"
  ]
];
