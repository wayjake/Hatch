CREATE TABLE `availability_overrides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_link_id` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`is_available` integer DEFAULT false NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_link_id`) REFERENCES `booking_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `availability_overrides_booking_link_idx` ON `availability_overrides` (`booking_link_id`);--> statement-breakpoint
CREATE TABLE `availability_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_link_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute_of_day` integer NOT NULL,
	`end_minute_of_day` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_link_id`) REFERENCES `booking_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `availability_rules_booking_link_idx` ON `availability_rules` (`booking_link_id`);--> statement-breakpoint
CREATE TABLE `booking_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`duration_minutes` integer NOT NULL,
	`buffer_before_minutes` integer DEFAULT 0 NOT NULL,
	`buffer_after_minutes` integer DEFAULT 0 NOT NULL,
	`minimum_notice_hours` integer DEFAULT 24 NOT NULL,
	`booking_horizon_days` integer DEFAULT 60 NOT NULL,
	`max_bookings_per_day` integer,
	`requires_payment` integer DEFAULT true NOT NULL,
	`allowed_offer_types` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_links_slug_unique` ON `booking_links` (`slug`);--> statement-breakpoint
CREATE INDEX `booking_links_creator_idx` ON `booking_links` (`creator_id`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_link_id` integer NOT NULL,
	`creator_id` integer NOT NULL,
	`user_id` text,
	`purchase_id` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`timezone` text NOT NULL,
	`attendee_name` text DEFAULT '' NOT NULL,
	`attendee_email` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`google_calendar_event_id` text,
	`telegram_message_id` text,
	`canceled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`booking_link_id`) REFERENCES `booking_links`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bookings_creator_idx` ON `bookings` (`creator_id`);--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookings_starts_at_idx` ON `bookings` (`starts_at`);--> statement-breakpoint
CREATE TABLE `call_credit_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`creator_id` integer NOT NULL,
	`purchase_id` integer,
	`booking_id` integer,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `call_credit_transactions_user_idx` ON `call_credit_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `call_credit_transactions_creator_idx` ON `call_credit_transactions` (`creator_id`);--> statement-breakpoint
CREATE TABLE `comment_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vote_unique` ON `comment_votes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `creator_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`external_account_id` text,
	`access_token` text,
	`refresh_token` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`connected_at` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_integrations_creator_type_unique` ON `creator_integrations` (`creator_id`,`type`);--> statement-breakpoint
CREATE TABLE `creators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`timezone` text DEFAULT 'America/Los_Angeles' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creators_slug_unique` ON `creators` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `creators_user_id_unique` ON `creators` (`user_id`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creator_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`price_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`session_credit_count` integer DEFAULT 0 NOT NULL,
	`stripe_product_id` text,
	`stripe_price_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `offers_creator_slug_unique` ON `offers` (`creator_id`,`slug`);--> statement-breakpoint
CREATE INDEX `offers_creator_idx` ON `offers` (`creator_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`avatar_url` text,
	`location` text DEFAULT '' NOT NULL,
	`website_url` text DEFAULT '' NOT NULL,
	`github_url` text DEFAULT '' NOT NULL,
	`twitter_url` text DEFAULT '' NOT NULL,
	`linkedin_url` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`image_url` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`offer_id` integer NOT NULL,
	`title_snapshot` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_amount_cents` integer NOT NULL,
	`total_amount_cents` integer NOT NULL,
	`session_credits_granted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_items_purchase_idx` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `purchase_items_offer_idx` ON `purchase_items` (`offer_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`creator_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`application_fee_cents` integer DEFAULT 0 NOT NULL,
	`stripe_checkout_session_id` text,
	`stripe_payment_intent_id` text,
	`stripe_charge_id` text,
	`stripe_transfer_id` text,
	`coupon_code` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`purchased_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchases_user_idx` ON `purchases` (`user_id`);--> statement-breakpoint
CREATE INDEX `purchases_creator_idx` ON `purchases` (`creator_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_checkout_session_unique` ON `purchases` (`stripe_checkout_session_id`);--> statement-breakpoint
ALTER TABLE `comments` ADD `parent_id` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;