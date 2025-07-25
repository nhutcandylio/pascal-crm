import { 
  accounts,
  contacts,
  accountContacts,
  leads,
  opportunities,
  activities,
  users,
  products,
  orders,
  orderItems,
  stageChangeLogs,
  type User,
  type InsertUser,
  type Account, 
  type InsertAccount,
  type Contact,
  type InsertContact,
  type AccountContact,
  type InsertAccountContact,
  type Lead,
  type InsertLead,
  type Opportunity,
  type InsertOpportunity,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type StageChangeLog,
  type InsertStageChangeLog,
  type Activity,
  type InsertActivity,
  type OpportunityWithRelations,
  type ActivityWithRelations,
  type LeadWithRelations,
  type OrderWithItems,
  type OrderItemWithProduct,
  type StageChangeLogWithUser,
  type ContactWithAccounts,
  type AccountWithContacts,
  type DashboardMetrics
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Account operations
  getAccount(id: number): Promise<Account | undefined>;
  getAccounts(): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  searchAccounts(query: string): Promise<Account[]>;

  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContacts(): Promise<Contact[]>;
  getContactsWithAccounts(): Promise<ContactWithAccounts[]>;
  getContactsByAccount(accountId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;
  
  // Account-Contact relationship operations
  addContactToAccount(accountId: number, contactId: number): Promise<AccountContact>;
  removeContactFromAccount(accountId: number, contactId: number): Promise<boolean>;
  getAccountsWithContacts(): Promise<AccountWithContacts[]>;

  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
  getLeadsWithRelations(): Promise<LeadWithRelations[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  searchLeads(query: string): Promise<Lead[]>;

  // Opportunity operations
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunitiesWithRelations(): Promise<OpportunityWithRelations[]>;
  getOpportunitiesByAccount(accountId: number): Promise<Opportunity[]>;
  getOpportunitiesByContact(contactId: number): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersWithItems(): Promise<OrderWithItems[]>;
  getOrdersByOpportunity(opportunityId: number): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItems(): Promise<OrderItem[]>;
  getOrderItemsByOrder(orderId: number): Promise<OrderItemWithProduct[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Stage Change Log operations
  getStageChangeLog(id: number): Promise<StageChangeLog | undefined>;
  getStageChangeLogs(): Promise<StageChangeLog[]>;
  getStageChangeLogsByOpportunity(opportunityId: number): Promise<StageChangeLogWithUser[]>;
  createStageChangeLog(log: InsertStageChangeLog): Promise<StageChangeLog>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(): Promise<Activity[]>;
  getActivitiesWithRelations(): Promise<ActivityWithRelations[]>;
  getActivitiesByAccount(accountId: number): Promise<Activity[]>;
  getActivitiesByContact(contactId: number): Promise<Activity[]>;
  getActivitiesByLead(leadId: number): Promise<Activity[]>;
  getActivitiesByOpportunity(opportunityId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;

  // Dashboard operations
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private accounts: Map<number, Account> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private accountContacts: Map<number, AccountContact> = new Map();
  private leads: Map<number, Lead> = new Map();
  private opportunities: Map<number, Opportunity> = new Map();
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private stageChangeLogs: Map<number, StageChangeLog> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentUserId = 1;
  private currentAccountId = 1;
  private currentContactId = 1;
  private currentAccountContactId = 1;
  private currentLeadId = 1;
  private currentOpportunityId = 1;
  private currentProductId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentStageChangeLogId = 1;
  private currentActivityId = 1;

  constructor() {
    // Initialize with some sample data for development
    this.initializeData();
  }

  private initializeData() {
    // Add sample users
    const sampleUsers: InsertUser[] = [
      {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@crm.com",
        role: "sales_manager",
        isActive: true
      },
      {
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@crm.com", 
        role: "sales_rep",
        isActive: true
      },
      {
        firstName: "Carol",
        lastName: "Davis",
        email: "carol@crm.com",
        role: "sales_rep", 
        isActive: true
      }
    ];

    sampleUsers.forEach(user => {
      this.createUser(user);
    });

    // Add sample products
    const sampleProducts: InsertProduct[] = [
      {
        name: "CRM Software License",
        type: "subscription",
        price: "99.99",
        description: "Monthly subscription to our CRM platform",
        category: "Software",
        sku: "CRM-SUB-001",
        isActive: true
      },
      {
        name: "Implementation Service",
        type: "service-based",
        price: "2500.00",
        description: "One-time setup and configuration service",
        category: "Services",
        sku: "IMPL-SRV-001",
        isActive: true
      },
      {
        name: "Training Package",
        type: "onetime",
        price: "500.00",
        description: "User training and documentation package",
        category: "Training",
        sku: "TRN-PKG-001",
        isActive: true
      }
    ];

    sampleProducts.forEach(product => {
      this.createProduct(product);
    });

    // Add sample accounts
    const sampleAccounts: InsertAccount[] = [
      {
        companyName: "Acme Corp",
        industry: "Technology",
        website: "https://acme.com",
        phone: "(555) 123-4567",
        address: "123 Tech Street, San Francisco, CA",
        ownerId: 1 // Alice Johnson
      },
      {
        companyName: "TechInnovate Solutions",
        industry: "Software",
        website: "https://techinnovate.com",
        phone: "(555) 234-5678",
        address: "456 Innovation Ave, Austin, TX",
        ownerId: 2 // Bob Smith
      },
      {
        companyName: "Global Enterprises",
        industry: "Finance",
        website: "https://globalent.com",
        phone: "(555) 345-6789",
        address: "789 Business Blvd, New York, NY",
        ownerId: 3 // Carol Davis
      }
    ];

    sampleAccounts.forEach(account => {
      this.createAccount(account);
    });

    // Add sample contacts
    const sampleContacts: InsertContact[] = [
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@acme.com",
        phone: "(555) 123-4567",
        title: "CTO"
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@techinnovate.com",
        phone: "(555) 234-5678",
        title: "VP of Engineering"
      },
      {
        firstName: "Mike",
        lastName: "Wilson",
        email: "mike.wilson@globalent.com",
        phone: "(555) 345-6789",
        title: "CFO"
      }
    ];

    sampleContacts.forEach(contact => {
      this.createContact(contact);
    });

    // Add sample account-contact relationships
    this.addContactToAccount(1, 1); // John Smith -> Acme Corp
    this.addContactToAccount(2, 2); // Sarah Johnson -> TechInnovate Solutions  
    this.addContactToAccount(3, 3); // Mike Wilson -> Global Enterprises

    // Add sample leads
    const sampleLeads: InsertLead[] = [
      {
        firstName: "Alex",
        lastName: "Chen",
        email: "alex.chen@startup.com",
        phone: "(555) 111-2222",
        company: "StartupCo",
        title: "CEO",
        source: "website",
        status: "converted", // This lead was converted to opportunity
        ownerId: 1 // Alice Johnson
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@retailco.com",
        phone: "(555) 333-4444",
        company: "RetailCo",
        title: "Marketing Director",
        source: "referral",
        status: "converted", // This lead was converted to opportunity
        ownerId: 2 // Bob Smith
      },
      {
        firstName: "David",
        lastName: "Martinez",
        email: "d.martinez@healthtech.com",
        phone: "(555) 777-8888",
        company: "HealthTech Solutions",
        title: "VP of Sales",
        source: "trade-show",
        status: "qualified",
        ownerId: 1 // Alice Johnson
      },
      {
        firstName: "Lisa",
        lastName: "Wang",
        email: "lisa.wang@ecommerce.net",
        phone: "(555) 999-0000",
        company: "E-Commerce Plus",
        title: "COO",
        source: "social-media",
        status: "new",
        ownerId: 3 // Carol Davis
      },
      {
        firstName: "Robert",
        lastName: "Thompson",
        email: "robert.t@manufacturing.com",
        phone: "(555) 444-5555",
        company: "Manufacturing Co",
        title: "Plant Manager",
        source: "cold-call",
        status: "contacted",
        ownerId: 2 // Bob Smith
      },
      {
        firstName: "Jennifer",
        lastName: "Lee",
        email: "j.lee@consulting.biz",
        phone: "(555) 666-7777",
        company: "Consulting Partners",
        title: "Partner",
        source: "referral",
        status: "qualified",
        ownerId: 3 // Carol Davis
      }
    ];

    sampleLeads.forEach(lead => {
      this.createLead(lead);
    });

    // Add sample opportunities (some converted from leads, some direct)
    const sampleOpportunities: InsertOpportunity[] = [
      {
        accountId: 1,
        contactId: 1,
        leadId: 1, // Converted from Alex Chen lead
        name: "Software License Renewal",
        value: "63650.00",
        grossProfit: "41150.00",
        grossProfitMargin: 65,
        stage: "proposal",
        probability: 75,
        closeDate: new Date("2024-03-15"),
        leadSource: "website", // Inherited from lead
        description: "Annual software license renewal for enterprise package including premium support",
        ownerId: 1 // Alice Johnson
      },
      {
        accountId: 2,
        contactId: 2,
        leadId: 2, // Converted from Emily Davis lead
        name: "Enterprise Solution Implementation",
        value: "9105.00",
        grossProfit: "2745.00",
        grossProfitMargin: 30,
        stage: "negotiation",
        probability: 60,
        closeDate: new Date("2024-03-22"),
        leadSource: "referral", // Inherited from lead
        description: "Full enterprise solution deployment with custom integrations and training",
        ownerId: 2 // Bob Smith
      },
      {
        accountId: 3,
        contactId: 3,
        leadId: null, // Direct opportunity, not from lead conversion
        name: "Financial Consulting Services",
        value: "1512.00",
        grossProfit: "252.00",
        grossProfitMargin: 17,
        stage: "closed-won",
        probability: 100,
        closeDate: new Date("2024-03-10"),
        leadSource: null, // No lead source since not converted from lead
        description: "Strategic financial consulting for Q2 business expansion planning",
        ownerId: 3 // Carol Davis
      }
    ];

    sampleOpportunities.forEach(opportunity => {
      this.createOpportunity(opportunity);
    });

    // Add sample activities
    const sampleActivities: InsertActivity[] = [
      {
        accountId: 1,
        contactId: 1,
        opportunityId: 1,
        leadId: null,
        type: "call",
        subject: "License Renewal Discussion",
        description: "Discussed renewal terms and pricing options",
        dueDate: null,
        completed: true
      },
      {
        accountId: 2,
        contactId: 2,
        opportunityId: 2,
        leadId: null,
        type: "email",
        subject: "Proposal Sent",
        description: "Sent detailed proposal for enterprise solution",
        dueDate: null,
        completed: true
      },
      {
        leadId: 1,
        accountId: null,
        contactId: null,
        opportunityId: null,
        type: "call",
        subject: "Initial Lead Contact",
        description: "First contact with potential customer",
        dueDate: new Date("2024-03-20"),
        completed: false
      }
    ];

    sampleActivities.forEach(activity => {
      this.createActivity(activity);
    });

    // Add sample orders with proper date handling
    const sampleOrders: InsertOrder[] = [
      {
        opportunityId: 1,
        orderNumber: "ORD-2024-001",
        totalAmount: "63650.00",
        status: "confirmed",
        orderDate: new Date("2024-01-15")
      },
      {
        opportunityId: 2,
        orderNumber: "ORD-2024-002",
        totalAmount: "9105.00",
        status: "draft",
        orderDate: new Date("2024-02-20")
      },
      {
        opportunityId: 3,
        orderNumber: "ORD-2024-003",
        totalAmount: "1512.00",
        status: "delivered",
        orderDate: new Date("2024-03-05")
      }
    ];

    // Create orders synchronously first
    const createdOrders: Order[] = [];
    for (const order of sampleOrders) {
      const id = this.currentOrderId++;
      const now = new Date();
      const orderObj: Order = {
        ...order,
        status: order.status || 'draft',
        orderDate: order.orderDate || now,
        id,
        createdAt: now
      };
      this.orders.set(id, orderObj);
      createdOrders.push(orderObj);
    }

    // Add sample order items synchronously
    const sampleOrderItems: InsertOrderItem[] = [
      // Order 1 items
      {
        orderId: createdOrders[0].id,
        productId: 1, // CRM Software License
        quantity: 12,
        unitPrice: "99.99",
        totalPrice: "1199.88"
      },
      {
        orderId: createdOrders[0].id,
        productId: 2, // Implementation Service
        quantity: 25,
        unitPrice: "2500.00",
        totalPrice: "62500.00"
      },
      // Order 2 items
      {
        orderId: createdOrders[1].id,
        productId: 2, // Implementation Service
        quantity: 3,
        unitPrice: "2500.00",
        totalPrice: "7500.00"
      },
      {
        orderId: createdOrders[1].id,
        productId: 3, // Training Package
        quantity: 5,
        unitPrice: "500.00",
        totalPrice: "2500.00"
      },
      // Order 3 items
      {
        orderId: createdOrders[2].id,
        productId: 3, // Training Package
        quantity: 3,
        unitPrice: "500.00",
        totalPrice: "1500.00"
      }
    ];

    for (const orderItem of sampleOrderItems) {
      const id = this.currentOrderItemId++;
      const now = new Date();
      const orderItemObj: OrderItem = {
        ...orderItem,
        quantity: orderItem.quantity || 1,
        id,
        createdAt: now
      };
      this.orderItems.set(id, orderItemObj);
    }
  }

  // Account operations
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = {
      ...insertAccount,
      industry: insertAccount.industry || null,
      website: insertAccount.website || null,
      phone: insertAccount.phone || null,
      address: insertAccount.address || null,
      ownerId: insertAccount.ownerId || null,
      id,
      createdAt: new Date()
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount: Account = {
      ...account,
      ...accountUpdate
    };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  async searchAccounts(query: string): Promise<Account[]> {
    const accounts = Array.from(this.accounts.values());
    const lowerQuery = query.toLowerCase();
    return accounts.filter(account =>
      account.companyName.toLowerCase().includes(lowerQuery) ||
      (account.industry && account.industry.toLowerCase().includes(lowerQuery))
    );
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getContactsWithAccounts(): Promise<ContactWithAccounts[]> {
    const contacts = await this.getContacts();
    const contactsWithAccounts: ContactWithAccounts[] = [];

    for (const contact of contacts) {
      const result: ContactWithAccounts = { ...contact, accounts: [] };
      
      // Find all accounts this contact is associated with
      const contactAccountRelations = Array.from(this.accountContacts.values())
        .filter(ac => ac.contactId === contact.id);
      
      for (const relation of contactAccountRelations) {
        const account = await this.getAccount(relation.accountId);
        if (account) {
          result.accounts!.push(account);
        }
      }
      
      contactsWithAccounts.push(result);
    }

    return contactsWithAccounts;
  }

  async getContactsByAccount(accountId: number): Promise<Contact[]> {
    const contactAccountRelations = Array.from(this.accountContacts.values())
      .filter(ac => ac.accountId === accountId);
    
    const contacts: Contact[] = [];
    for (const relation of contactAccountRelations) {
      const contact = await this.getContact(relation.contactId);
      if (contact) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = {
      ...insertContact,
      phone: insertContact.phone || null,
      title: insertContact.title || null,
      id,
      createdAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    const updatedContact: Contact = {
      ...contact,
      ...contactUpdate
    };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const contacts = Array.from(this.contacts.values());
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact =>
      contact.firstName.toLowerCase().includes(lowerQuery) ||
      contact.lastName.toLowerCase().includes(lowerQuery) ||
      contact.email.toLowerCase().includes(lowerQuery)
    );
  }

  // Account-Contact relationship operations
  async addContactToAccount(accountId: number, contactId: number): Promise<AccountContact> {
    const id = this.currentAccountContactId++;
    const accountContact: AccountContact = {
      id,
      accountId,
      contactId,
      createdAt: new Date()
    };
    this.accountContacts.set(id, accountContact);
    return accountContact;
  }

  async removeContactFromAccount(accountId: number, contactId: number): Promise<boolean> {
    const relationToDelete = Array.from(this.accountContacts.entries())
      .find(([_, ac]) => ac.accountId === accountId && ac.contactId === contactId);
    
    if (relationToDelete) {
      return this.accountContacts.delete(relationToDelete[0]);
    }
    return false;
  }

  async getAccountsWithContacts(): Promise<AccountWithContacts[]> {
    const accounts = await this.getAccounts();
    const accountsWithContacts: AccountWithContacts[] = [];

    for (const account of accounts) {
      const result: AccountWithContacts = { ...account, contacts: [] };
      
      // Find all contacts associated with this account
      const accountContactRelations = Array.from(this.accountContacts.values())
        .filter(ac => ac.accountId === account.id);
      
      for (const relation of accountContactRelations) {
        const contact = await this.getContact(relation.contactId);
        if (contact) {
          result.contacts!.push(contact);
        }
      }
      
      accountsWithContacts.push(result);
    }

    return accountsWithContacts;
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = {
      ...insertLead,
      phone: insertLead.phone || null,
      company: insertLead.company || null,
      title: insertLead.title || null,
      source: insertLead.source || null,
      status: insertLead.status || 'new',
      ownerId: insertLead.ownerId || null,
      id,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, leadUpdate: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = {
      ...lead,
      ...leadUpdate
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  async searchLeads(query: string): Promise<Lead[]> {
    const leads = Array.from(this.leads.values());
    const lowerQuery = query.toLowerCase();
    return leads.filter(lead =>
      lead.firstName.toLowerCase().includes(lowerQuery) ||
      lead.lastName.toLowerCase().includes(lowerQuery) ||
      lead.email.toLowerCase().includes(lowerQuery) ||
      (lead.company && lead.company.toLowerCase().includes(lowerQuery))
    );
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async getOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOpportunitiesWithRelations(): Promise<OpportunityWithRelations[]> {
    const opportunities = await this.getOpportunities();
    const opportunitiesWithRelations: OpportunityWithRelations[] = [];

    for (const opportunity of opportunities) {
      const result: OpportunityWithRelations = { ...opportunity };
      
      if (opportunity.accountId) {
        result.account = await this.getAccount(opportunity.accountId);
      }
      
      if (opportunity.contactId) {
        result.contact = await this.getContact(opportunity.contactId);
      }
      
      opportunitiesWithRelations.push(result);
    }

    return opportunitiesWithRelations;
  }

  async getOpportunitiesByAccount(accountId: number): Promise<Opportunity[]> {
    const opportunities = Array.from(this.opportunities.values());
    return opportunities.filter(opportunity => opportunity.accountId === accountId);
  }

  async getOpportunitiesByContact(contactId: number): Promise<Opportunity[]> {
    const opportunities = Array.from(this.opportunities.values());
    return opportunities.filter(opportunity => opportunity.contactId === contactId);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.currentOpportunityId++;
    const now = new Date();
    const opportunity: Opportunity = {
      ...insertOpportunity,
      accountId: insertOpportunity.accountId || null,
      contactId: insertOpportunity.contactId || null,
      leadId: insertOpportunity.leadId || null,
      closeDate: insertOpportunity.closeDate || null,
      leadSource: insertOpportunity.leadSource || null,
      grossProfit: insertOpportunity.grossProfit || null,
      grossProfitMargin: insertOpportunity.grossProfitMargin || null,
      probability: insertOpportunity.probability || null,
      description: insertOpportunity.description || null,
      ownerId: insertOpportunity.ownerId || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, opportunityUpdate: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      ...opportunityUpdate,
      updatedAt: new Date()
    };
    this.opportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    return this.opportunities.delete(id);
  }

  // Helper method to update opportunity value from order totals
  private async updateOpportunityValueFromOrders(opportunityId: number): Promise<void> {
    const orders = await this.getOrdersByOpportunity(opportunityId);
    const totalValue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount);
    }, 0);

    // Update the opportunity value
    const opportunity = this.opportunities.get(opportunityId);
    if (opportunity) {
      const updatedOpportunity: Opportunity = {
        ...opportunity,
        value: totalValue.toFixed(2),
        updatedAt: new Date()
      };
      this.opportunities.set(opportunityId, updatedOpportunity);
    }
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getActivitiesWithRelations(): Promise<ActivityWithRelations[]> {
    const activities = await this.getActivities();
    const activitiesWithRelations: ActivityWithRelations[] = [];

    for (const activity of activities) {
      const result: ActivityWithRelations = {
        id: activity.id,
        type: activity.type,
        description: activity.description,
        accountId: activity.accountId,
        contactId: activity.contactId,
        leadId: activity.leadId,
        opportunityId: activity.opportunityId,
        createdAt: activity.createdAt
      };
      
      if (activity.accountId) {
        result.account = await this.getAccount(activity.accountId);
      }
      
      if (activity.contactId) {
        result.contact = await this.getContact(activity.contactId);
      }
      
      if (activity.leadId) {
        result.lead = await this.getLead(activity.leadId);
      }
      
      if (activity.opportunityId) {
        result.opportunity = await this.getOpportunity(activity.opportunityId);
      }
      
      if (activity.createdBy) {
        const user = await this.getUser(activity.createdBy);
        if (user) {
          result.createdBy = user;
        }
      }
      
      activitiesWithRelations.push(result);
    }

    return activitiesWithRelations;
  }

  async getActivitiesByAccount(accountId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.accountId === accountId);
  }

  async getActivitiesByContact(contactId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.contactId === contactId);
  }

  async getActivitiesByLead(leadId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.leadId === leadId);
  }

  async getActivitiesByOpportunity(opportunityId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.opportunityId === opportunityId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      accountId: insertActivity.accountId || null,
      contactId: insertActivity.contactId || null,
      leadId: insertActivity.leadId || null,
      opportunityId: insertActivity.opportunityId || null,
      description: insertActivity.description || null,
      richTextContent: insertActivity.richTextContent || null,
      dueDate: insertActivity.dueDate || null,
      completed: insertActivity.completed || false,
      createdBy: insertActivity.createdBy || null,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: number, activityUpdate: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;

    const updatedActivity: Activity = {
      ...activity,
      ...activityUpdate
    };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      role: insertUser.role || 'sales_rep',
      isActive: insertUser.isActive ?? true,
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userUpdate
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      description: insertProduct.description || null,
      isActive: insertProduct.isActive ?? true,
      id,
      createdAt: now
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...productUpdate
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrdersWithItems(): Promise<OrderWithItems[]> {
    const orders = await this.getOrders();
    const ordersWithItems: OrderWithItems[] = [];

    for (const order of orders) {
      const result: OrderWithItems = { ...order };
      result.items = await this.getOrderItemsByOrder(order.id);
      ordersWithItems.push(result);
    }

    return ordersWithItems;
  }

  async getOrdersByOpportunity(opportunityId: number): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values()).filter(order => order.opportunityId === opportunityId);
    const ordersWithItems: OrderWithItems[] = [];

    for (const order of orders) {
      const result: OrderWithItems = { ...order };
      result.items = await this.getOrderItemsByOrder(order.id);
      ordersWithItems.push(result);
    }

    return ordersWithItems;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = {
      ...insertOrder,
      status: insertOrder.status || 'draft',
      orderDate: insertOrder.orderDate || now,
      id,
      createdAt: now
    };
    this.orders.set(id, order);
    
    // Update opportunity value based on order totals
    await this.updateOpportunityValueFromOrders(order.opportunityId);
    
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      ...orderUpdate
    };
    this.orders.set(id, updatedOrder);
    
    // Update opportunity value based on order totals
    await this.updateOpportunityValueFromOrders(updatedOrder.opportunityId);
    
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const order = this.orders.get(id);
    if (!order) return false;
    
    const opportunityId = order.opportunityId;
    const deleted = this.orders.delete(id);
    
    if (deleted) {
      // Update opportunity value after order deletion
      await this.updateOpportunityValueFromOrders(opportunityId);
    }
    
    return deleted;
  }

  // Order Item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItems(): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrderItemsByOrder(orderId: number): Promise<OrderItemWithProduct[]> {
    const orderItems = Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
    const orderItemsWithProducts: OrderItemWithProduct[] = [];

    for (const orderItem of orderItems) {
      const result: OrderItemWithProduct = { ...orderItem };
      if (orderItem.productId) {
        result.product = await this.getProduct(orderItem.productId);
      }
      orderItemsWithProducts.push(result);
    }

    return orderItemsWithProducts;
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const now = new Date();
    const orderItem: OrderItem = {
      ...insertOrderItem,
      quantity: insertOrderItem.quantity || 1,
      id,
      createdAt: now
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItem(id: number, orderItemUpdate: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;

    const updatedOrderItem: OrderItem = {
      ...orderItem,
      ...orderItemUpdate
    };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Stage Change Log operations
  async getStageChangeLog(id: number): Promise<StageChangeLog | undefined> {
    return this.stageChangeLogs.get(id);
  }

  async getStageChangeLogs(): Promise<StageChangeLog[]> {
    return Array.from(this.stageChangeLogs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStageChangeLogsByOpportunity(opportunityId: number): Promise<StageChangeLogWithUser[]> {
    const stageLogs = Array.from(this.stageChangeLogs.values()).filter(log => log.opportunityId === opportunityId);
    const stageLogsWithUsers: StageChangeLogWithUser[] = [];

    for (const stageLog of stageLogs) {
      const result: StageChangeLogWithUser = { ...stageLog };
      if (stageLog.changedBy) {
        result.user = await this.getUser(stageLog.changedBy);
      }
      stageLogsWithUsers.push(result);
    }

    return stageLogsWithUsers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createStageChangeLog(insertStageChangeLog: InsertStageChangeLog): Promise<StageChangeLog> {
    const id = this.currentStageChangeLogId++;
    const now = new Date();
    const stageChangeLog: StageChangeLog = {
      ...insertStageChangeLog,
      fromStage: insertStageChangeLog.fromStage || null,
      changedBy: insertStageChangeLog.changedBy || null,
      reason: insertStageChangeLog.reason || null,
      id,
      createdAt: now
    };
    this.stageChangeLogs.set(id, stageChangeLog);
    return stageChangeLog;
  }

  // Enhanced Opportunity operations with relations
  async getOpportunityWithRelations(id: number): Promise<OpportunityWithRelations | undefined> {
    const opportunity = await this.getOpportunity(id);
    if (!opportunity) return undefined;

    const result: OpportunityWithRelations = { ...opportunity };
    
    if (opportunity.accountId) {
      result.account = await this.getAccount(opportunity.accountId);
    }
    
    if (opportunity.contactId) {
      result.contact = await this.getContact(opportunity.contactId);
    }
    
    if (opportunity.ownerId) {
      result.owner = await this.getUser(opportunity.ownerId);
    }
    
    // Get orders with items for this opportunity
    result.orders = await this.getOrdersByOpportunity(opportunity.id);
    
    // Get stage change logs for this opportunity
    result.stageLogs = await this.getStageChangeLogsByOpportunity(opportunity.id);
    
    // Get activities for this opportunity
    const allActivitiesWithRelations = await this.getActivitiesWithRelations();
    result.activities = allActivitiesWithRelations.filter(activity => activity.opportunityId === opportunity.id);
    
    return result;
  }

  async getOpportunitiesWithRelations(): Promise<OpportunityWithRelations[]> {
    const opportunities = await this.getOpportunities();
    const opportunitiesWithRelations: OpportunityWithRelations[] = [];

    for (const opportunity of opportunities) {
      const opportunityWithRelations = await this.getOpportunityWithRelations(opportunity.id);
      if (opportunityWithRelations) {
        opportunitiesWithRelations.push(opportunityWithRelations);
      }
    }

    return opportunitiesWithRelations;
  }

  // Enhanced Lead operations with relations
  async getLeadsWithRelations(): Promise<LeadWithRelations[]> {
    const leads = await this.getLeads();
    const leadsWithRelations: LeadWithRelations[] = [];

    for (const lead of leads) {
      const result: LeadWithRelations = { ...lead };
      
      if (lead.ownerId) {
        result.owner = await this.getUser(lead.ownerId);
      }
      
      // Get activities with relations and filter for this lead
      const allActivitiesWithRelations = await this.getActivitiesWithRelations();
      result.activities = allActivitiesWithRelations.filter(activity => activity.leadId === lead.id);
      
      leadsWithRelations.push(result);
    }

    return leadsWithRelations;
  }

  // Dashboard operations
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const accounts = await this.getAccounts();
    const contacts = await this.getContacts();
    const leads = await this.getLeads();
    const opportunities = await this.getOpportunities();
    
    const activeOpportunities = opportunities.filter(opp => 
      opp.stage !== 'closed-won' && opp.stage !== 'closed-lost'
    );
    
    const closedWonOpportunities = opportunities.filter(opp => opp.stage === 'closed-won');
    const totalRevenue = closedWonOpportunities.reduce((sum, opp) => 
      sum + parseFloat(opp.value), 0
    );
    
    const conversionRate = opportunities.length > 0 
      ? (closedWonOpportunities.length / opportunities.length) * 100 
      : 0;

    // Mock growth percentages (in a real app, this would compare with previous periods)
    return {
      totalAccounts: accounts.length,
      totalContacts: contacts.length,
      totalLeads: leads.length,
      activeOpportunities: activeOpportunities.length,
      revenue: totalRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      accountGrowth: 12,
      leadGrowth: 25,
      opportunityGrowth: 8,
      revenueGrowth: -3
    };
  }
}

export const storage = new MemStorage();
