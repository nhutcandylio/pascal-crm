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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Stage Changes History</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {opportunity.stageLogs?.length || 0} changes
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Complete timeline of opportunity stage transitions with reasons and attribution
          </p>
        </CardHeader>
        <CardContent>
          {opportunity.stageLogs && opportunity.stageLogs.length > 0 ? (
            <div className="space-y-4">
              {opportunity.stageLogs
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((stageLog, index) => {
                  const isLatest = index === 0;
                  const stageColors = {
                    'prospecting': 'bg-gray-100 text-gray-800 border-gray-300',
                    'qualification': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    'proposal': 'bg-blue-100 text-blue-800 border-blue-300',
                    'negotiation': 'bg-orange-100 text-orange-800 border-orange-300',
                    'closed-won': 'bg-green-100 text-green-800 border-green-300',
                    'closed-lost': 'bg-red-100 text-red-800 border-red-300'
                  };
                  
                  return (
                    <div key={stageLog.id} className={`border-l-4 pl-4 py-4 rounded-r-lg transition-all hover:shadow-sm ${
                      isLatest 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-blue-200 bg-slate-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header with badges */}
                          <div className="flex items-center space-x-2 mb-3">
                            <Badge variant={isLatest ? "default" : "secondary"} 
                                   className={isLatest ? "bg-green-600" : "bg-blue-100 text-blue-800"}>
                              {isLatest ? "Current Stage" : "Stage Change"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Change #{stageLog.id}
                            </span>
                            {isLatest && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Latest
                              </Badge>
                            )}
                          </div>
                          
                          {/* Stage transition */}
                          <div className="mb-4 p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col items-center">
                                <Badge className={`mb-1 ${stageColors[stageLog.fromStage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800'}`}>
                                  {stageLog.fromStage ? stageLog.fromStage.charAt(0).toUpperCase() + stageLog.fromStage.slice(1).replace('-', ' ') : 'Initial'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">From</span>
                              </div>
                              
                              <div className="flex-1 flex items-center justify-center">
                                <div className="h-px bg-gradient-to-r from-blue-200 to-green-200 flex-1"></div>
                                <TrendingUp className="h-4 w-4 mx-2 text-blue-600" />
                                <div className="h-px bg-gradient-to-r from-green-200 to-blue-200 flex-1"></div>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <Badge className={`mb-1 ${stageColors[stageLog.toStage as keyof typeof stageColors] || 'bg-blue-100 text-blue-800'}`}>
                                  {stageLog.toStage.charAt(0).toUpperCase() + stageLog.toStage.slice(1).replace('-', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">To</span>
                              </div>
                            </div>
                          </div>

                          {/* Reason section */}
                          {stageLog.reason ? (
                            <div className="mb-3 p-3 bg-white rounded-lg border-l-4 border-blue-200">
                              <div className="flex items-start space-x-2">
                                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                  <span className="text-blue-600 text-xs font-bold">?</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-1">Change Reason:</p>
                                  <p className="text-sm text-gray-700 leading-relaxed italic">
                                    "{stageLog.reason}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-xs text-yellow-700">No reason provided for this stage change</p>
                            </div>
                          )}

                          {/* Attribution and timing */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>
                                Changed by: <span className="font-medium text-gray-900">
                                  {stageLog.user ? `${stageLog.user.firstName} ${stageLog.user.lastName}` : 'Unknown user'}
                                </span>
                                {stageLog.user?.role && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {stageLog.user.role.replace('_', ' ')}
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Date and time column */}
                        <div className="text-right ml-6 flex flex-col items-end">
                          <div className="text-sm font-semibold text-gray-900">
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
                          <div className="text-xs text-muted-foreground mt-1">
                            {stageLog.createdAt && !isNaN(new Date(stageLog.createdAt).getTime()) 
                              ? `${Math.ceil((Date.now() - new Date(stageLog.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                              : ''
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No stage changes recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Stage transitions will appear here as the opportunity progresses through the sales pipeline
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Information (if originated from lead) - Hidden for now as lead is not in current schema */}
    </div>
  );
}