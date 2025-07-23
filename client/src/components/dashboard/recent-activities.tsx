import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Calendar, FileText, Building, DollarSign } from "lucide-react";
import { Link } from "wouter";
import type { ActivityWithRelations } from "@shared/schema";

interface RecentActivitiesProps {
  activities: ActivityWithRelations[];
  isLoading: boolean;
}

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

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
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
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = activityIcons[activity.type as keyof typeof activityIcons];
              const iconColorClass = activityColors[activity.type as keyof typeof activityColors];
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 mb-1">{activity.description}</p>
                    
                    {(activity.customer || activity.deal) && (
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                        {activity.customer && (
                          <div className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            <span>{activity.customer.companyName}</span>
                          </div>
                        )}
                        {activity.deal && (
                          <>
                            {activity.customer && <span>•</span>}
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>{activity.deal.title}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6">
          <Link href="/activities">
            <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary-foreground hover:bg-primary">
              View All Activities
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
