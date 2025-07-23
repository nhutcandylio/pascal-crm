import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
// import MetricsCards from "@/components/dashboard/metrics-cards";
// import RecentDeals from "@/components/dashboard/recent-deals";
// import RecentActivities from "@/components/dashboard/recent-activities";
// import QuickActions from "@/components/dashboard/quick-actions";
import type { DashboardMetrics, OpportunityWithRelations, ActivityWithRelations } from "@shared/schema";

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

  const recentOpportunities = opportunities?.slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 4) || [];

  return (
    <>
      <TopBar 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening with your CRM today." 
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">
            Welcome to your CRM Dashboard
          </h2>
          <p className="text-slate-600">
            Your comprehensive customer relationship management system is ready to use.
            Navigate to Accounts, Contacts, Leads, or Opportunities to start managing your business relationships.
          </p>
        </div>
      </main>
    </>
  );
}
