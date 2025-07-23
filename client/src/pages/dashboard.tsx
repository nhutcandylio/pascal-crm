import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RecentDeals from "@/components/dashboard/recent-deals";
import RecentActivities from "@/components/dashboard/recent-activities";
import QuickActions from "@/components/dashboard/quick-actions";
import type { DashboardMetrics, DealWithCustomer, ActivityWithRelations } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: deals, isLoading: dealsLoading } = useQuery<DealWithCustomer[]>({
    queryKey: ["/api/deals"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/activities"],
  });

  const recentDeals = deals?.slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 4) || [];

  return (
    <>
      <TopBar 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening with your sales today." 
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <MetricsCards metrics={metrics} isLoading={metricsLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <RecentDeals deals={recentDeals} isLoading={dealsLoading} />
          </div>
          <div>
            <RecentActivities activities={recentActivities} isLoading={activitiesLoading} />
          </div>
        </div>

        <QuickActions />
      </main>
    </>
  );
}
