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
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-800">
            <Package className="h-5 w-5 text-primary" />
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

      {/* Stage Changes History - Moved up for better visibility */}
      <Card className="glass-effect border-white/20 border-2 border-blue-400 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
          <CardTitle className="flex items-center space-x-2 text-slate-800">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Stage Changes History ({opportunity.stageLogs?.length || 0} changes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(opportunity.stageLogs && opportunity.stageLogs.length > 0) ? (
            <div className="space-y-4">
              {opportunity.stageLogs
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((stageLog) => {
                  const stageColors = {
                    'prospecting': 'bg-blue-100 text-blue-800 border-blue-200',
                    'qualification': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    'proposal': 'bg-purple-100 text-purple-800 border-purple-200',
                    'negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
                    'closed-won': 'bg-green-100 text-green-800 border-green-200',
                    'closed-lost': 'bg-red-100 text-red-800 border-red-200'
                  };
                  
                  return (
                    <div key={stageLog.id} className="p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-200">
                      {/* From → To */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-slate-600">From:</span>
                          <Badge className={`${stageColors[stageLog.fromStage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800 border-gray-200'} px-3 py-1 rounded-lg border`}>
                            {stageLog.fromStage ? stageLog.fromStage.charAt(0).toUpperCase() + stageLog.fromStage.slice(1).replace('-', ' ') : 'Initial'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="h-px w-8 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                          <TrendingUp className="h-5 w-5 text-primary mx-2" />
                          <div className="h-px w-8 bg-gradient-to-r from-purple-500 to-blue-400"></div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-slate-600">To:</span>
                          <Badge className={`${stageColors[stageLog.toStage as keyof typeof stageColors] || 'bg-blue-100 text-blue-800 border-blue-200'} px-3 py-1 rounded-lg border`}>
                            {stageLog.toStage.charAt(0).toUpperCase() + stageLog.toStage.slice(1).replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-slate-600">Reason: </span>
                        <span className="text-sm text-slate-700 italic">
                          {stageLog.reason ? `"${stageLog.reason}"` : 'No reason provided'}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-slate-500 font-medium">
                        {stageLog.createdAt && !isNaN(new Date(stageLog.createdAt).getTime()) 
                          ? format(new Date(stageLog.createdAt), 'MMM dd, yyyy h:mm a') 
                          : 'No date'
                        }
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">No stage changes recorded yet</p>
              <p className="text-sm text-slate-400 mt-1">Stage changes will appear here as the opportunity progresses</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-800">
            <Building className="h-5 w-5 text-primary" />
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
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              <Users className="h-5 w-5 text-primary" />
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
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              <Calendar className="h-5 w-5 text-primary" />
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



      {/* Lead Information (if originated from lead) - Hidden for now as lead is not in current schema */}
    </div>
  );
}