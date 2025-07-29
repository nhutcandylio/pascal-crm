import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, User as UserIcon, DollarSign, Calendar, TrendingUp, Percent, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditableField, EditableCurrencyField, EditablePercentageField, EditableDateField } from "@/components/ui/editable-field";
import type { OpportunityWithRelations, Account, Contact, User } from "@shared/schema";

interface OpportunityDetailTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityDetailTab({ opportunity }: OpportunityDetailTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if opportunity is closed (won or lost) - if so, make it read-only
  const isClosedOpportunity = opportunity.stage === 'closed-won' || opportunity.stage === 'closed-lost';

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Load contacts relevant to the opportunity's account
  const { data: accountContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/accounts", opportunity.accountId, "contacts"],
    enabled: !!opportunity.accountId,
  });

  const value = parseFloat(opportunity.value) || 0;
  const grossProfit = parseFloat(opportunity.grossProfit || "0") || 0;
  const grossProfitMargin = opportunity.grossProfitMargin || 0;

  const handleFieldUpdate = async (field: string, value: string) => {
    // Prevent editing if opportunity is closed
    if (isClosedOpportunity) {
      toast({
        title: "Cannot Edit",
        description: "Closed opportunities cannot be edited.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert string values to appropriate types for numeric fields
      let processedValue: any = value;
      if (field === 'accountId' || field === 'contactId' || field === 'ownerId') {
        processedValue = value === '' || value === 'none' ? null : parseInt(value);
      } else if (field === 'probability') {
        processedValue = parseInt(value);
      }

      const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, { [field]: processedValue });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update field:', errorData);
        toast({
          title: "Update Failed",
          description: errorData.error || "Failed to update opportunity field",
          variant: "destructive",
        });
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      
      // If account was updated, automatically set the contact from that account
      if (field === 'accountId') {
        queryClient.invalidateQueries({ queryKey: ["/api/accounts", processedValue, "contacts"] });
        
        if (processedValue) {
          // Fetch contacts for the new account
          const accountContactsResponse = await fetch(`/api/accounts/${processedValue}/contacts`);
          const newAccountContacts = await accountContactsResponse.json();
          
          let newContactId = null;
          
          // If there are contacts for this account, select the first one
          if (newAccountContacts.length > 0) {
            newContactId = newAccountContacts[0].id;
          }
          
          // Update the contact field to match the account
          await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, { contactId: newContactId });
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
        } else {
          // If no account selected, clear the contact
          await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, { contactId: null });
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
        }
      }

      toast({
        title: "Field Updated",
        description: `Successfully updated ${field}`,
      });
    } catch (error) {
      console.error('Failed to update field:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update opportunity field",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Opportunity Information</span>
            {isClosedOpportunity && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full ml-2">
                Read-Only
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show read-only warning for closed opportunities */}
          {isClosedOpportunity && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Read-Only Mode:</span> This opportunity is closed and cannot be edited.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Opportunity Name</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.name}
                  </div>
                </div>
              ) : (
                <EditableField
                  label="Opportunity Name"
                  value={opportunity.name}
                  onSave={(value) => handleFieldUpdate('name', value)}
                  placeholder="Enter opportunity name"
                />
              )}

              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.account?.companyName || "No Account"}
                  </div>
                </div>
              ) : (
                <EditableField
                  label="Account"
                  value={opportunity.accountId?.toString() || "none"}
                  onSave={(value) => handleFieldUpdate('accountId', value)}
                  placeholder="Select account"
                  type="select"
                  options={[
                    { value: "none", label: "No Account" },
                    ...accounts.map(account => ({
                      value: account.id.toString(),
                      label: account.companyName
                    }))
                  ]}
                  displayValue={opportunity.account?.companyName || "No Account"}
                />
              )}

              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.contact 
                      ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                      : "No Contact"
                    }
                  </div>
                </div>
              ) : (
                <EditableField
                  label="Primary Contact"
                  value={opportunity.contactId?.toString() || "none"}
                  onSave={(value) => handleFieldUpdate('contactId', value)}
                  placeholder="Select contact"
                  type="select"
                  options={[
                    { value: "none", label: "No Contact" },
                    ...(opportunity.accountId ? accountContacts : contacts).map(contact => ({
                      value: contact.id.toString(),
                      label: `${contact.firstName} ${contact.lastName}`
                    }))
                  ]}
                  displayValue={opportunity.contact 
                    ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                    : "No Contact"
                  }
                />
              )}

              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Owner</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.owner 
                      ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}`
                      : "Unassigned"
                    }
                  </div>
                </div>
              ) : (
                <EditableField
                  label="Owner"
                  value={opportunity.ownerId?.toString() || "none"}
                  onSave={(value) => handleFieldUpdate('ownerId', value)}
                  placeholder="Select owner"
                  type="select"
                  options={[
                    { value: "none", label: "Unassigned" },
                    ...users.map(user => ({
                      value: user.id.toString(),
                      label: `${user.firstName} ${user.lastName}`
                    }))
                  ]}
                  displayValue={opportunity.owner 
                    ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}`
                    : "Unassigned"
                  }
                />
              )}
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
                  {isClosedOpportunity && (
                    <span className="ml-2 text-xs text-muted-foreground">(Stage changes disabled)</span>
                  )}
                </div>
              </div>

              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Probability</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.probability || 0}%
                  </div>
                </div>
              ) : (
                <EditablePercentageField
                  label="Probability"
                  value={opportunity.probability}
                  onSave={(value) => handleFieldUpdate('probability', value)}
                  placeholder="0"
                />
              )}

              {isClosedOpportunity ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Close Date</label>
                  <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                    {opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              ) : (
                <EditableDateField
                  label="Close Date"
                  value={opportunity.closeDate ? new Date(opportunity.closeDate).toISOString().split('T')[0] : ''}
                  onSave={(value) => handleFieldUpdate('closeDate', value)}
                  placeholder="Select close date"
                />
              )}

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

      {/* Account Contacts Section */}
      {opportunity.accountId && opportunity.account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Contacts from {opportunity.account.companyName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accountContacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountContacts.map((contact) => (
                  <div key={contact.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                    <div className="text-sm text-muted-foreground">{contact.email}</div>
                    {contact.phone && (
                      <div className="text-sm text-muted-foreground">{contact.phone}</div>
                    )}
                    {contact.title && (
                      <div className="text-sm text-muted-foreground">{contact.title}</div>
                    )}
                    {opportunity.contactId === contact.id && (
                      <Badge variant="secondary" className="mt-2">Primary Contact</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No contacts associated with this account yet.</p>
            )}
          </CardContent>
        </Card>
      )}

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
            {isClosedOpportunity ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Opportunity Value</label>
                <div className="mt-1 text-base font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                  ${parseFloat(opportunity.value || "0").toLocaleString()}
                </div>
              </div>
            ) : (
              <EditableCurrencyField
                label="Opportunity Value"
                value={opportunity.value}
                onSave={(value) => handleFieldUpdate('value', value)}
                placeholder="0.00"
              />
            )}

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