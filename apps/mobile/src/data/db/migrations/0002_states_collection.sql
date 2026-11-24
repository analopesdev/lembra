DROP INDEX `idx_states_active_due`;--> statement-breakpoint
ALTER TABLE `card_states` ADD `collection_id` text;--> statement-breakpoint
UPDATE `card_states` SET `collection_id` = (SELECT `collection_id` FROM `cards` WHERE `cards`.`id` = `card_states`.`card_id`);--> statement-breakpoint
CREATE INDEX `idx_states_collection` ON `card_states` (`is_active`,`collection_id`,`retained_until`);--> statement-breakpoint
CREATE INDEX `idx_states_active_due` ON `card_states` (`is_active`,`due`,`card_id`,`importance`,`collection_id`,`stability`,`last_review`);