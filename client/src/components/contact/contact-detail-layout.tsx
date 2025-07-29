import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Mail, Phone, Building2, MapPin } from "lucide-react";
import ContactDetailTab from "./contact-detail-tab";
import NoteList from "@/components/notes/note-list";
import type { ContactWithAccounts } from "@shared/schema";

interface ContactDetailLayoutProps {
  contactId: number;
  onBack: () => void;
}

export default function ContactDetailLayout({ contactId, onBack }: ContactDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: contact, isLoading } = useQuery<ContactWithAccounts>({
    queryKey: ["/api/contacts", contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Contact not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {contact.firstName} {contact.lastName}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                {contact.title && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Building2 className="h-3 w-3 mr-1" />
                    {contact.title}
                  </div>
                )}
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="h-3 w-3 mr-1" />
                  {contact.email}
                </div>
                {contact.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {contact.phone}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {contact.accounts && contact.accounts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contact.accounts.map((account) => (
                      <Badge key={account.id} variant="outline" className="bg-blue-50 text-blue-700">
                        <Building2 className="h-3 w-3 mr-1" />
                        {account.companyName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <ContactDetailTab contact={contact} />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <NoteList contactId={contact.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}