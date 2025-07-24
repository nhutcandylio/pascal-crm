import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Opportunity } from "@shared/schema";

interface DescriptionModalProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DescriptionModal({ opportunity, open, onOpenChange }: DescriptionModalProps) {
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set initial description when opportunity changes
  useEffect(() => {
    if (opportunity && open) {
      setDescription(opportunity.description || "");
    }
  }, [opportunity, open]);

  const updateDescriptionMutation = useMutation({
    mutationFn: async () => {
      if (!opportunity) return;
      
      const response = await apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, {
        description: description.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Description updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to update description:", error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDescriptionMutation.mutate();
  };

  const handleCancel = () => {
    setDescription(opportunity?.description || "");
    onOpenChange(false);
  };

  if (!opportunity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opportunity-name" className="text-sm font-medium">
              Opportunity: {opportunity.name}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter opportunity description..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateDescriptionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateDescriptionMutation.isPending}
            >
              {updateDescriptionMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}