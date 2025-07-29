import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Users, Building, Package, FileText, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OpportunityWithRelations, User } from "@shared/schema";
import OpportunityDetailTab from "./opportunity-detail-tab";
import OpportunityRelatedTab from "./opportunity-related-tab";
import OpportunityOrdersTab from "./opportunity-orders-tab";
import OpportunityActivityTab from "./opportunity-activity-tab";

interface OpportunityDetailLayoutProps {
  opportunityId: number;
  onBack: () => void;
  onEdit: (opportunity: OpportunityWithRelations) => void;
  onCreateNew?: () => void;
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
  onEdit,
  onCreateNew
}: OpportunityDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("detail");
  const [stageChangeModal, setStageChangeModal] = useState<{
    isOpen: boolean;
    targetStage: string;
    targetStageLabel: string;
  }>({
    isOpen: false,
    targetStage: "",
    targetStageLabel: "",
  });
  const [stageChangeReason, setStageChangeReason] = useState("");
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleStageChangeClick = (newStage: string, stageLabel: string) => {
    if (newStage === opportunity?.stage) return;
    
    // Prevent stage changes for closed opportunities
    const isClosedOpportunity = opportunity?.stage === 'closed-won' || opportunity?.stage === 'closed-lost';
    if (isClosedOpportunity) {
      toast({
        title: "Cannot Change Stage",
        description: "Closed opportunities cannot have their stage changed.",
        variant: "destructive",
      });
      return;
    }
    
    setStageChangeModal({
      isOpen: true,
      targetStage: newStage,
      targetStageLabel: stageLabel,
    });
    setStageChangeReason("");
  };

  const handleStageChangeConfirm = async () => {
    if (!stageChangeModal.targetStage || !stageChangeReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the stage change.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update opportunity stage
      await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageChangeModal.targetStage }),
      });

      // Create activity log for stage change with reason
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunityId,
          type: 'stage_change',
          subject: `Stage changed from ${stageLabels[opportunity?.stage as keyof typeof stageLabels]} to ${stageChangeModal.targetStageLabel}`,
          description: `Reason: ${stageChangeReason.trim()}`,
          createdBy: 1,
        }),
      });

      toast({
        title: "Stage Updated",
        description: `Opportunity moved to ${stageChangeModal.targetStageLabel}`,
      });

      // Close modal and refresh data using React Query
      setStageChangeModal({ isOpen: false, targetStage: "", targetStageLabel: "" });
      setStageChangeReason("");
      
      // Invalidate and refetch queries to update the UI
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/opportunities", opportunityId, "with-relations"] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/opportunities"] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/activities"] 
      });
    } catch (error) {
      console.error('Failed to update stage:', error);
      toast({
        title: "Error",
        description: "Failed to update opportunity stage. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStageChangeCancel = () => {
    setStageChangeModal({ isOpen: false, targetStage: "", targetStageLabel: "" });
    setStageChangeReason("");
  };

  const updateOwnerMutation = useMutation({
    mutationFn: async (ownerId: number | null) => {
      const response = await apiRequest("PATCH", `/api/opportunities/${opportunityId}`, { ownerId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunityId, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setIsEditingOwner(false);
      toast({
        title: "Owner Updated",
        description: "Opportunity owner has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update owner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOwnerEdit = () => {
    setSelectedOwnerId(opportunity?.ownerId || null);
    setIsEditingOwner(true);
  };

  const handleOwnerSave = () => {
    updateOwnerMutation.mutate(selectedOwnerId);
  };

  const handleOwnerCancel = () => {
    setIsEditingOwner(false);
    setSelectedOwnerId(null);
  };



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



        </div>

        {/* Visual Pipeline Selector */}
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Sales Pipeline</h3>
            <p className="text-sm text-muted-foreground">Click any stage to move this opportunity through the pipeline</p>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            {[
              { value: "prospecting", label: "Prospecting" },
              { value: "qualification", label: "Qualification" },
              { value: "proposal", label: "Proposal" },
              { value: "negotiation", label: "Negotiation" },
              { value: "closed-won", label: "Closed Won" },
              { value: "closed-lost", label: "Closed Lost" },
            ].map((stage, index) => {
              const isActive = stage.value === opportunity?.stage;
              const isCompleted = [
                "prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"
              ].findIndex(s => s === opportunity?.stage) > index;
              const isClosedOpportunity = opportunity?.stage === 'closed-won' || opportunity?.stage === 'closed-lost';
              
              return (
                <div key={stage.value} className="flex items-center">
                  <div 
                    className={`relative transition-all duration-200 ${
                      isActive ? 'transform scale-110' : ''
                    } ${
                      isClosedOpportunity ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
                    }`}
                    onClick={() => handleStageChangeClick(stage.value, stage.label)}
                  >
                    {/* Stage Circle */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all
                      ${isActive ? 'bg-blue-600 text-white border-blue-600' : 
                        isCompleted ? 'bg-green-600 text-white border-green-600' :
                        'bg-white text-gray-400 border-gray-300 hover:border-blue-400'}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Stage Label */}
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : 
                        isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </div>
                    </div>
                    
                    {/* Current Stage Indicator */}
                    {isActive && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  {/* Arrow between stages */}
                  {index < 5 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Stage Description */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-900">
              Current Stage: {opportunity.stage === 'prospecting' ? 'Prospecting' :
                            opportunity.stage === 'qualification' ? 'Qualification' :
                            opportunity.stage === 'proposal' ? 'Proposal' :
                            opportunity.stage === 'negotiation' ? 'Negotiation' :
                            opportunity.stage === 'closed-won' ? 'Closed Won' :
                            opportunity.stage === 'closed-lost' ? 'Closed Lost' : 'Unknown'}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              {opportunity.stage === 'prospecting' && 'Initial contact and research phase'}
              {opportunity.stage === 'qualification' && 'Qualifying the lead and understanding needs'}
              {opportunity.stage === 'proposal' && 'Preparing and presenting proposal'}
              {opportunity.stage === 'negotiation' && 'Negotiating terms and pricing'}
              {opportunity.stage === 'closed-won' && 'Deal successfully closed - Stage changes disabled'}
              {opportunity.stage === 'closed-lost' && 'Deal lost or abandoned - Stage changes disabled'}
            </div>
          </div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detail" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Detail</span>
            </TabsTrigger>
            <TabsTrigger value="related" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Related</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Orders</span>
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

            <TabsContent value="orders" className="h-full">
              <OpportunityOrdersTab opportunity={opportunity} />
            </TabsContent>

            <TabsContent value="activity" className="h-full">
              <OpportunityActivityTab opportunity={opportunity} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Stage Change Modal */}
      <Dialog open={stageChangeModal.isOpen} onOpenChange={(open) => !open && handleStageChangeCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Opportunity Stage</DialogTitle>
            <DialogDescription>
              You are about to move this opportunity to <strong>{stageChangeModal.targetStageLabel}</strong>. 
              Please provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-reason">Reason for Change *</Label>
              <Textarea
                id="stage-reason"
                placeholder="Enter the reason for changing the stage..."
                value={stageChangeReason}
                onChange={(e) => setStageChangeReason(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Stage:</span>
                <Badge variant="outline">{
                  opportunity?.stage === 'prospecting' ? 'Prospecting' :
                  opportunity?.stage === 'qualification' ? 'Qualification' :
                  opportunity?.stage === 'proposal' ? 'Proposal' :
                  opportunity?.stage === 'negotiation' ? 'Negotiation' :
                  opportunity?.stage === 'closed-won' ? 'Closed Won' :
                  opportunity?.stage === 'closed-lost' ? 'Closed Lost' : 'Unknown'
                }</Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">New Stage:</span>
                <Badge>{stageChangeModal.targetStageLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleStageChangeCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStageChangeConfirm}
              disabled={!stageChangeReason.trim()}
            >
              Update Stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}