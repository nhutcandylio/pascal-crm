import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Building2, Globe, Phone, MapPin, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AccountWithContacts, InsertAccount } from "@shared/schema";

interface AccountDetailTabProps {
  account: AccountWithContacts;
}

export default function AccountDetailTab({ account }: AccountDetailTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<InsertAccount>>({
    companyName: account.companyName,
    industry: account.industry || "",
    website: account.website || "",
    phone: account.phone || "",
    address: account.address || "",
    ownerId: account.ownerId || null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAccount>) => {
      const response = await apiRequest("PATCH", `/api/accounts/${account.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", account.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Account updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editData.companyName?.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      companyName: account.companyName,
      industry: account.industry || "",
      website: account.website || "",
      phone: account.phone || "",
      address: account.address || "",
      ownerId: account.ownerId || null,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-green-600" />
            Company Information
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
            <div className="md:col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              {isEditing ? (
                <Input
                  id="companyName"
                  value={editData.companyName || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium">{account.companyName}</div>
              )}
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              {isEditing ? (
                <Input
                  id="industry"
                  value={editData.industry || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  {account.industry ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                      {account.industry}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  value={editData.website || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  {account.website ? (
                    <>
                      <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
                      <a 
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {account.website}
                      </a>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
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
                  {account.phone ? (
                    <>
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      {account.phone}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm font-medium flex items-center">
                  {account.address ? (
                    <>
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      {account.address}
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

      {/* Associated Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Associated Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account.contacts && account.contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {account.contacts.map((contact) => (
                <div key={contact.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Title: {contact.title}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-1">
                    Email: {contact.email}
                  </p>
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">
                      Phone: {contact.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No associated contacts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Account History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Created:</strong> {format(new Date(account.createdAt), 'PPp')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}