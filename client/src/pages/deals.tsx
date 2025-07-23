import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import DealModal from "../components/modals/deal-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, Calendar, Building } from "lucide-react";
import type { DealWithCustomer } from "@shared/schema";

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

export default function Deals() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: deals, isLoading } = useQuery<DealWithCustomer[]>({
    queryKey: ["/api/deals"],
  });

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
    <>
      <TopBar title="Deals" subtitle="Track your opportunities and close more deals" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-slate-900">All Deals</h2>
            {deals && (
              <Badge variant="outline">
                {deals.length} total
              </Badge>
            )}
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-slate-200 rounded flex-1"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !deals || deals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No deals found</h3>
              <p className="text-slate-600 mb-4">
                Start tracking your opportunities by creating your first deal.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal & Customer</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Close Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{deal.title}</div>
                          <div className="flex items-center text-sm text-slate-600 mt-1">
                            <Building className="h-3 w-3 mr-1" />
                            <span>{deal.customer.companyName}</span>
                            <span className="mx-2">•</span>
                            <span>{deal.customer.contactName}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-medium text-slate-900">
                          <DollarSign className="h-4 w-4 mr-1 text-slate-400" />
                          {formatCurrency(deal.value)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={stageColors[deal.stage as keyof typeof stageColors]}
                        >
                          {stageLabels[deal.stage as keyof typeof stageLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                          {formatDate(deal.closeDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {formatDate(deal.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <DealModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
