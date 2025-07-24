import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  title: text("title"), // job title
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  title: text("title"), // job title
  source: text("source"), // 'website', 'referral', 'cold-call', 'social-media', 'email-campaign'
  status: text("status").notNull().default('new'), // 'new', 'contacted', 'qualified', 'converted', 'lost'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id"),
  contactId: integer("contact_id"),
  name: text("name").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  stage: text("stage").notNull(), // 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
  probability: integer("probability").default(0), // 0-100%
  closeDate: timestamp("close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id"),
  contactId: integer("contact_id"),
  leadId: integer("lead_id"),
  opportunityId: integer("opportunity_id"),
  type: text("type").notNull(), // 'call', 'email', 'meeting', 'note', 'task'
  subject: text("subject").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  closeDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : null), z.null()]).optional(),
});

export const updateOpportunitySchema = insertOpportunitySchema.partial();

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types for API responses
export type OpportunityWithRelations = Opportunity & {
  account?: Account;
  contact?: Contact;
};

export type ActivityWithRelations = Activity & {
  account?: Account;
  contact?: Contact;
  lead?: Lead;
  opportunity?: Opportunity;
};

export type ContactWithAccount = Contact & {
  account?: Account;
};

export type DashboardMetrics = {
  totalAccounts: number;
  totalContacts: number;
  totalLeads: number;
  activeOpportunities: number;
  revenue: number;
  conversionRate: number;
  accountGrowth: number;
  leadGrowth: number;
  opportunityGrowth: number;
  revenueGrowth: number;
};
