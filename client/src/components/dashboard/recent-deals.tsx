import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, DollarSign, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { DealWithCustomer } from "@shared/schema";

interface RecentDealsProps {
  deals: DealWithCustomer[];
  isLoading: boolean;
}

const stageColors = {
  lead: "bg-slate-100 text-slate-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-blue-100 text-blue-800",
  "closed-won": "bg-green-100 text-green-800",
  "closed-lost": "bg-red-100 text-red-800",
};

const stageLabels = {
  lead: "Lead",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

export default function RecentDeals({ deals, isLoading }: RecentDealsProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Deals</CardTitle>
        <Link href="/deals">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground hover:bg-primary">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No recent deals found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {deals.map((deal) => (
              <div key={deal.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">
                        {deal.customer.companyName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900">{deal.title}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600 mt-1">
                        <Building className="h-3 w-3 mr-1" />
                        <span>{deal.customer.companyName}</span>
                        <span className="mx-2">•</span>
                        <span>{deal.customer.contactName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center font-medium text-slate-900">
                        <DollarSign className="h-4 w-4 mr-1 text-slate-400" />
                        {formatCurrency(deal.value)}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(deal.closeDate)}
                      </div>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={stageColors[deal.stage as keyof typeof stageColors]}
                    >
                      {stageLabels[deal.stage as keyof typeof stageLabels]}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
