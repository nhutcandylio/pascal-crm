import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Building, User, DollarSign, Calendar, TrendingUp, Percent, Edit2, Check, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OpportunityWithRelations } from "@shared/schema";

interface OpportunityDetailTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityDetailTab({ opportunity }: OpportunityDetailTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: opportunity.name,
    description: opportunity.description || "",
    probability: opportunity.probability || 0,
  });

  const value = parseFloat(opportunity.value) || 0;
  const grossProfit = parseFloat(opportunity.grossProfit || "0") || 0;
  const grossProfitMargin = opportunity.grossProfitMargin || 0;

  const updateOpportunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity updated successfully.",
      });
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (field: string) => {
    const updateData = { [field]: editValues[field as keyof typeof editValues] };
    updateOpportunityMutation.mutate(updateData);
  };

  const handleCancel = (field: string) => {
    setEditValues(prev => ({
      ...prev,
      [field]: field === 'name' ? opportunity.name : 
               field === 'description' ? (opportunity.description || "") :
               field === 'probability' ? (opportunity.probability || 0) : prev[field as keyof typeof prev]
    }));
    setEditingField(null);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Opportunity Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Opportunity Name</label>
                {editingField === 'name' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleSave('name')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCancel('name')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 group">
                    <p className="text-base font-medium flex-1">{opportunity.name}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => setEditingField('name')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Account</label>
                <p className="text-base font-medium flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{opportunity.account?.companyName || "No Account"}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                <p className="text-base font-medium flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {opportunity.contact 
                      ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                      : "No Contact"
                    }
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner</label>
                <p className="text-base font-medium flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {opportunity.owner 
                      ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}`
                      : "Unassigned"
                    }
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stage</label>
                <div className="mt-1">
                  <Badge className={
                    opportunity.stage === 'closed-won' ? 'bg-green-100 text-green-800' :
                    opportunity.stage === 'closed-lost' ? 'bg-red-100 text-red-800' :
                    opportunity.stage === 'negotiation' ? 'bg-purple-100 text-purple-800' :
                    opportunity.stage === 'proposal' ? 'bg-orange-100 text-orange-800' :
                    opportunity.stage === 'qualification' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {opportunity.stage}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Probability (%)</label>
                {editingField === 'probability' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editValues.probability}
                      onChange={(e) => setEditValues(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleSave('probability')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCancel('probability')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 group">
                    <p className="text-base font-medium flex items-center space-x-2 flex-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{opportunity.probability || 0}%</span>
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => setEditingField('probability')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Close Date</label>
                <p className="text-base font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {opportunity.closeDate 
                      ? format(new Date(opportunity.closeDate), 'MMM dd, yyyy')
                      : 'Not set'
                    }
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-base font-medium">
                  {format(new Date(opportunity.createdAt), 'MMM dd, yyyy, h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Opportunity Value</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  ${value.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Gross Profit</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  ${grossProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Gross Profit Margin</label>
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {grossProfitMargin}%
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Weighted Value</label>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-xl font-bold text-orange-600">
                ${((value * (opportunity.probability || 0)) / 100).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                (Value × Probability)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage History */}
      {opportunity.stageLogs && opportunity.stageLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stage History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunity.stageLogs.map((log, index) => (
                <div key={log.id} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {log.fromStage && (
                        <>
                          <Badge variant="outline">{log.fromStage}</Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge>{log.toStage}</Badge>
                    </div>
                    {log.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM dd, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Description</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingField === 'description' ? (
            <div className="space-y-3">
              <Textarea
                value={editValues.description}
                onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter opportunity description..."
                rows={4}
                className="w-full"
              />
              <div className="flex justify-end space-x-2">
                <Button size="sm" onClick={() => handleSave('description')}>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancel('description')}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {opportunity.description ? (
                    <p className="text-base leading-relaxed">{opportunity.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 ml-2"
                  onClick={() => setEditingField('description')}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}