import { 
  customers, 
  deals, 
  activities, 
  type Customer, 
  type InsertCustomer,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity,
  type DealWithCustomer,
  type ActivityWithRelations,
  type DashboardMetrics
} from "@shared/schema";

export interface IStorage {
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;

  // Deal operations
  getDeal(id: number): Promise<Deal | undefined>;
  getDeals(): Promise<Deal[]>;
  getDealsWithCustomers(): Promise<DealWithCustomer[]>;
  getDealsByCustomer(customerId: number): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(): Promise<Activity[]>;
  getActivitiesWithRelations(): Promise<ActivityWithRelations[]>;
  getActivitiesByCustomer(customerId: number): Promise<Activity[]>;
  getActivitiesByDeal(dealId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;

  // Dashboard operations
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer> = new Map();
  private deals: Map<number, Deal> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentCustomerId = 1;
  private currentDealId = 1;
  private currentActivityId = 1;

  constructor() {
    // Initialize with some sample data for development
    this.initializeData();
  }

  private initializeData() {
    // Add sample customers
    const sampleCustomers: InsertCustomer[] = [
      {
        companyName: "Acme Corp",
        contactName: "John Smith",
        email: "john@acme.com",
        phone: "(555) 123-4567",
        industry: "technology"
      },
      {
        companyName: "TechInnovate",
        contactName: "Sarah Johnson",
        email: "sarah@techinnovate.com",
        phone: "(555) 234-5678",
        industry: "technology"
      },
      {
        companyName: "Global Solutions",
        contactName: "Mike Wilson",
        email: "mike@globalsol.com",
        phone: "(555) 345-6789",
        industry: "finance"
      }
    ];

    sampleCustomers.forEach(customer => {
      this.createCustomer(customer);
    });

    // Add sample deals
    const sampleDeals: InsertDeal[] = [
      {
        customerId: 1,
        title: "Software License Renewal",
        value: "45000.00",
        stage: "proposal",
        closeDate: new Date("2024-03-15")
      },
      {
        customerId: 2,
        title: "Enterprise Solution",
        value: "78500.00",
        stage: "negotiation",
        closeDate: new Date("2024-03-22")
      },
      {
        customerId: 3,
        title: "Consulting Services",
        value: "32000.00",
        stage: "closed-won",
        closeDate: new Date("2024-03-10")
      }
    ];

    sampleDeals.forEach(deal => {
      this.createDeal(deal);
    });

    // Add sample activities
    const sampleActivities: InsertActivity[] = [
      {
        customerId: 1,
        dealId: 1,
        type: "call",
        description: "Called John at Acme Corp to discuss renewal terms"
      },
      {
        customerId: 2,
        dealId: 2,
        type: "email",
        description: "Sent proposal to TechInnovate"
      },
      {
        customerId: 3,
        dealId: 3,
        type: "meeting",
        description: "Meeting scheduled with Global Solutions"
      },
      {
        customerId: null,
        dealId: null,
        type: "note",
        description: "Updated CRM system with new lead qualification criteria"
      }
    ];

    sampleActivities.forEach(activity => {
      this.createActivity(activity);
    });
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const customer: Customer = {
      ...insertCustomer,
      phone: insertCustomer.phone || null,
      industry: insertCustomer.industry || null,
      id,
      createdAt: new Date()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer: Customer = {
      ...customer,
      ...customerUpdate
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    const lowerQuery = query.toLowerCase();
    return customers.filter(customer =>
      customer.companyName.toLowerCase().includes(lowerQuery) ||
      customer.contactName.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery)
    );
  }

  // Deal operations
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDealsWithCustomers(): Promise<DealWithCustomer[]> {
    const deals = await this.getDeals();
    const dealsWithCustomers: DealWithCustomer[] = [];

    for (const deal of deals) {
      const customer = await this.getCustomer(deal.customerId);
      if (customer) {
        dealsWithCustomers.push({
          ...deal,
          customer
        });
      }
    }

    return dealsWithCustomers;
  }

  async getDealsByCustomer(customerId: number): Promise<Deal[]> {
    const deals = Array.from(this.deals.values());
    return deals.filter(deal => deal.customerId === customerId);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.currentDealId++;
    const now = new Date();
    const deal: Deal = {
      ...insertDeal,
      closeDate: insertDeal.closeDate || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: number, dealUpdate: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;

    const updatedDeal: Deal = {
      ...deal,
      ...dealUpdate,
      updatedAt: new Date()
    };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
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
      
      if (activity.customerId) {
        result.customer = await this.getCustomer(activity.customerId);
      }
      
      if (activity.dealId) {
        result.deal = await this.getDeal(activity.dealId);
      }
      
      activitiesWithRelations.push(result);
    }

    return activitiesWithRelations;
  }

  async getActivitiesByCustomer(customerId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.customerId === customerId);
  }

  async getActivitiesByDeal(dealId: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities.filter(activity => activity.dealId === dealId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      customerId: insertActivity.customerId || null,
      dealId: insertActivity.dealId || null,
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
    const customers = await this.getCustomers();
    const deals = await this.getDeals();
    
    const activeDeals = deals.filter(deal => 
      deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    );
    
    const closedWonDeals = deals.filter(deal => deal.stage === 'closed-won');
    const totalRevenue = closedWonDeals.reduce((sum, deal) => 
      sum + parseFloat(deal.value), 0
    );
    
    const conversionRate = deals.length > 0 
      ? (closedWonDeals.length / deals.length) * 100 
      : 0;

    // Mock growth percentages (in a real app, this would compare with previous periods)
    return {
      totalCustomers: customers.length,
      activeDeals: activeDeals.length,
      revenue: totalRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      customerGrowth: 12,
      dealGrowth: 8,
      revenueGrowth: -3,
      conversionGrowth: 5
    };
  }
}

export const storage = new MemStorage();
