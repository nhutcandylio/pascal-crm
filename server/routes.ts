import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAccountSchema, 
  insertContactSchema, 
  insertLeadSchema, 
  insertOpportunitySchema,
  updateOpportunitySchema,
  insertActivitySchema,
  insertUserSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertStageChangeLogSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid account data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create account" });
      }
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ error: "Account not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid account data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update account" });
      }
    }
  });

  // Contact routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContactsWithAccounts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Account routes with contacts
  app.get("/api/accounts/with-contacts", async (req, res) => {
    try {
      const accounts = await storage.getAccountsWithContacts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts with contacts" });
    }
  });

  // Add contact to account
  app.post("/api/accounts/:accountId/contacts/:contactId", async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const contactId = parseInt(req.params.contactId);
      const accountContact = await storage.addContactToAccount(accountId, contactId);
      res.status(201).json(accountContact);
    } catch (error) {
      res.status(500).json({ error: "Failed to add contact to account" });
    }
  });

  // Remove contact from account
  app.delete("/api/accounts/:accountId/contacts/:contactId", async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const contactId = parseInt(req.params.contactId);
      const success = await storage.removeContactFromAccount(accountId, contactId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Relationship not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to remove contact from account" });
    }
  });

  // Get contacts for specific account
  app.get("/api/accounts/:accountId/contacts", async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const contacts = await storage.getContactsByAccount(accountId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts for account" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create contact" });
      }
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, contactData);
      if (contact) {
        res.json(contact);
      } else {
        res.status(404).json({ error: "Contact not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update contact" });
      }
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      if (success) {
        res.json({ message: "Contact deleted successfully" });
      } else {
        res.status(404).json({ error: "Contact not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Lead routes
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      if (lead) {
        res.json(lead);
      } else {
        res.status(404).json({ error: "Lead not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lead data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create lead" });
      }
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const leadData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(id, leadData);
      if (lead) {
        res.json(lead);
      } else {
        res.status(404).json({ error: "Lead not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lead data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update lead" });
      }
    }
  });

  // Opportunity routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunitiesWithRelations();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const opportunityData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(opportunityData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid opportunity data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create opportunity" });
      }
    }
  });

  app.patch("/api/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunityData = updateOpportunitySchema.parse(req.body);
      
      // Get the current opportunity to check for stage changes
      const currentOpportunity = await storage.getOpportunity(id);
      if (!currentOpportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      const opportunity = await storage.updateOpportunity(id, opportunityData);
      
      // If stage changed, create a stage change log
      if (opportunityData.stage && opportunityData.stage !== currentOpportunity.stage) {
        await storage.createStageChangeLog({
          opportunityId: id,
          fromStage: currentOpportunity.stage,
          toStage: opportunityData.stage,
          changedBy: 1, // Default user for now
          reason: null, // Will be set by activity if provided
        });
      }
      
      res.json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Update validation error:", error.errors);
        res.status(400).json({ error: "Invalid opportunity data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update opportunity" });
      }
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivitiesWithRelations();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      
      // If this is a stage_change activity, update the most recent stage change log with the reason
      if (activityData.type === 'stage_change' && activityData.opportunityId && activityData.description) {
        const reason = activityData.description.replace(/^Reason:\s*/, ''); // Extract reason from description
        await storage.updateLatestStageChangeLogReason(activityData.opportunityId, reason);
      }
      
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid activity data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create activity" });
      }
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrdersWithItems();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/by-opportunity/:opportunityId", async (req, res) => {
    try {
      const opportunityId = parseInt(req.params.opportunityId);
      const orders = await storage.getOrdersByOpportunity(opportunityId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders by opportunity" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Received order data:", req.body);
      
      // Transform orderDate from string to Date if needed
      const orderData = {
        ...req.body,
        orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
      };
      
      console.log("Transformed order data:", orderData);
      
      const validatedData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Order validation error details:", error.errors);
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        console.error("Order creation error:", error);
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  // Order Item routes
  app.get("/api/order-items/by-order/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderItems = await storage.getOrderItemsByOrder(orderId);
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  app.post("/api/order-items", async (req, res) => {
    try {
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      res.status(201).json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order item" });
      }
    }
  });

  // Stage Change Log routes
  app.get("/api/stage-logs/by-opportunity/:opportunityId", async (req, res) => {
    try {
      const opportunityId = parseInt(req.params.opportunityId);
      const stageLogs = await storage.getStageChangeLogsByOpportunity(opportunityId);
      res.json(stageLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stage change logs" });
    }
  });

  app.post("/api/stage-logs", async (req, res) => {
    try {
      const stageLogData = insertStageChangeLogSchema.parse(req.body);
      const stageLog = await storage.createStageChangeLog(stageLogData);
      res.status(201).json(stageLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid stage log data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create stage log" });
      }
    }
  });

  // Enhanced Opportunity routes with relations
  app.get("/api/opportunities/with-relations", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunitiesWithRelations();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunities with relations" });
    }
  });

  app.get("/api/opportunities/:id/with-relations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getOpportunityWithRelations(id);
      if (opportunity) {
        res.json(opportunity);
      } else {
        res.status(404).json({ error: "Opportunity not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunity with relations" });
    }
  });

  // Enhanced Lead routes with relations
  app.get("/api/leads/with-relations", async (req, res) => {
    try {
      const leads = await storage.getLeadsWithRelations();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads with relations" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}