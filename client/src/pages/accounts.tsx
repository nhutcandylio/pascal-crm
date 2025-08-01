import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import AccountModal from "../components/modals/account-modal";
import ContactModal from "../components/modals/contact-modal";
import AccountDetailLayout from "../components/account/account-detail-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditableField } from "@/components/ui/editable-field";
import { Plus, Building, Phone, Globe, MapPin, X, UserPlus } from "lucide-react";
import type { Account, Contact, AccountWithContacts } from "@shared/schema";

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccountId, setViewingAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Check for account ID in URL params on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      const accountId = parseInt(viewParam);
      if (!isNaN(accountId)) {
        setViewingAccountId(accountId);
        // Clean up the URL
        window.history.replaceState({}, '', '/accounts');
      }
    }
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<AccountWithContacts[]>({
    queryKey: ['/api/accounts/with-contacts'],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Get all contacts (since we now support many-to-many relationships)
  const allContacts = contacts;

  const removeContactMutation = useMutation({
    mutationFn: async ({ contactId, accountId }: { contactId: number; accountId: number }) => {
      const response = await apiRequest("DELETE", `/api/accounts/${accountId}/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/with-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact removed from account successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove contact.",
        variant: "destructive",
      });
    },
  });

  const assignContactMutation = useMutation({
    mutationFn: async ({ contactId, accountId }: { contactId: number; accountId: number }) => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/with-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success", 
        description: "Contact assigned to account successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign contact.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveContact = (contactId: number, accountId: number) => {
    removeContactMutation.mutate({ contactId, accountId });
  };

  const handleAssignContact = (contactId: number, accountId: number) => {
    assignContactMutation.mutate({ contactId, accountId });
  };

  const handleAddNewContact = (accountId: number) => {
    setSelectedAccountId(accountId);
    setIsContactModalOpen(true);
  };

  

  const filteredAccounts = accounts.filter(account =>
    account.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show detail view if viewing a specific account
  if (viewingAccountId) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar title="Account Details" />
        <div className="flex-1 overflow-hidden">
          <AccountDetailLayout
            accountId={viewingAccountId}
            onBack={() => setViewingAccountId(null)}
          />
        </div>
        
        <AccountModal 
          open={isModalOpen} 
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingAccount(null);
            }
          }}
        />
        
        <ContactModal 
          open={isContactModalOpen} 
          onOpenChange={setIsContactModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-600">Manage your company accounts and business relationships</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No accounts found matching your search." : "No accounts found. Create your first account to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow 
                      key={account.id} 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setViewingAccountId(account.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{account.companyName}</div>
                            {account.website && (
                              <div className="text-sm text-slate-500 flex items-center mt-1">
                                <Globe className="h-3 w-3 mr-1" />
                                {account.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.industry ? (
                          <Badge variant="secondary">{account.industry}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const accountContacts = account.contacts || [];
                          return (
                            <div className="space-y-1">
                              {accountContacts.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {accountContacts.map((contact) => (
                                    <Badge key={contact.id} variant="outline" className="text-xs">
                                      {contact.firstName} {contact.lastName}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">No contacts</span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {account.address ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                            {account.address}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <AccountModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingAccount(null);
          }
        }}
        account={editingAccount}
      />
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        preselectedAccountId={selectedAccountId}
      />
    </div>
  );
}