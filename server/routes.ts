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
  insertStageChangeLogSchema,
  insertNoteSchema,
  calculateOrderItemTotals
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

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithAccounts(id);
      if (contact) {
        res.json(contact);
      } else {
        res.status(404).json({ error: "Contact not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
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

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccountWithContacts(id);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ error: "Account not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account" });
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

  app.get("/api/opportunities/with-orders", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunitiesWithOrders();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunities with orders" });
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

  app.delete("/api/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOpportunity(id);
      if (success) {
        res.json({ message: "Opportunity deleted successfully" });
      } else {
        res.status(404).json({ error: "Opportunity not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete opportunity" });
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
      console.log("Received order item data:", req.body);
      
      // Get product info to determine type
      const product = await storage.getProduct(req.body.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const orderItemData = insertOrderItemSchema.parse(req.body);
      
      // Calculate totals based on product type and discount
      const { totalCost, totalProposal } = calculateOrderItemTotals(
        product.type,
        orderItemData.quantity,
        parseFloat(orderItemData.costValue),
        parseFloat(orderItemData.proposalValue),
        parseFloat(orderItemData.discount || '0'),
        orderItemData.startDate || undefined,
        orderItemData.endDate || undefined
      );
      
      // Add calculated totals to order item data
      const enrichedOrderItemData = {
        ...orderItemData,
        totalCost: totalCost.toString(),
        totalProposal: totalProposal.toString()
      };
      
      console.log("Enriched order item data:", enrichedOrderItemData);
      const orderItem = await storage.createOrderItem(enrichedOrderItemData);
      res.status(201).json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Order item validation error details:", error.errors);
        res.status(400).json({ error: "Invalid order item data", details: error.errors });
      } else {
        console.error("Order item creation error:", error);
        res.status(500).json({ error: "Failed to create order item" });
      }
    }
  });

  // Update order status
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  });

  // Update order item
  app.patch("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Received order item update for ID ${id}:`, req.body);
      
      // Get existing order item to determine product type for recalculation
      const existingItem = await storage.getOrderItem(id);
      if (!existingItem) {
        return res.status(404).json({ error: "Order item not found" });
      }
      
      // Get product info to determine type
      const product = await storage.getProduct(existingItem.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const orderItemData = insertOrderItemSchema.partial().parse(req.body);
      
      // If discount, cost, proposal, quantity, or dates are being updated, recalculate totals
      if (orderItemData.discount !== undefined || 
          orderItemData.costValue !== undefined || 
          orderItemData.proposalValue !== undefined || 
          orderItemData.quantity !== undefined ||
          orderItemData.startDate !== undefined ||
          orderItemData.endDate !== undefined) {
        
        // Use updated values or fall back to existing values
        const quantity = orderItemData.quantity || existingItem.quantity;
        const costValue = parseFloat(orderItemData.costValue || existingItem.costValue);
        const proposalValue = parseFloat(orderItemData.proposalValue || existingItem.proposalValue);
        const discount = parseFloat(orderItemData.discount || existingItem.discount || '0');
        const startDate = orderItemData.startDate || existingItem.startDate;
        const endDate = orderItemData.endDate || existingItem.endDate;
        
        // Calculate new totals
        const { totalCost, totalProposal } = calculateOrderItemTotals(
          product.type,
          quantity,
          costValue,
          proposalValue,
          discount,
          startDate,
          endDate
        );
        
        // Add calculated totals to update data
        orderItemData.totalCost = totalCost.toString();
        orderItemData.totalProposal = totalProposal.toString();
        
        // Update totalPrice for display purposes
        orderItemData.totalPrice = (proposalValue * quantity).toFixed(2);
      }
      
      const orderItem = await storage.updateOrderItem(id, orderItemData);
      if (orderItem) {
        console.log('Updated order item:', orderItem);
        res.json(orderItem);
      } else {
        res.status(404).json({ error: "Order item not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Order item update validation error details:", error.errors);
        res.status(400).json({ error: "Invalid order item data", details: error.errors });
      } else {
        console.error("Order item update error:", error);
        res.status(500).json({ error: "Failed to update order item" });
      }
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      if (success) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
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

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Notes routes
  app.get("/api/notes", async (req, res) => {
    try {
      const { leadId, opportunityId, accountId, contactId } = req.query;
      
      let notes;
      if (leadId) {
        notes = await storage.getNotesByLead(parseInt(leadId as string));
      } else if (opportunityId) {
        notes = await storage.getNotesByOpportunity(parseInt(opportunityId as string));
      } else if (accountId) {
        notes = await storage.getNotesByAccount(parseInt(accountId as string));
      } else if (contactId) {
        notes = await storage.getNotesByContact(parseInt(contactId as string));
      } else {
        notes = await storage.getNotes();
      }
      
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid note data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create note" });
      }
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      const note = await storage.updateNote(id, content);
      if (note) {
        res.json(note);
      } else {
        res.status(404).json({ error: "Note not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNote(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Note not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Dashboard route
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