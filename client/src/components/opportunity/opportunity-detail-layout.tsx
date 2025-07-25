import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Users, Building, Package, FileText, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { OpportunityWithRelations } from "@shared/schema";
import OpportunityDetailTab from "./opportunity-detail-tab";
import OpportunityRelatedTab from "./opportunity-related-tab";
import OpportunityActivityTab from "./opportunity-activity-tab";

interface OpportunityDetailLayoutProps {
  opportunityId: number;
  onBack: () => void;
  onEdit: (opportunity: OpportunityWithRelations) => void;
}

// Schema for stage change
const stageChangeSchema = z.object({
  stage: z.string(),
  reason: z.string().optional(),
});

const stageOptions = [
  { value: "prospecting", label: "Prospecting", color: "bg-blue-100 text-blue-800" },
  { value: "qualification", label: "Qualification", color: "bg-yellow-100 text-yellow-800" },
  { value: "proposal", label: "Proposal", color: "bg-orange-100 text-orange-800" },
  { value: "negotiation", label: "Negotiation", color: "bg-purple-100 text-purple-800" },
  { value: "closed-won", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "closed-lost", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("detail");
  const [stageChangeOpen, setStageChangeOpen] = useState(false);

  const stageForm = useForm({
    resolver: zodResolver(stageChangeSchema),
    defaultValues: {
      stage: "",
      reason: "",
    },
  });

  const changeStageMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update opportunity stage
      const stageUpdateResponse = await apiRequest("PATCH", `/api/opportunities/${opportunityId}`, {
        stage: data.stage,
      });

      // Create stage change log
      await apiRequest("POST", "/api/stage-logs", {
        opportunityId: opportunityId,
        fromStage: opportunity?.stage,
        toStage: data.stage,
        reason: data.reason || null,
        userId: 1, // Default user for now
      });

      return stageUpdateResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunityId, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity stage updated successfully.",
      });
      setStageChangeOpen(false);
      stageForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stage.",
        variant: "destructive",
      });
    },
  });

  const handleStageChange = (data: any) => {
    changeStageMutation.mutate(data);
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
          <Dialog open={stageChangeOpen} onOpenChange={setStageChangeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Change Closed Stage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Change Opportunity Stage</DialogTitle>
                <DialogDescription>
                  Select the stage to move this opportunity through the sales pipeline.
                </DialogDescription>
              </DialogHeader>
              
              {/* Visual Pipeline Selector */}
              <div className="my-6">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  {stageOptions.map((stage, index) => {
                    const isActive = stage.value === opportunity?.stage;
                    const isSelected = stageForm.watch('stage') === stage.value;
                    const isCompleted = stageOptions.findIndex(s => s.value === opportunity?.stage) > index;
                    
                    return (
                      <div key={stage.value} className="flex items-center">
                        <div 
                          className={`relative cursor-pointer transition-all duration-200 ${
                            isSelected ? 'transform scale-110' : ''
                          }`}
                          onClick={() => stageForm.setValue('stage', stage.value)}
                        >
                          {/* Stage Circle */}
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all
                            ${isActive ? 'bg-blue-600 text-white border-blue-600' : 
                              isCompleted ? 'bg-green-600 text-white border-green-600' :
                              isSelected ? 'bg-blue-100 text-blue-600 border-blue-600' :
                              'bg-white text-gray-400 border-gray-300'}
                          `}>
                            {index + 1}
                          </div>
                          
                          {/* Stage Label */}
                          <div className="mt-2 text-center">
                            <div className={`text-sm font-medium ${
                              isActive || isSelected ? 'text-blue-600' : 
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
                        {index < stageOptions.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Stage Information */}
                {stageForm.watch('stage') && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">
                      Selected: {stageOptions.find(s => s.value === stageForm.watch('stage'))?.label}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {stageForm.watch('stage') === 'prospecting' && 'Initial contact and research phase'}
                      {stageForm.watch('stage') === 'qualification' && 'Qualifying the lead and understanding needs'}
                      {stageForm.watch('stage') === 'proposal' && 'Preparing and presenting proposal'}
                      {stageForm.watch('stage') === 'negotiation' && 'Negotiating terms and pricing'}
                      {stageForm.watch('stage') === 'closed-won' && 'Deal successfully closed'}
                      {stageForm.watch('stage') === 'closed-lost' && 'Deal lost or abandoned'}
                    </div>
                  </div>
                )}
              </div>

              <Form {...stageForm}>
                <form onSubmit={stageForm.handleSubmit(handleStageChange)} className="space-y-4">
                  <FormField
                    control={stageForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Stage Change (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Why is this stage change happening? (e.g., 'Client signed contract', 'Budget approved', 'Competitor chosen')"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStageChangeOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={changeStageMutation.isPending || !stageForm.watch('stage')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {changeStageMutation.isPending ? "Updating..." : "Update Stage"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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