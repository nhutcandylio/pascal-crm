import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, User, Mail, Phone, Building2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { ContactWithAccounts, InsertContact } from "@shared/schema";

interface ContactDetailTabProps {
  contact: ContactWithAccounts;
}

export default function ContactDetailTab({ contact }: ContactDetailTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<InsertContact>>({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone || "",
    title: contact.title || "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertContact>) => {
      const response = await apiRequest("PATCH", `/api/contacts/${contact.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contact.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Contact updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editData.firstName?.trim() || !editData.lastName?.trim() || !editData.email?.trim()) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and email are required.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || "",
      title: contact.title || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Contact Information
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={editData.firstName || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium">{contact.firstName}</div>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={editData.lastName || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium">{contact.lastName}</div>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                  {contact.email}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData.phone || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  {contact.phone ? (
                    <>
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      {contact.phone}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="title">Job Title</Label>
              {isEditing ? (
                <Input
                  id="title"
                  value={editData.title || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  {contact.title ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                      {contact.title}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Associated Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-green-600" />
            Associated Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.accounts && contact.accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.accounts.map((account) => (
                <div key={account.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{account.companyName}</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Active
                    </Badge>
                  </div>
                  {account.industry && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Industry: {account.industry}
                    </p>
                  )}
                  {account.website && (
                    <p className="text-sm text-muted-foreground">
                      Website: {account.website}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No associated accounts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Contact History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Created:</strong> {format(new Date(contact.createdAt), 'PPp')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}