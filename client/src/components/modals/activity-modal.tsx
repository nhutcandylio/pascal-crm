import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertActivitySchema, type InsertActivity, type Account, type Opportunity } from "@shared/schema";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [formData, setFormData] = useState<InsertActivity>({
    accountId: null,
    opportunityId: null,
    type: "note",
    subject: "",
    description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: isOpen,
  });

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    enabled: isOpen,
  });

  const createActivity = useMutation({
    mutationFn: async (data: InsertActivity) => {
      const response = await apiRequest("POST", "/api/activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Activity logged successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = insertActivitySchema.parse(formData);
      createActivity.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      accountId: null,
      opportunityId: null,
      type: "note",
      subject: "",
      description: "",
    });
    onClose();
  };

  const handleInputChange = (field: keyof InsertActivity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log New Activity</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Activity Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <input
              id="subject"
              type="text"
              placeholder="Enter activity subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter activity description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Account (Optional)</Label>
            <Select 
              value={formData.accountId?.toString() || ""} 
              onValueChange={(value) => handleInputChange("accountId", value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No account</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opportunityId">Opportunity (Optional)</Label>
            <Select 
              value={formData.opportunityId?.toString() || ""} 
              onValueChange={(value) => handleInputChange("opportunityId", value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select opportunity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No opportunity</SelectItem>
                {opportunities?.map((opportunity) => (
                  <SelectItem key={opportunity.id} value={opportunity.id.toString()}>
                    {opportunity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createActivity.isPending}
            >
              {createActivity.isPending ? "Logging..." : "Log Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
