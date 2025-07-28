import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building, User, Users, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditableField } from "@/components/ui/editable-field";
import type { OpportunityWithRelations } from "@shared/schema";

interface OpportunityRelatedTabProps {
  opportunity: OpportunityWithRelations;
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
              <p className="text-2xl font-bold">{opportunity.activities?.length || 0}</p>
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

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Primary Contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.contact ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField
                  label="First Name"
                  value={opportunity.contact.firstName}
                  onSave={(value) => handleContactFieldUpdate('firstName', value)}
                  placeholder="Enter first name"
                />
                <EditableField
                  label="Last Name"
                  value={opportunity.contact.lastName}
                  onSave={(value) => handleContactFieldUpdate('lastName', value)}
                  placeholder="Enter last name"
                />
                <EditableField
                  label="Email"
                  value={opportunity.contact.email}
                  onSave={(value) => handleContactFieldUpdate('email', value)}
                  placeholder="Enter email address"
                />
                <EditableField
                  label="Phone"
                  value={opportunity.contact.phone}
                  onSave={(value) => handleContactFieldUpdate('phone', value)}
                  placeholder="Enter phone number"
                />
                <EditableField
                  label="Title"
                  value={opportunity.contact.title}
                  onSave={(value) => handleContactFieldUpdate('title', value)}
                  placeholder="Enter job title"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No contact information available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities Summary */}
      {opportunity.activities && opportunity.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunity.activities.slice(0, 3).map((activity) => (
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
              {opportunity.activities.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{opportunity.activities.length - 3} more activities
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