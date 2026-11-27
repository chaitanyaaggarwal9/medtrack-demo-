CREATE TABLE "dose_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"dose_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"taken_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dose_logs_one_tick_per_dose" UNIQUE("medicine_id","dose_date","scheduled_time")
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"dose_text" varchar(100) NOT NULL,
	"times" time[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medicines_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "medicines_times_count" CHECK (cardinality("medicines"."times") between 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_medicine_owner_fk" FOREIGN KEY ("medicine_id","user_id") REFERENCES "public"."medicines"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dose_logs_user_date_idx" ON "dose_logs" USING btree ("user_id","dose_date");--> statement-breakpoint
CREATE INDEX "medicines_user_id_idx" ON "medicines" USING btree ("user_id");