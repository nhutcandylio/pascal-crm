import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import ActivityModal from "@/components/modals/activity-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Calendar, FileText, Building, DollarSign } from "lucide-react";
import type { ActivityWithRelations } from "@shared/schema";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
};

const activityColors = {
  call: "bg-blue-100 text-blue-600",
  email: "bg-green-100 text-green-600",
  meeting: "bg-yellow-100 text-yellow-600",
  note: "bg-purple-100 text-purple-600",
};

export default function Activities() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: activities, isLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: ["/api/activities"],
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <>
      <TopBar title="Activities" subtitle="Track all customer interactions and activities" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
            {activities && (
              <Badge variant="outline">
                {activities.length} total
              </Badge>
            )}
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No activities found</h3>
              <p className="text-slate-600 mb-4">
                Start tracking your customer interactions by logging your first activity.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = activityIcons[activity.type as keyof typeof activityIcons];
              const iconColorClass = activityColors[activity.type as keyof typeof activityColors];
              
              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColorClass}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="capitalize">
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatTimeAgo(activity.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-slate-900 mb-3">{activity.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          {activity.customer && (
                            <div className="flex items-center">
                              <Building className="h-3 w-3 mr-1 text-slate-400" />
                              <span>{activity.customer.companyName}</span>
                            </div>
                          )}
                          
                          {activity.deal && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1 text-slate-400" />
                              <span>{activity.deal.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <ActivityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
