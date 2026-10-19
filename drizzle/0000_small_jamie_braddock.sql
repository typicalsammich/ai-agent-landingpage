CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`ip_hash` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`notification` text DEFAULT 'not_configured' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_idempotency_key_unique` ON `leads` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
