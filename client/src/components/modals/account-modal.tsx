import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAccountSchema, type InsertAccount, type Account } from "@shared/schema";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: (account: any) => void;
  account?: Account | null;
}

export default function AccountModal({ open, onOpenChange, onAccountCreated, account }: AccountModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    </Dialog>
  );
}