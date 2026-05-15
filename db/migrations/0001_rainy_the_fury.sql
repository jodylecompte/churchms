CREATE TABLE "authorized_pickups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_person_id" uuid NOT NULL,
	"authorized_person_id" uuid,
	"external_name" text,
	"external_phone" text,
	"relationship" text,
	"is_denied" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "authorized_pickups" ADD CONSTRAINT "authorized_pickups_child_person_id_people_id_fk" FOREIGN KEY ("child_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorized_pickups" ADD CONSTRAINT "authorized_pickups_authorized_person_id_people_id_fk" FOREIGN KEY ("authorized_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorized_pickups" ADD CONSTRAINT "authorized_pickups_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_field_visibility" ADD CONSTRAINT "person_field_visibility_person_id_field_name_unique" UNIQUE("person_id","field_name");