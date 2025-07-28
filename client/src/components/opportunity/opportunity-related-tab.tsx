import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building, User, Users, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { EditableField } from "@/components/ui/editable-field";
import type { OpportunityWithRelations, Contact } from "@shared/schema";

interface OpportunityRelatedTabProps {
  opportunity: OpportunityWithRelations;
}

function AccountContactsList({ accountId, primaryContactId }: { accountId: number; primaryContactId: number | null }) {
  const { data: accountContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/accounts", accountId, "contacts"],
  });

  if (accountContacts.length === 0) {
    return <p className="text-muted-foreground">No contacts found for this account</p>;
  }

  return (
    <div className="space-y-3">
      {accountContacts.map((contact) => (
        <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium">{contact.firstName} {contact.lastName}</p>
              {contact.id === primaryContactId && (
                <Badge variant="default">Primary</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <p>{contact.email}</p>
              {contact.title && <p>{contact.title}</p>}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {contact.phone && <p>{contact.phone}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OpportunityRelatedTab({ opportunity }: OpportunityRelatedTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateAccountMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      const response = await fetch(`/api/accounts/${opportunity.accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      const response = await fetch(`/api/contacts/${opportunity.contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
    },
  });

  const handleAccountFieldUpdate = async (field: string, value: string) => {
    await updateAccountMutation.mutateAsync({ field, value });
  };

  const handleContactFieldUpdate = async (field: string, value: string) => {
    await updateContactMutation.mutateAsync({ field, value });
  };
  return (
    <div className="space-y-6">
      {/* Related Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Related Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Account</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <User className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Contact</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{opportunity.activities?.filter(activity => activity.type !== 'stage_change').length || 0}</p>
              <p className="text-sm text-muted-foreground">Activities</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{opportunity.stageLogs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Stage Changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.account ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField
                  label="Company Name"
                  value={opportunity.account.companyName}
                  onSave={(value) => handleAccountFieldUpdate('companyName', value)}
                  placeholder="Enter company name"
                />
                <EditableField
                  label="Industry"
                  value={opportunity.account.industry}
                  onSave={(value) => handleAccountFieldUpdate('industry', value)}
                  placeholder="Enter industry"
                />
                <EditableField
                  label="Website"
                  value={opportunity.account.website}
                  onSave={(value) => handleAccountFieldUpdate('website', value)}
                  placeholder="Enter website URL"
                />
                <EditableField
                  label="Phone"
                  value={opportunity.account.phone}
                  onSave={(value) => handleAccountFieldUpdate('phone', value)}
                  placeholder="Enter phone number"
                />
              </div>
              <EditableField
                label="Address"
                value={opportunity.account.address}
                onSave={(value) => handleAccountFieldUpdate('address', value)}
                placeholder="Enter company address"
              />
            </div>
          ) : (
            <p className="text-muted-foreground">No account information available</p>
          )}
        </CardContent>
      </Card>

      {/* All Account Contacts */}
      {opportunity.account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Account Contacts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccountContactsList accountId={opportunity.account.id} primaryContactId={opportunity.contactId} />
          </CardContent>
        </Card>
      )}

      {/* Recent Activities Summary */}
      {opportunity.activities && opportunity.activities.filter(activity => activity.type !== 'stage_change').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunity.activities.filter(activity => activity.type !== 'stage_change').slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{activity.type}</Badge>
                      <p className="font-medium">{activity.subject}</p>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {activity.createdAt && !isNaN(new Date(activity.createdAt).getTime()) 
                      ? format(new Date(activity.createdAt), 'MMM dd') 
                      : 'No date'
                    }
                  </div>
                </div>
              ))}
              {opportunity.activities.filter(activity => activity.type !== 'stage_change').length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{opportunity.activities.filter(activity => activity.type !== 'stage_change').length - 3} more activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Changes History */}
      {opportunity.stageLogs && opportunity.stageLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Stage Changes History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunity.stageLogs.map((stageLog) => (
                <div key={stageLog.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-slate-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Stage Change
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          #{stageLog.id}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-muted-foreground">From:</span>
                          <Badge variant="outline" className="capitalize">
                            {stageLog.fromStage || 'Initial'}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm font-medium text-muted-foreground">To:</span>
                          <Badge variant="default" className="capitalize">
                            {stageLog.toStage}
                          </Badge>
                        </div>
                      </div>

                      {stageLog.reason && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Reason:</p>
                          <p className="text-sm bg-white p-2 rounded border italic">
                            "{stageLog.reason}"
                          </p>
                        </div>
                      )}

                      {stageLog.user && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Changed by: {stageLog.user.firstName} {stageLog.user.lastName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">
                        {stageLog.createdAt && !isNaN(new Date(stageLog.createdAt).getTime()) 
                          ? format(new Date(stageLog.createdAt), 'MMM dd, yyyy') 
                          : 'No date'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stageLog.createdAt && !isNaN(new Date(stageLog.createdAt).getTime()) 
                          ? format(new Date(stageLog.createdAt), 'h:mm a') 
                          : ''
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Information (if originated from lead) - Hidden for now as lead is not in current schema */}
    </div>
  );
}