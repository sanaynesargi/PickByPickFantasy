import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// A fantasy team and its record from last season.
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A claimed draft slot. pickNumber is the draft position a team chose
// (1 = first overall). Each team and each pick number is used at most once.
export const picks = pgTable("picks", {
  id: serial("id").primaryKey(),
  pickNumber: integer("pick_number").notNull().unique(),
  teamId: integer("team_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Team = typeof teams.$inferSelect;
export type Pick = typeof picks.$inferSelect;
