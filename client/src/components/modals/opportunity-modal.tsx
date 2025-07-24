import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertOpportunitySchema, type InsertOpportunity, type Account, type Contact, type Opportunity } from "@shared/schema";
import { z } from "zod";

interface OpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
}

const stageOptions = [
  { value: "prospecting", label: "Prospecting" },
  { value: "qualification", label: "Qualification" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed-won", label: "Closed Won" },
  { value: "closed-lost", label: "Closed Lost" },
];

export default function OpportunityModal({ open, onOpenChange, opportunity }: OpportunityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      name: "",
      value: "",
      grossProfit: "",
      grossProfitMargin: 0,
      stage: "prospecting",
      probability: 50,
      closeDate: "",
      accountId: null,
      contactId: null,
    },
  });

  // Reset form values when opportunity changes
  useEffect(() => {
    if (opportunity) {
      form.reset({
        name: opportunity.name || "",
        value: opportunity.value?.toString() || "",
        grossProfit: opportunity.grossProfit?.toString() || "",
        grossProfitMargin: opportunity.grossProfitMargin || 0,
        stage: opportunity.stage || "prospecting",
        probability: opportunity.probability || 50,
        closeDate: opportunity.closeDate ? new Date(opportunity.closeDate).toISOString().split('T')[0] : "",
        accountId: opportunity.accountId || null,
        contactId: opportunity.contactId || null,
      });
    } else {
      form.reset({
        name: "",
        value: "",
        grossProfit: "",
        grossProfitMargin: 0,
        stage: "prospecting",
        probability: 50,
        closeDate: "",
        accountId: null,
        contactId: null,
      });
    }
  }, [opportunity, form]);

  const selectedAccountId = form.watch("accountId");
  const filteredContacts = selectedAccountId 
    ? contacts.filter(contact => contact.accountId === selectedAccountId)
    : contacts;

  // Auto-calculate gross profit margin
  const opportunityValue = form.watch("value");
  const grossProfit = form.watch("grossProfit");
  
  useEffect(() => {
    if (opportunityValue && grossProfit) {
      const value = parseFloat(opportunityValue);
      const profit = parseFloat(grossProfit);
      if (value > 0) {
        const margin = Math.round((profit / value) * 100);
        form.setValue("grossProfitMargin", margin);
      }
    }
  }, [opportunityValue, grossProfit, form]);

  const saveOpportunityMutation = useMutation({
    mutationFn: async (data: InsertOpportunity) => {
      if (opportunity) {
        const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/opportunities", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: opportunity ? "Opportunity updated successfully." : "Opportunity created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${opportunity ? 'update' : 'create'} opportunity.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    const opportunityData: InsertOpportunity = {
      ...data,
      closeDate: data.closeDate ? data.closeDate : null,
    };
    saveOpportunityMutation.mutate(opportunityData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}</DialogTitle>
          <DialogDescription>
            {opportunity ? 'Update opportunity details.' : 'Add a new sales opportunity to your CRM system.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Software License Renewal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity Value ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="63650.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grossProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Profit ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="41150.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grossProfitMargin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Profit Margin (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        placeholder="Auto-calculated" 
                        {...field} 
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="probability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Probability ({field.value}%)</FormLabel>
                  <FormControl>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value || 50]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Close Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value ? parseInt(value) : undefined);
                      // Reset contact when account changes
                      form.setValue("contactId", undefined);
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={saveOpportunityMutation.isPending}
              >
                {saveOpportunityMutation.isPending ? (opportunity ? "Updating..." : "Creating...") : (opportunity ? "Update Opportunity" : "Create Opportunity")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}