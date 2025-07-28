import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Building, Phone, Mail, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditableField } from "@/components/ui/editable-field";
import type { ContactWithAccounts } from "@shared/schema";

interface ContactDetailPageProps {
  contactId: number;
}

export default function ContactDetailPage({ contactId }: ContactDetailPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery<ContactWithAccounts>({
    queryKey: ['/api/contacts', contactId],
  });

  const handleFieldUpdate = async (field: string, value: string) => {
    const response = await apiRequest("PATCH", `/api/contacts/${contactId}`, { [field]: value });
    if (!response.ok) {
      throw new Error('Failed to update contact');
    }
    queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId] });
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  };

  if (isLoading) {
    return <div className="p-6">Loading contact...</div>;
  }

  if (!contact) {
    return <div className="p-6">Contact not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-slate-600">Contact Details</p>
        </div>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditableField
                label="First Name"
                value={contact.firstName}
                onSave={(value) => handleFieldUpdate('firstName', value)}
                placeholder="Enter first name"
              />

              <EditableField
                label="Last Name"
                value={contact.lastName}
                onSave={(value) => handleFieldUpdate('lastName', value)}
                placeholder="Enter last name"
              />

              <EditableField
                label="Email"
                value={contact.email}
                onSave={(value) => handleFieldUpdate('email', value)}
                placeholder="Enter email address"
                type="email"
              />
            </div>

            <div className="space-y-4">
              <EditableField
                label="Phone"
                value={contact.phone}
                onSave={(value) => handleFieldUpdate('phone', value)}
                placeholder="Enter phone number"
                type="tel"
              />

              <EditableField
                label="Title"
                value={contact.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                placeholder="Enter job title"
              />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-base font-medium">
                  {format(new Date(contact.createdAt), 'MMM dd, yyyy, h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Associated Accounts</span>
            <Badge variant="secondary">{contact.accounts?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.accounts && contact.accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.accounts.map((account) => (
                <div key={account.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{account.companyName}</p>
                      {account.industry && (
                        <p className="text-sm text-muted-foreground">{account.industry}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {account.website && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        {account.website.replace('https://', '')}
                      </div>
                    )}
                    {account.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                        {account.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>This contact is not associated with any accounts yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}