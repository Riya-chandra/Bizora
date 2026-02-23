CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"total_amount" integer NOT NULL,
	"gst_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_number" text NOT NULL,
	"message_body" text NOT NULL,
	"parsed_data" json,
	"confidence_score" real NOT NULL,
	"is_order_created" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_account" text NOT NULL,
	"product_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"unit_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_business_normalized_unique" ON "product_prices" USING btree ("business_account","normalized_name");