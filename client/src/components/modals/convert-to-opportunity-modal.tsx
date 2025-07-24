import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, Account, Contact } from "@shared/schema";

interface ConvertToOpportunityModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConvertToOpportunityModal({ 
  lead, 
  open, 
  onOpenChange 
}: ConvertToOpportunityModalProps) {
  const [opportunityName, setOpportunityName] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("prospecting");
  const [probability, setProbability] = useState("25");
  const [closeDate, setCloseDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [createNewAccount, setCreateNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get accounts and contacts for selection
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Filter contacts based on selected account
  const filteredContacts = selectedAccountId 
    ? contacts.filter(contact => contact.accountId?.toString() === selectedAccountId)
    : contacts;

  const convertMutation = useMutation({
    mutationFn: async () => {
      let accountId = selectedAccountId;
      let contactId = selectedContactId;

      // Create new account if needed
      if (createNewAccount && newAccountName.trim()) {
        const accountData = {
          companyName: newAccountName.trim(),
          industry: lead?.company ? "Technology" : "Other",
          website: "",
          phone: lead?.phone || "",
          email: lead?.email || "",
          address: ""
        };

        const accountResponse = await apiRequest('POST', '/api/accounts', accountData);
        const newAccount = await accountResponse.json();
        
        accountId = newAccount.id.toString();
      }

      // Create contact if lead info exists and no contact selected
      if (!contactId && lead) {
        const contactData = {
          accountId: accountId ? parseInt(accountId) : null,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || "",
          title: lead.title || "",
          department: ""
        };

        const contactResponse = await apiRequest('POST', '/api/contacts', contactData);
        const newContact = await contactResponse.json();
        
        contactId = newContact.id.toString();
      }

      // Create opportunity
      const opportunityData = {
        accountId: accountId ? parseInt(accountId) : null,
        contactId: contactId ? parseInt(contactId) : null,
        name: opportunityName.trim(),
        value: value,
        stage: stage,
        probability: parseInt(probability),
        closeDate: closeDate,
        description: description.trim()
      };

      const opportunityResponse = await apiRequest('POST', '/api/opportunities', opportunityData);
      const opportunity = await opportunityResponse.json();

      // Update lead status to converted
      if (lead) {
        await apiRequest('PATCH', `/api/leads/${lead.id}`, { status: 'converted' });
      }

      return opportunity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      
      toast({
        title: "Success",
        description: "Lead successfully converted to opportunity",
      });

      // Reset form
      setOpportunityName("");
      setValue("");
      setStage("prospecting");
      setProbability("25");
      setCloseDate("");
      setDescription("");
      setSelectedAccountId("");
      setSelectedContactId("");
      setCreateNewAccount(false);
      setNewAccountName("");
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to opportunity",
        variant: "destructive",
      });
    },
  });

  // Set default values when lead changes
  React.useEffect(() => {
    if (lead && open) {
      setOpportunityName(`${lead.company || 'Opportunity'} - ${lead.firstName} ${lead.lastName}`);
      setNewAccountName(lead.company || "");
      setCreateNewAccount(!lead.company || accounts.length === 0);
      
      // Set close date to 3 months from now
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      setCloseDate(futureDate.toISOString().split('T')[0]);
    }
  }, [lead, open, accounts.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunityName.trim()) {
      toast({
        title: "Error",
        description: "Opportunity name is required",
        variant: "destructive",
      });
      return;
    }
    
    convertMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Opportunity</DialogTitle>
        </DialogHeader>

        {lead && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium mb-2">Converting Lead:</h4>
            <p className="text-sm text-slate-600">
              {lead.firstName} {lead.lastName} - {lead.email}
              {lead.company && ` from ${lead.company}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="opportunityName">Opportunity Name *</Label>
            <Input
              id="opportunityName"
              value={opportunityName}
              onChange={(e) => setOpportunityName(e.target.value)}
              placeholder="Enter opportunity name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Select value={probability} onValueChange={setProbability}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="closeDate">Expected Close Date</Label>
              <Input
                id="closeDate"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <Label>Account</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="existing-account"
                  name="account-choice"
                  checked={!createNewAccount}
                  onChange={() => setCreateNewAccount(false)}
                />
                <label htmlFor="existing-account" className="text-sm">Use existing account</label>
              </div>
              
              {!createNewAccount && (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id?.toString() || ""}>
                        {account.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new-account"
                  name="account-choice"
                  checked={createNewAccount}
                  onChange={() => setCreateNewAccount(true)}
                />
                <label htmlFor="new-account" className="text-sm">Create new account</label>
              </div>
              
              {createNewAccount && (
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Enter company name"
                />
              )}
            </div>
          </div>

          {/* Contact Selection */}
          {!createNewAccount && selectedAccountId && (
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {filteredContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id?.toString() || ""}>
                      {contact.firstName} {contact.lastName} - {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter opportunity description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? "Converting..." : "Convert to Opportunity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}