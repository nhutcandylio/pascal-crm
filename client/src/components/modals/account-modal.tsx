import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ContactModal from "./contact-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, UserPlus } from "lucide-react";
import { insertAccountSchema, type InsertAccount, type Account, type Contact } from "@shared/schema";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: (account: any) => void;
  account?: Account | null;
}

export default function AccountModal({ open, onOpenChange, onAccountCreated, account }: AccountModalProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Get contacts for current account and unassigned contacts
  const accountContacts = account ? contacts.filter(contact => contact.accountId === account.id) : [];
  const unassignedContacts = contacts.filter(contact => !contact.accountId);

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      companyName: "",
      industry: null,
      website: null,
      phone: null,
      address: null,
    },
  });

  // Reset form when modal opens with account data
  useEffect(() => {
    if (open) {
      if (account) {
        form.reset({
          companyName: account.companyName,
          industry: account.industry,
          website: account.website,
          phone: account.phone,
          address: account.address,
        });
      } else {
        form.reset({
          companyName: "",
          industry: null,
          website: null,
          phone: null,
          address: null,
        });
      }
    }
  }, [open, account, form]);

  const createAccountMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      if (account) {
        // Update existing account
        const response = await apiRequest("PATCH", `/api/accounts/${account.id}`, data);
        return response.json();
      } else {
        // Create new account
        const response = await apiRequest("POST", "/api/accounts", data);
        return response.json();
      }
    },
    onSuccess: (updatedAccount) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Success",
        description: account ? "Account updated successfully." : "Account created successfully.",
      });
      form.reset();
      if (onAccountCreated) {
        onAccountCreated(updatedAccount);
      } else {
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (account ? "Failed to update account." : "Failed to create account."),
        variant: "destructive",
      });
    },
  });

  const removeContactMutation = useMutation({
    mutationFn: async ({ contactId }: { contactId: number }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${contactId}`, { accountId: null });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact removed successfully.",
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
      const response = await apiRequest("PATCH", `/api/contacts/${contactId}`, { accountId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact assigned successfully.",
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

  const handleRemoveContact = (contactId: number) => {
    removeContactMutation.mutate({ contactId });
  };

  const handleAssignContact = (contactId: number) => {
    if (account) {
      assignContactMutation.mutate({ contactId, accountId: account.id });
    }
  };

  const handleAddNewContact = () => {
    setIsContactModalOpen(true);
  };

  const handleSubmit = (data: InsertAccount) => {
    createAccountMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Create New Account"}</DialogTitle>
          <DialogDescription>
            {account ? "Update the company account information." : "Add a new company account to your CRM system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Technology, Finance" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://company.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Company address"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Info Section - Only show when editing existing account */}
            {account && (
              <div className="space-y-3 pt-4 border-t">
                <FormLabel>Contact Info</FormLabel>
                
                {/* Existing Contacts */}
                {accountContacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">Current Contacts:</div>
                    <div className="flex flex-wrap gap-2">
                      {accountContacts.map(contact => (
                        <Badge key={contact.id} variant="outline" className="text-xs group relative">
                          {contact.firstName} {contact.lastName}
                          <button
                            onClick={() => handleRemoveContact(contact.id)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-red-500 hover:text-red-700" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Contact Actions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Add Contact:</div>
                  <Select onValueChange={(value) => {
                    if (value === "create-new") {
                      handleAddNewContact();
                    } else {
                      handleAssignContact(parseInt(value));
                    }
                  }}>
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Select existing contact or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Create New Contact Option */}
                      <SelectItem value="create-new">
                        <div className="flex items-center">
                          <UserPlus className="h-3 w-3 mr-2" />
                          Create New Contact
                        </div>
                      </SelectItem>
                      
                      {/* Existing Contacts */}
                      {unassignedContacts.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-slate-500 border-t">
                            Existing Contacts:
                          </div>
                          {unassignedContacts.map(contact => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.firstName} {contact.lastName} - {contact.email}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {accountContacts.length === 0 && (
                  <div className="text-sm text-slate-500">No contacts assigned.</div>
                )}
              </div>
            )}

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
                disabled={createAccountMutation.isPending}
              >
                {createAccountMutation.isPending 
                  ? (account ? "Updating..." : "Creating...") 
                  : (account ? "Update Account" : "Create Account")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        preselectedAccountId={account?.id || null}
      />
    </Dialog>
  );
}