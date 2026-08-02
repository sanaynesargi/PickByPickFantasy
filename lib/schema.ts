import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

// A fantasy team and its record from last season.
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner").notNull().default(""), // manager name
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  pointsFor: doublePrecision("points_for").notNull().default(0),
  pointsAgainst: doublePrecision("points_against").notNull().default(0),
  // Explicit final regular-season standing (1 = champion). When every team has
  // one, it is authoritative for ordering; needed when records tie and no
  // points-for is available, e.g. the 2025 ESPN export. 0 = unset.
  finishRank: integer("finish_rank").notNull().default(0),
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
