CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`schema_json` text NOT NULL,
	`spec_json` text,
	`view_revision` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ops` (
	`doc_id` text NOT NULL,
	`version` integer NOT NULL,
	`client_id` text NOT NULL,
	`seq` integer NOT NULL,
	`ops_json` text NOT NULL,
	PRIMARY KEY(`doc_id`, `version`)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`doc_id` text NOT NULL,
	`schema_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`doc_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`state_json` text NOT NULL,
	`last_seq_json` text NOT NULL
);
