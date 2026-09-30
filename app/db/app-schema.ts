import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  smallint,
  numeric,
  date,
  char,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// ดู docs/SPEC.md §5 และ docs/CONTEXT.md
export type TransactionType = "income" | "expense";
export type OccurrenceStatus = "confirmed" | "skipped";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<TransactionType>().notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    // soft delete — ดู docs/adr/0002
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("category_user_type_name_uq")
      .on(t.userId, t.type, t.name)
      .where(sql`${t.deletedAt} is null`),
    check("category_type_ck", sql`${t.type} in ('income', 'expense')`),
  ],
);

export const recurringRule = pgTable(
  "recurring_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<TransactionType>().notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id),
    note: text("note").notNull().default(""),
    dayOfMonth: smallint("day_of_month").notNull(),
    startMonth: char("start_month", { length: 7 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("recurring_rule_user_idx").on(t.userId),
    check("recurring_rule_amount_ck", sql`${t.amount} > 0`),
    check("recurring_rule_day_ck", sql`${t.dayOfMonth} between 1 and 31`),
    check("recurring_rule_type_ck", sql`${t.type} in ('income', 'expense')`),
  ],
);

export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<TransactionType>().notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id),
    note: text("note").notNull().default(""),
    date: date("date").notNull(),
    recurringRuleId: uuid("recurring_rule_id").references(
      () => recurringRule.id,
      { onDelete: "set null" },
    ),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("transaction_user_date_idx").on(t.userId, t.date),
    check("transaction_amount_ck", sql`${t.amount} > 0`),
    check("transaction_type_ck", sql`${t.type} in ('income', 'expense')`),
  ],
);

export const recurringOccurrence = pgTable(
  "recurring_occurrence",
  {
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => recurringRule.id, { onDelete: "cascade" }),
    month: char("month", { length: 7 }).notNull(),
    status: text("status").$type<OccurrenceStatus>().notNull(),
    transactionId: uuid("transaction_id").references(() => transaction.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [
    primaryKey({ columns: [t.ruleId, t.month] }),
    check(
      "recurring_occurrence_status_ck",
      sql`${t.status} in ('confirmed', 'skipped')`,
    ),
  ],
);

export const categoryRelations = relations(category, ({ many }) => ({
  transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  category: one(category, {
    fields: [transaction.categoryId],
    references: [category.id],
  }),
  recurringRule: one(recurringRule, {
    fields: [transaction.recurringRuleId],
    references: [recurringRule.id],
  }),
}));

export const recurringRuleRelations = relations(
  recurringRule,
  ({ one, many }) => ({
    category: one(category, {
      fields: [recurringRule.categoryId],
      references: [category.id],
    }),
    occurrences: many(recurringOccurrence),
  }),
);

export const recurringOccurrenceRelations = relations(
  recurringOccurrence,
  ({ one }) => ({
    rule: one(recurringRule, {
      fields: [recurringOccurrence.ruleId],
      references: [recurringRule.id],
    }),
  }),
);
