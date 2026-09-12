CREATE TABLE `guest_files` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guest_items` (
	`key` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`item_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL
);
