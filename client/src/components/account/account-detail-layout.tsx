import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import AccountDetailTab from "./account-detail-tab";
import NoteList from "@/components/notes/note-list";
import type { AccountWithContacts } from "@shared/schema";

interface AccountDetailLayoutProps {
  accountId: number;
  onBack: () => void;
}

export default function AccountDetailLayout({ accountId, onBack }: AccountDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: account, isLoading } = useQuery<AccountWithContacts>({
    queryKey: ["/api/accounts", accountId],
    queryFn: () => fetch(`/api/accounts/${accountId}`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Account not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
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
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {account.companyName}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                {account.industry && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Building2 className="h-3 w-3 mr-1" />
                    {account.industry}
                  </div>
                )}
                {account.website && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Globe className="h-3 w-3 mr-1" />
                    {account.website}
                  </div>
                )}
                {account.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {account.phone}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {account.contacts && account.contacts.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {account.contacts.length} Contact{account.contacts.length !== 1 ? 's' : ''}
                  </Badge>
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
              <AccountDetailTab account={account} />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <NoteList accountId={account.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}