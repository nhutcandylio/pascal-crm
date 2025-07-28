import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building, User, Globe, Phone, MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditableField } from "@/components/ui/editable-field";
import type { AccountWithContacts } from "@shared/schema";

interface AccountDetailPageProps {
  accountId: number;
}

const industryOptions = [
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Finance" },
  { value: "Education", label: "Education" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Other", label: "Other" },
];

export default function AccountDetailPage({ accountId }: AccountDetailPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: account, isLoading } = useQuery<AccountWithContacts>({
    queryKey: ['/api/accounts', accountId, 'with-contacts'],
  });

  const handleFieldUpdate = async (field: string, value: string) => {
    const response = await apiRequest("PATCH", `/api/accounts/${accountId}`, { [field]: value });
    if (!response.ok) {
      throw new Error('Failed to update account');
    }
    queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "with-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
  };

  if (isLoading) {
    return <div className="p-6">Loading account...</div>;
  }

  if (!account) {
    return <div className="p-6">Account not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{account.companyName}</h1>
          <p className="text-slate-600">Account Details</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {account.industry || "No Industry"}
        </Badge>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Company Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditableField
                label="Company Name"
                value={account.companyName}
                onSave={(value) => handleFieldUpdate('companyName', value)}
                placeholder="Enter company name"
              />

              <EditableField
                label="Industry"
                value={account.industry}
                onSave={(value) => handleFieldUpdate('industry', value)}
                placeholder="Select industry"
                type="select"
                options={industryOptions}
              />

              <EditableField
                label="Website"
                value={account.website}
                onSave={(value) => handleFieldUpdate('website', value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            <div className="space-y-4">
              <EditableField
                label="Phone"
                value={account.phone}
                onSave={(value) => handleFieldUpdate('phone', value)}
                placeholder="Enter phone number"
                type="tel"
              />

              <EditableField
                label="Address"
                value={account.address}
                onSave={(value) => handleFieldUpdate('address', value)}
                placeholder="Enter company address"
                type="textarea"
              />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-base font-medium">
                  {format(new Date(account.createdAt), 'MMM dd, yyyy, h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Associated Contacts</span>
            <Badge variant="secondary">{account.contacts?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account.contacts && account.contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {account.contacts.map((contact) => (
                <div key={contact.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                      {contact.email}
                    </div>
                    {contact.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts associated with this account yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}