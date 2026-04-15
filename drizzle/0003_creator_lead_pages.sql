CREATE TABLE `lead_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator_id` integer NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`subhead` text DEFAULT '' NOT NULL,
	`hero_image_url` text,
	`about` text DEFAULT '' NOT NULL,
	`steps` text DEFAULT '[]' NOT NULL,
	`testimonials` text DEFAULT '[]' NOT NULL,
	`featured_course_slugs` text DEFAULT '[]' NOT NULL,
	`cta_label` text DEFAULT '' NOT NULL,
	`cta_url` text DEFAULT '' NOT NULL,
	`stakes_line` text DEFAULT '' NOT NULL,
	`email_capture_enabled` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lead_pages_creator_unique` ON `lead_pages` (`creator_id`);--> statement-breakpoint
ALTER TABLE `creators` ADD `tagline` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `creators` ADD `brand_color` text DEFAULT '#111827' NOT NULL;--> statement-breakpoint
ALTER TABLE `creators` ADD `logo_url` text;--> statement-breakpoint
ALTER TABLE `creators` ADD `hide_hatch_footer` integer DEFAULT false NOT NULL;