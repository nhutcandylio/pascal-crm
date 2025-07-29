import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import ContactModal from "../components/modals/contact-modal";
import ContactDetailLayout from "../components/contact/contact-detail-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditableField } from "@/components/ui/editable-field";
import { apiRequest } from "@/lib/queryClient";
import { Plus, User, Phone, Mail, Building } from "lucide-react";
import type { ContactWithAccounts } from "@shared/schema";

export default function Contacts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingContactId, setViewingContactId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<ContactWithAccounts[]>({
    queryKey: ['/api/contacts'],
  });

  

  const filteredContacts = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.accounts?.some(account => account.companyName.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Show detail view if viewing a specific contact
  if (viewingContactId) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar title="Contact Details" />
        <div className="flex-1 overflow-hidden">
          <ContactDetailLayout
            contactId={viewingContactId}
            onBack={() => setViewingContactId(null)}
          />
        </div>
        
        <ContactModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-600">Manage your contacts and relationships</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Contact
        </Button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No contacts found matching your search." : "No contacts found. Create your first contact to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex space-x-2">
                              <EditableField
                                label=""
                                value={contact.firstName}
                                onSave={async (value) => {
                                  const response = await apiRequest("PATCH", `/api/contacts/${contact.id}`, { firstName: value });
                                  if (!response.ok) throw new Error('Failed to update');
                                  queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
                                }}
                                placeholder="First name"
                                className="font-medium"
                              />
                              <EditableField
                                label=""
                                value={contact.lastName}
                                onSave={async (value) => {
                                  const response = await apiRequest("PATCH", `/api/contacts/${contact.id}`, { lastName: value });
                                  if (!response.ok) throw new Error('Failed to update');
                                  queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
                                }}
                                placeholder="Last name"
                                className="font-medium"
                              />
                            </div>
                            {contact.title && (
                              <div className="text-sm text-slate-500 mt-1">
                                <EditableField
                                  label=""
                                  value={contact.title}
                                  onSave={async (value) => {
                                    const response = await apiRequest("PATCH", `/api/contacts/${contact.id}`, { title: value });
                                    if (!response.ok) throw new Error('Failed to update');
                                    queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
                                  }}
                                  placeholder="Job title"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {contact.accounts && contact.accounts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.accounts.map(account => (
                              <Badge key={account.id} variant="outline" className="text-xs">
                                {account.companyName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-slate-400" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-slate-400" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ContactModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />

      
    </div>
  );
}