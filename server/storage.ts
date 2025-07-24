import { 
  accounts,
  contacts,
  leads,
  opportunities,
  activities, 
  type Account, 
  type InsertAccount,
  type Contact,
  type InsertContact,
  type Lead,
  type InsertLead,
  type Opportunity,
  type InsertOpportunity,
  type Activity,
  type InsertActivity,
  type OpportunityWithRelations,
  type ActivityWithRelations,
  type ContactWithAccount,
  type DashboardMetrics
} from "@shared/schema";

export interface IStorage {
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
  getContactsWithAccounts(): Promise<ContactWithAccount[]>;
  getContactsByAccount(accountId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;

  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
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
  private accounts: Map<number, Account> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private leads: Map<number, Lead> = new Map();
  private opportunities: Map<number, Opportunity> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentAccountId = 1;
  private currentContactId = 1;
  private currentLeadId = 1;
  private currentOpportunityId = 1;
  private currentActivityId = 1;

  constructor() {
    // Initialize with some sample data for development
    this.initializeData();
  }

  private initializeData() {
    // Add sample accounts
    const sampleAccounts: InsertAccount[] = [
      {
        companyName: "Acme Corp",
        industry: "Technology",
        website: "https://acme.com",
        phone: "(555) 123-4567",
        address: "123 Tech Street, San Francisco, CA"
      },
      {
        companyName: "TechInnovate Solutions",
        industry: "Software",
        website: "https://techinnovate.com",
        phone: "(555) 234-5678",
        address: "456 Innovation Ave, Austin, TX"
      },
      {
        companyName: "Global Enterprises",
        industry: "Finance",
        website: "https://globalent.com",
        phone: "(555) 345-6789",
        address: "789 Business Blvd, New York, NY"
      }
    ];

    sampleAccounts.forEach(account => {
      this.createAccount(account);
    });

    // Add sample contacts
    const sampleContacts: InsertContact[] = [
      {
        accountId: 1,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@acme.com",
        phone: "(555) 123-4567",
        title: "CTO"
      },
      {
        accountId: 2,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@techinnovate.com",
        phone: "(555) 234-5678",
        title: "VP of Engineering"
      },
      {
        accountId: 3,
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
        status: "new"
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@retailco.com",
        phone: "(555) 333-4444",
        company: "RetailCo",
        title: "Marketing Director",
        source: "referral",
        status: "contacted"
      },
      {
        firstName: "David",
        lastName: "Martinez",
        email: "d.martinez@healthtech.com",
        phone: "(555) 777-8888",
        company: "HealthTech Solutions",
        title: "VP of Sales",
        source: "trade-show",
        status: "qualified"
      },
      {
        firstName: "Lisa",
        lastName: "Wang",
        email: "lisa.wang@ecommerce.net",
        phone: "(555) 999-0000",
        company: "E-Commerce Plus",
        title: "COO",
        source: "social-media",
        status: "new"
      },
      {
        firstName: "Robert",
        lastName: "Thompson",
        email: "robert.t@manufacturing.com",
        phone: "(555) 444-5555",
        company: "Manufacturing Co",
        title: "Plant Manager",
        source: "cold-call",
        status: "contacted"
      },
      {
        firstName: "Jennifer",
        lastName: "Lee",
        email: "j.lee@consulting.biz",
        phone: "(555) 666-7777",
        company: "Consulting Partners",
        title: "Partner",
        source: "referral",
        status: "qualified"
      }
    ];

    sampleLeads.forEach(lead => {
      this.createLead(lead);
    });

    // Add sample opportunities
    const sampleOpportunities: InsertOpportunity[] = [
      {
        accountId: 1,
        contactId: 1,
        name: "Software License Renewal",
        value: "63650.00",
        grossProfit: "41150.00",
        grossProfitMargin: 65,
        stage: "proposal",
        probability: 75,
        closeDate: new Date("2024-03-15"),
        description: "Annual software license renewal for enterprise package including premium support"
      },
      {
        accountId: 2,
        contactId: 2,
        name: "Enterprise Solution Implementation",
        value: "9105.00",
        grossProfit: "2745.00",
        grossProfitMargin: 30,
        stage: "negotiation",
        probability: 60,
        closeDate: new Date("2024-03-22"),
        description: "Full enterprise solution deployment with custom integrations and training"
      },
      {
        accountId: 3,
        contactId: 3,
        name: "Financial Consulting Services",
        value: "1512.00",
        grossProfit: "252.00",
        grossProfitMargin: 17,
        stage: "closed-won",
        probability: 100,
        closeDate: new Date("2024-03-10"),
        description: "Strategic financial consulting for Q2 business expansion planning"
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

  async getContactsWithAccounts(): Promise<ContactWithAccount[]> {
    const contacts = await this.getContacts();
    const contactsWithAccounts: ContactWithAccount[] = [];

    for (const contact of contacts) {
      const result: ContactWithAccount = { ...contact };
      if (contact.accountId) {
        result.account = await this.getAccount(contact.accountId);
      }
      contactsWithAccounts.push(result);
    }

    return contactsWithAccounts;
  }

  async getContactsByAccount(accountId: number): Promise<Contact[]> {
    const contacts = Array.from(this.contacts.values());
    return contacts.filter(contact => contact.accountId === accountId);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = {
      ...insertContact,
      accountId: insertContact.accountId || null,
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
      closeDate: insertOpportunity.closeDate || null,
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
      const result: ActivityWithRelations = { ...activity };
      
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
      dueDate: insertActivity.dueDate || null,
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
