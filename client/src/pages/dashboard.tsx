import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Users, UserPlus, Handshake, TrendingUp, DollarSign, Calendar, Phone, Mail, Plus } from "lucide-react";
import type { DashboardMetrics, OpportunityWithRelations, ActivityWithRelations, Account, Contact, Lead } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<OpportunityWithRelations[]>({
    queryKey: ["/api/opportunities"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/activities"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const recentOpportunities = opportunities?.slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 4) || [];

  // Calculate metrics
  const totalAccounts = accounts?.length || 0;
  const totalContacts = contacts?.length || 0;
  const totalLeads = leads?.length || 0;
  const totalOpportunities = opportunities?.length || 0;
  const totalRevenue = opportunities?.reduce((sum, opp) => sum + parseFloat(opp.value), 0) || 0;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      default: return Calendar;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-blue-100 text-blue-800';
      case 'qualification': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-orange-100 text-orange-800';
      case 'negotiation': return 'bg-purple-100 text-purple-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <>
      <TopBar 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening with your CRM today." 
      />
      
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <p className="text-xs text-muted-foreground">Active companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts}</div>
              <p className="text-xs text-muted-foreground">People in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">Potential customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total opportunities</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Opportunities */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunitiesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Handshake className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No opportunities yet</p>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Opportunity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOpportunities.map((opp) => (
                      <div key={opp.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{opp.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            {opp.account && (
                              <span className="text-sm text-slate-600">{opp.account.companyName}</span>
                            )}
                            <Badge className={getStageColor(opp.stage)}>
                              {opp.stage.charAt(0).toUpperCase() + opp.stage.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900">${parseFloat(opp.value).toLocaleString()}</div>
                          <div className="text-sm text-slate-600">{opp.probability || 0}% probability</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-start space-x-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No recent activities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 truncate">{activity.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(activity.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Building className="h-5 w-5 mb-2" />
                New Account
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Users className="h-5 w-5 mb-2" />
                Add Contact
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <UserPlus className="h-5 w-5 mb-2" />
                Create Lead
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Handshake className="h-5 w-5 mb-2" />
                New Opportunity
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
