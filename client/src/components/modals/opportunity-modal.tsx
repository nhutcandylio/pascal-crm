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
import { insertOpportunitySchema, type InsertOpportunity, type Account, type Contact, type Opportunity, type User } from "@shared/schema";
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
  
  // Check if opportunity is closed (won or lost) - if so, make it read-only
  const isClosedOpportunity = opportunity && (opportunity.stage === 'Closed Won' || opportunity.stage === 'Closed Lost');

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm({
    defaultValues: {
      name: "",
      stage: "prospecting",
      probability: 50,
      closeDate: "",
      accountId: null,
      contactId: null,
      ownerId: null,
      description: "",
    },
  });

  // Reset form values when opportunity changes
  useEffect(() => {
    if (opportunity) {
      form.reset({
        name: opportunity.name || "",
        stage: opportunity.stage || "prospecting",
        probability: opportunity.probability || 50,
        closeDate: opportunity.closeDate ? new Date(opportunity.closeDate).toISOString().split('T')[0] : "",
        accountId: opportunity.accountId || null,
        contactId: opportunity.contactId || null,
        ownerId: opportunity.ownerId || null,
        description: opportunity.description || "",
      });
    } else {
      form.reset({
        name: "",
        stage: "prospecting",
        probability: 50,
        closeDate: "",
        accountId: null,
        contactId: null,
        ownerId: null,
        description: "",
      });
    }
  }, [opportunity, form]);

  const selectedAccountId = form.watch("accountId");
  const filteredContacts = selectedAccountId 
    ? contacts.filter(contact => contact.accountId === selectedAccountId)
    : contacts;

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
    // Prevent editing if opportunity is closed
    if (isClosedOpportunity) {
      toast({
        title: "Cannot Edit",
        description: "Closed opportunities cannot be edited.",
        variant: "destructive",
      });
      return;
    }

    const opportunityData: InsertOpportunity = {
      ...data,
      closeDate: data.closeDate ? data.closeDate : null,
      ownerId: data.ownerId === "no-owner" ? null : data.ownerId,
      value: "0.00", // Default value - will be updated from orders
    };
    saveOpportunityMutation.mutate(opportunityData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
            {isClosedOpportunity && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full ml-2">
                Read-Only
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isClosedOpportunity 
              ? 'This opportunity is closed and cannot be edited.' 
              : opportunity 
                ? 'Update opportunity details.' 
                : 'Add a new sales opportunity to your CRM system.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Show read-only warning for closed opportunities */}
        {isClosedOpportunity && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Read-Only Mode:</span> This opportunity is closed and cannot be edited.
                </p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Software License Renewal" {...field} disabled={isClosedOpportunity} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter opportunity description" {...field} disabled={isClosedOpportunity} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isClosedOpportunity}>
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
                        disabled={isClosedOpportunity}
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
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || '')}
                      disabled={isClosedOpportunity}
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
                    disabled={isClosedOpportunity}
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
                    disabled={isClosedOpportunity}
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

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                    value={field.value?.toString() || ""}
                    disabled={isClosedOpportunity}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-owner">No owner</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.role})
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
                disabled={saveOpportunityMutation.isPending || isClosedOpportunity}
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