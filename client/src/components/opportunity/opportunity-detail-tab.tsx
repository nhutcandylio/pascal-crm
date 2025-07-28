import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, User, DollarSign, Calendar, TrendingUp, Percent, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditableField, EditableCurrencyField, EditablePercentageField, EditableDateField } from "@/components/ui/editable-field";
import type { OpportunityWithRelations, Account, Contact } from "@shared/schema";

interface OpportunityDetailTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityDetailTab({ opportunity }: OpportunityDetailTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const value = parseFloat(opportunity.value) || 0;
  const grossProfit = parseFloat(opportunity.grossProfit || "0") || 0;
  const grossProfitMargin = opportunity.grossProfitMargin || 0;

  const handleFieldUpdate = async (field: string, value: string) => {
    const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, { [field]: value });
    if (!response.ok) {
      throw new Error('Failed to update opportunity');
    }
    queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
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
              <EditableField
                label="Opportunity Name"
                value={opportunity.name}
                onSave={(value) => handleFieldUpdate('name', value)}
                placeholder="Enter opportunity name"
              />

              <EditableField
                label="Account"
                value={opportunity.accountId?.toString() || ""}
                onSave={(value) => handleFieldUpdate('accountId', value)}
                placeholder="Select account"
                type="select"
                options={accounts.map(account => ({
                  value: account.id.toString(),
                  label: account.companyName
                }))}
                displayValue={opportunity.account?.companyName}
              />

              <EditableField
                label="Primary Contact"
                value={opportunity.contactId?.toString() || ""}
                onSave={(value) => handleFieldUpdate('contactId', value)}
                placeholder="Select contact"
                type="select"
                options={contacts.map(contact => ({
                  value: contact.id.toString(),
                  label: `${contact.firstName} ${contact.lastName}`
                }))}
                displayValue={opportunity.contact 
                  ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                  : undefined
                }
              />

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

              <EditablePercentageField
                label="Probability"
                value={opportunity.probability}
                onSave={(value) => handleFieldUpdate('probability', value)}
                placeholder="0"
              />

              <EditableDateField
                label="Close Date"
                value={opportunity.closeDate}
                onSave={(value) => handleFieldUpdate('closeDate', value)}
                placeholder="Select close date"
              />

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
            <EditableCurrencyField
              label="Opportunity Value"
              value={opportunity.value}
              onSave={(value) => handleFieldUpdate('value', value)}
              placeholder="0.00"
            />

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
          <EditableField
            label="Description"
            value={opportunity.description}
            onSave={(value) => handleFieldUpdate('description', value)}
            placeholder="Enter opportunity description..."
            type="textarea"
          />
        </CardContent>
      </Card>
    </div>
  );
}