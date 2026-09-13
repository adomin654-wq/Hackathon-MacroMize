// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, index, integer } from "drizzle-orm/sqlite-core";
export const guestState = sqliteTable("guest_state", {
 onboardingCompleted: integer("onboarding_completed", {mode:"boolean"}).notNull().default(true),
 id: text("id").primaryKey(), targets: text("targets").notNull(), saved: text("saved").notNull(),
});
export const guestItems=sqliteTable('guest_items',{key:text('key').primaryKey(),guestId:text('guest_id').notNull(),itemId:text('item_id').notNull(),kind:text('kind').notNull(),payload:text('payload').notNull()},table=>[index('idx_guest_items_owner').on(table.guestId)]);
export const guestFiles=sqliteTable('guest_files',{id:text('id').primaryKey(),guestId:text('guest_id').notNull(),objectKey:text('object_key').notNull(),contentType:text('content_type').notNull()},table=>[index('idx_guest_files_owner').on(table.guestId)]);
