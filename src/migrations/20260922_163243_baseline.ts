import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`badge\` text,
  	\`slug\` text,
  	\`sort_order\` numeric,
  	\`description\` text,
  	\`short_description\` text,
  	\`badge_alias\` text,
  	\`catalog_pdf_id\` integer,
  	\`catalog_pdf_url\` text,
  	\`json_name\` text,
  	\`json_badge\` text,
  	\`json_pdf\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`catalog_pdf_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_catalog_pdf_idx\` ON \`categories\` (\`catalog_pdf_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`families_specifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`value\` text,
  	\`unit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`families_specifications_order_idx\` ON \`families_specifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`families_specifications_parent_id_idx\` ON \`families_specifications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`families_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'image',
  	\`media_id\` integer,
  	\`path\` text,
  	\`code\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`families_images_order_idx\` ON \`families_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`families_images_parent_id_idx\` ON \`families_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`families_images_media_idx\` ON \`families_images\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`families_tables_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`column\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`families_tables\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`families_tables_columns_order_idx\` ON \`families_tables_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`families_tables_columns_parent_id_idx\` ON \`families_tables_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`families_tables\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`rows\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`families_tables_order_idx\` ON \`families_tables\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`families_tables_parent_id_idx\` ON \`families_tables\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`families\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text NOT NULL,
  	\`name\` text,
  	\`type\` text NOT NULL,
  	\`product_name\` text NOT NULL,
  	\`product_name_alias\` text,
  	\`category\` text NOT NULL,
  	\`category_alias\` text,
  	\`short_description\` text,
  	\`definition\` text,
  	\`full_name\` text,
  	\`series\` text,
  	\`badge\` text,
  	\`sort_order\` numeric,
  	\`brand\` text,
  	\`product_range\` text,
  	\`website\` text,
  	\`category_i_d_id\` integer,
  	\`file\` text,
  	\`contract_key\` text,
  	\`file_badge\` text,
  	\`file_description\` text,
  	\`order\` numeric,
  	\`code_prefix\` text,
  	\`extra\` text,
  	\`catalog_pdf_id\` integer,
  	\`pdf_page\` text,
  	\`mounting_method\` text,
  	\`technical_data\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_i_d_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`catalog_pdf_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`families_code_idx\` ON \`families\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`families_type_idx\` ON \`families\` (\`type\`);`)
  await db.run(sql`CREATE INDEX \`families_category_i_d_idx\` ON \`families\` (\`category_i_d_id\`);`)
  await db.run(sql`CREATE INDEX \`families_catalog_pdf_idx\` ON \`families\` (\`catalog_pdf_id\`);`)
  await db.run(sql`CREATE INDEX \`families_updated_at_idx\` ON \`families\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`families_created_at_idx\` ON \`families\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`products_specifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`value\` text,
  	\`unit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_specifications_order_idx\` ON \`products_specifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_specifications_parent_id_idx\` ON \`products_specifications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'image',
  	\`media_id\` integer,
  	\`path\` text,
  	\`code\` text,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_images_order_idx\` ON \`products_images\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_images_parent_id_idx\` ON \`products_images\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_images_media_idx\` ON \`products_images\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`products_variants\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`sku\` text NOT NULL,
  	\`size\` text,
  	\`load_rating\` text,
  	\`load_cases\` text,
  	\`dimensions\` text,
  	\`attributes\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_variants_order_idx\` ON \`products_variants\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_variants_parent_id_idx\` ON \`products_variants\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`sku\` text NOT NULL,
  	\`family_id\` integer,
  	\`subtitle\` text,
  	\`file\` text,
  	\`category_id\` text,
  	\`order\` numeric,
  	\`page\` numeric,
  	\`spec_set_id\` integer,
  	\`product_name\` text,
  	\`product_name_alias\` text,
  	\`category\` text,
  	\`category_alias\` text,
  	\`brand\` text,
  	\`product_range\` text,
  	\`short_description\` text,
  	\`description\` text,
  	\`category_definition\` text,
  	\`image_id\` integer,
  	\`mounting_method\` text,
  	\`technical_data\` text,
  	\`technical_table\` text,
  	\`properties\` text,
  	\`load_cases\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`family_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`spec_set_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`products_sku_idx\` ON \`products\` (\`sku\`);`)
  await db.run(sql`CREATE INDEX \`products_family_idx\` ON \`products\` (\`family_id\`);`)
  await db.run(sql`CREATE INDEX \`products_spec_set_idx\` ON \`products\` (\`spec_set_id\`);`)
  await db.run(sql`CREATE INDEX \`products_image_idx\` ON \`products\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`variants\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`sku\` text NOT NULL,
  	\`file\` text,
  	\`code\` text,
  	\`product_id\` integer NOT NULL,
  	\`family_id\` integer,
  	\`size\` text,
  	\`pack_size\` text,
  	\`unit\` text DEFAULT 'pcs',
  	\`weight\` numeric,
  	\`load_rating\` text,
  	\`image_id\` integer,
  	\`notes\` text,
  	\`attributes\` text,
  	\`order\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`family_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`variants_sku_idx\` ON \`variants\` (\`sku\`);`)
  await db.run(sql`CREATE INDEX \`variants_code_idx\` ON \`variants\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`variants_product_idx\` ON \`variants\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`variants_family_idx\` ON \`variants\` (\`family_id\`);`)
  await db.run(sql`CREATE INDEX \`variants_image_idx\` ON \`variants\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`variants_updated_at_idx\` ON \`variants\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`variants_created_at_idx\` ON \`variants\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`specifications\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`family_id\` integer NOT NULL,
  	\`variant_id\` integer,
  	\`key\` text NOT NULL,
  	\`value\` text,
  	\`unit\` text,
  	\`order\` numeric,
  	\`full_copy\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`family_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`variant_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`specifications_family_idx\` ON \`specifications\` (\`family_id\`);`)
  await db.run(sql`CREATE INDEX \`specifications_variant_idx\` ON \`specifications\` (\`variant_id\`);`)
  await db.run(sql`CREATE INDEX \`specifications_updated_at_idx\` ON \`specifications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`specifications_created_at_idx\` ON \`specifications\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`kind\` text,
  	\`cropped_to\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`)
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_spec_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`unit\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_spec_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_spec_table_rows_order_idx\` ON \`reusable_blocks_blocks_spec_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_spec_table_rows_parent_id_idx\` ON \`reusable_blocks_blocks_spec_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_spec_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_spec_table_order_idx\` ON \`reusable_blocks_blocks_spec_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_spec_table_parent_id_idx\` ON \`reusable_blocks_blocks_spec_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_spec_table_path_idx\` ON \`reusable_blocks_blocks_spec_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_load_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`case_name\` text,
  	\`span\` text,
  	\`load\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_load_table_order_idx\` ON \`reusable_blocks_blocks_load_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_load_table_parent_id_idx\` ON \`reusable_blocks_blocks_load_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_load_table_path_idx\` ON \`reusable_blocks_blocks_load_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`reusable_blocks\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`type\` text DEFAULT 'table',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`reusable_blocks_updated_at_idx\` ON \`reusable_blocks\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_created_at_idx\` ON \`reusable_blocks\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`blogs_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`blogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`blogs_tags_order_idx\` ON \`blogs_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`blogs_tags_parent_id_idx\` ON \`blogs_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`blogs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`excerpt\` text,
  	\`body\` text,
  	\`status\` text DEFAULT 'published',
  	\`slug\` text NOT NULL,
  	\`category\` text,
  	\`author_id\` integer,
  	\`published_at\` text,
  	\`read_time\` text,
  	\`image\` text,
  	\`cover_image_id\` integer,
  	\`featured\` integer DEFAULT false,
  	\`content_html\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`cover_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`blogs_slug_idx\` ON \`blogs\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`blogs_author_idx\` ON \`blogs\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`blogs_cover_image_idx\` ON \`blogs\` (\`cover_image_id\`);`)
  await db.run(sql`CREATE INDEX \`blogs_updated_at_idx\` ON \`blogs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blogs_created_at_idx\` ON \`blogs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`audits\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`operation\` text NOT NULL,
  	\`leaf\` text,
  	\`decision_id\` text,
  	\`contract\` text,
  	\`before_value\` text,
  	\`after_value\` text,
  	\`resolution_id\` integer,
  	\`product_id\` integer,
  	\`at\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`resolution_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`audits_resolution_idx\` ON \`audits\` (\`resolution_id\`);`)
  await db.run(sql`CREATE INDEX \`audits_product_idx\` ON \`audits\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`audits_updated_at_idx\` ON \`audits\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`audits_created_at_idx\` ON \`audits\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`roles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`is_admin\` integer DEFAULT false,
  	\`is_owner\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`roles_name_idx\` ON \`roles\` (\`name\`);`)
  await db.run(sql`CREATE INDEX \`roles_updated_at_idx\` ON \`roles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`roles_created_at_idx\` ON \`roles\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`is_admin\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	\`families_id\` integer,
  	\`products_id\` integer,
  	\`variants_id\` integer,
  	\`specifications_id\` integer,
  	\`media_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`blogs_id\` integer,
  	\`audits_id\` integer,
  	\`roles_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`families_id\`) REFERENCES \`families\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variants_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`specifications_id\`) REFERENCES \`specifications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blogs_id\`) REFERENCES \`blogs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`audits_id\`) REFERENCES \`audits\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_families_id_idx\` ON \`payload_locked_documents_rels\` (\`families_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_variants_id_idx\` ON \`payload_locked_documents_rels\` (\`variants_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_specifications_id_idx\` ON \`payload_locked_documents_rels\` (\`specifications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blogs_id_idx\` ON \`payload_locked_documents_rels\` (\`blogs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audits_id_idx\` ON \`payload_locked_documents_rels\` (\`audits_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_roles_id_idx\` ON \`payload_locked_documents_rels\` (\`roles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`families_specifications\`;`)
  await db.run(sql`DROP TABLE \`families_images\`;`)
  await db.run(sql`DROP TABLE \`families_tables_columns\`;`)
  await db.run(sql`DROP TABLE \`families_tables\`;`)
  await db.run(sql`DROP TABLE \`families\`;`)
  await db.run(sql`DROP TABLE \`products_specifications\`;`)
  await db.run(sql`DROP TABLE \`products_images\`;`)
  await db.run(sql`DROP TABLE \`products_variants\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`DROP TABLE \`variants\`;`)
  await db.run(sql`DROP TABLE \`specifications\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_spec_table_rows\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_spec_table\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_load_table\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks\`;`)
  await db.run(sql`DROP TABLE \`blogs_tags\`;`)
  await db.run(sql`DROP TABLE \`blogs\`;`)
  await db.run(sql`DROP TABLE \`audits\`;`)
  await db.run(sql`DROP TABLE \`roles\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
