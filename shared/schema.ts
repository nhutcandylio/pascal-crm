import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for owners
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().default('sales_rep'), // 'admin', 'sales_manager', 'sales_rep'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  address: text("address"),
  ownerId: integer("owner_id"), // Reference to users table
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  title: text("title"), // job title
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Junction table for many-to-many relationship between accounts and contacts
export const accountContacts = pgTable("account_contacts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  contactId: integer("contact_id").notNull(),
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
  ownerId: integer("owner_id"), // Reference to users table
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id"),
  contactId: integer("contact_id"),
  leadId: integer("lead_id"), // Reference to the original lead that was converted
  name: text("name").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  weightedValue: decimal("weighted_value", { precision: 12, scale: 2 }),
  grossProfit: decimal("gross_profit", { precision: 12, scale: 2 }),
  grossProfitMargin: integer("gross_profit_margin").default(0), // 0-100%
  stage: text("stage").notNull(), // 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
  probability: integer("probability").default(0), // 0-100%
  closeDate: timestamp("close_date"),
  leadSource: text("lead_source"), // Inherited from the converted lead's source
  description: text("description"),
  ownerId: integer("owner_id"), // Reference to users table
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'onetime', 'subscription', 'service-based'
  description: text("description"),
  category: text("category"),
  sku: text("sku"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default('draft'), // 'draft', 'confirmed', 'delivered', 'cancelled'
  orderDate: timestamp("order_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order Items table (many-to-many between orders and products)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  costValue: decimal("cost_value", { precision: 10, scale: 2 }).notNull(),
  proposalValue: decimal("proposal_value", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default('0.00'), // Discount percentage (0-100)
  startDate: timestamp("start_date"), // For subscription products
  endDate: timestamp("end_date"), // For subscription products
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(), // Calculated total cost after discount
  totalProposal: decimal("total_proposal", { precision: 12, scale: 2 }).notNull(), // Calculated total proposal after discount
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stage Change Logs for opportunities
export const stageChangeLogs = pgTable("stage_change_logs", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull(),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  changedBy: integer("changed_by"), // Reference to users table
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  richTextContent: json("rich_text_content"), // For rich text activities
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  createdBy: integer("created_by"), // Reference to users table
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertAccountContactSchema = createInsertSchema(accountContacts).omit({
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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : null), z.null()]).optional(),
  endDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : null), z.null()]).optional(),
});

// Utility function to calculate months between two dates
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  return yearDiff * 12 + monthDiff + 1; // +1 to include both start and end months
}

// Calculate order item totals based on product type
export function calculateOrderItemTotals(
  productType: string,
  quantity: number,
  costValue: number,
  proposalValue: number,
  discount: number = 0,
  startDate?: Date,
  endDate?: Date
): { totalCost: number; totalProposal: number } {
  let totalCost: number;
  let totalProposal: number;

  if (productType === 'subscription' && startDate && endDate) {
    // For subscription: quantity * months * cost/proposal * (1 - discount/100)
    const months = calculateMonthsBetween(startDate, endDate);
    totalCost = quantity * months * costValue * (1 - discount / 100);
    totalProposal = quantity * months * proposalValue * (1 - discount / 100);
  } else {
    // For onetime/service-based: quantity * cost/proposal * (1 - discount/100)
    totalCost = quantity * costValue * (1 - discount / 100);
    totalProposal = quantity * proposalValue * (1 - discount / 100);
  }

  return { 
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    totalProposal: Math.round(totalProposal * 100) / 100 
  };
}

export const insertStageChangeLogSchema = createInsertSchema(stageChangeLogs).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type AccountContact = typeof accountContacts.$inferSelect;
export type InsertAccountContact = z.infer<typeof insertAccountContactSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type StageChangeLog = typeof stageChangeLogs.$inferSelect;
export type InsertStageChangeLog = z.infer<typeof insertStageChangeLogSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Notes table
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  opportunityId: integer('opportunity_id').references(() => opportunities.id),
  accountId: integer('account_id').references(() => accounts.id),
  contactId: integer('contact_id').references(() => contacts.id),
  userId: integer('user_id').references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Extended types for API responses
export type OpportunityWithRelations = Opportunity & {
  account?: Account;
  contact?: Contact;
  owner?: User;
  orders?: OrderWithItems[];
  stageLogs?: StageChangeLogWithUser[];
  activities?: ActivityWithRelations[];
};

export type OrderWithItems = Order & {
  items?: OrderItemWithProduct[];
};

export type OrderItemWithProduct = OrderItem & {
  product?: Product;
};

export type StageChangeLogWithUser = StageChangeLog & {
  user?: User;
};

export type ActivityWithRelations = Activity & {
  account?: Account;
  contact?: Contact;
  lead?: Lead;
  opportunity?: Opportunity;
  createdBy?: User;
};

export type LeadWithRelations = Lead & {
  owner?: User;
  activities?: ActivityWithRelations[];
};

export type ContactWithAccounts = Contact & {
  accounts?: Account[];
};

export type AccountWithContacts = Account & {
  contacts?: Contact[];
  owner?: User;
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
