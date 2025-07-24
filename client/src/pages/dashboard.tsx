import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building, Users, UserPlus, Handshake, TrendingUp, DollarSign, Calendar, Phone, Mail, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
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
  const wonOpportunities = opportunities?.filter(opp => opp.stage === 'closed-won').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonOpportunities / totalLeads) * 100) : 0;

  // Chart data
  const pipelineData = [
    { stage: 'Prospecting', count: opportunities?.filter(o => o.stage === 'prospecting').length || 0, value: opportunities?.filter(o => o.stage === 'prospecting').reduce((sum, o) => sum + parseFloat(o.value), 0) || 0 },
    { stage: 'Qualification', count: opportunities?.filter(o => o.stage === 'qualification').length || 0, value: opportunities?.filter(o => o.stage === 'qualification').reduce((sum, o) => sum + parseFloat(o.value), 0) || 0 },
    { stage: 'Proposal', count: opportunities?.filter(o => o.stage === 'proposal').length || 0, value: opportunities?.filter(o => o.stage === 'proposal').reduce((sum, o) => sum + parseFloat(o.value), 0) || 0 },
    { stage: 'Negotiation', count: opportunities?.filter(o => o.stage === 'negotiation').length || 0, value: opportunities?.filter(o => o.stage === 'negotiation').reduce((sum, o) => sum + parseFloat(o.value), 0) || 0 },
    { stage: 'Closed Won', count: opportunities?.filter(o => o.stage === 'closed-won').length || 0, value: opportunities?.filter(o => o.stage === 'closed-won').reduce((sum, o) => sum + parseFloat(o.value), 0) || 0 },
  ];

  const leadSourceData = [
    { name: 'Website', value: leads?.filter(l => l.source === 'website').length || 0, color: '#3B82F6' },
    { name: 'Referral', value: leads?.filter(l => l.source === 'referral').length || 0, color: '#10B981' },
    { name: 'Cold Call', value: leads?.filter(l => l.source === 'cold-call').length || 0, color: '#F59E0B' },
    { name: 'Social Media', value: leads?.filter(l => l.source === 'social-media').length || 0, color: '#8B5CF6' },
    { name: 'Email', value: leads?.filter(l => l.source === 'email-campaign').length || 0, color: '#EF4444' },
  ];

  const activityTrendData = [
    { month: 'Jan', calls: 12, emails: 28, meetings: 8 },
    { month: 'Feb', calls: 15, emails: 32, meetings: 12 },
    { month: 'Mar', calls: 18, emails: 35, meetings: 15 },
    { month: 'Apr', calls: 22, emails: 40, meetings: 18 },
    { month: 'May', calls: 25, emails: 45, meetings: 22 },
    { month: 'Jun', calls: 28, emails: 48, meetings: 25 },
  ];

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
    <main className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -3% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +24% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <Progress value={conversionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? `${value} opportunities` : `$${value.toLocaleString()}`,
                      name === 'count' ? 'Count' : 'Value'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3B82F6" name="count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2} name="Calls" />
                <Line type="monotone" dataKey="emails" stroke="#10B981" strokeWidth={2} name="Emails" />
                <Line type="monotone" dataKey="meetings" stroke="#8B5CF6" strokeWidth={2} name="Meetings" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
  );
}
