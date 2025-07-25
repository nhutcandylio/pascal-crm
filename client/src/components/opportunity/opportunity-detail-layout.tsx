import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, DollarSign, Calendar, TrendingUp, Users, Building, Package, FileText } from "lucide-react";
import { format } from "date-fns";
import type { OpportunityWithRelations } from "@shared/schema";
import OpportunityDetailTab from "./opportunity-detail-tab";
import OpportunityRelatedTab from "./opportunity-related-tab";
import OpportunityActivityTab from "./opportunity-activity-tab";

interface OpportunityDetailLayoutProps {
  opportunityId: number;
  onBack: () => void;
  onEdit: (opportunity: OpportunityWithRelations) => void;
}

const stageColors = {
  "prospecting": "bg-blue-100 text-blue-800",
  "qualification": "bg-yellow-100 text-yellow-800",
  "proposal": "bg-orange-100 text-orange-800",
  "negotiation": "bg-purple-100 text-purple-800",
  "closed-won": "bg-green-100 text-green-800",
  "closed-lost": "bg-red-100 text-red-800",
};

const stageLabels = {
  "prospecting": "Prospecting",
  "qualification": "Qualification",
  "proposal": "Proposal",
  "negotiation": "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

export default function OpportunityDetailLayout({ 
  opportunityId, 
  onBack, 
  onEdit 
}: OpportunityDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("detail");

  const { data: opportunity, isLoading } = useQuery<OpportunityWithRelations>({
    queryKey: ["/api/opportunities", opportunityId, "with-relations"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading opportunity details...</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Opportunity not found</div>
      </div>
    );
  }

  const probability = opportunity.probability || 0;
  const value = parseFloat(opportunity.value) || 0;
  const weightedValue = (value * probability) / 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{opportunity.name}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <Badge className={stageColors[opportunity.stage as keyof typeof stageColors]}>
                  {stageLabels[opportunity.stage as keyof typeof stageLabels]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {opportunity.account?.companyName || "No Account"}
                </span>
                {opportunity.contact && (
                  <span className="text-sm text-muted-foreground">
                    • {opportunity.contact.firstName} {opportunity.contact.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => onEdit(opportunity)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value</p>
                  <p className="text-lg font-bold">${value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Probability</p>
                  <p className="text-lg font-bold">{probability}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weighted Value</p>
                  <p className="text-lg font-bold">${weightedValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Close Date</p>
                  <p className="text-lg font-bold">
                    {opportunity.closeDate 
                      ? format(new Date(opportunity.closeDate), 'MMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detail" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Detail</span>
            </TabsTrigger>
            <TabsTrigger value="related" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Related</span>
              {opportunity.orders && opportunity.orders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {opportunity.orders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Activity</span>
              {opportunity.activities && opportunity.activities.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {opportunity.activities.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-full">
            <TabsContent value="detail" className="h-full">
              <OpportunityDetailTab opportunity={opportunity} />
            </TabsContent>

            <TabsContent value="related" className="h-full">
              <OpportunityRelatedTab opportunity={opportunity} />
            </TabsContent>

            <TabsContent value="activity" className="h-full">
              <OpportunityActivityTab opportunity={opportunity} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}