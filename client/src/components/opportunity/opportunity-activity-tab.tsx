import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Activity, Plus, MessageSquare, Phone, Mail, Calendar, User, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { insertActivitySchema, type OpportunityWithRelations, type InsertActivity } from "@shared/schema";

interface OpportunityActivityTabProps {
  opportunity: OpportunityWithRelations;
}

const activityTypeIcons = {
  'call': Phone,
  'email': Mail,
  'meeting': Calendar,
  'note': FileText,
  'task': Clock,
  'other': MessageSquare,
};

const activityTypeColors = {
  'call': 'bg-blue-100 text-blue-800',
  'email': 'bg-green-100 text-green-800',
  'meeting': 'bg-purple-100 text-purple-800',
  'note': 'bg-yellow-100 text-yellow-800',
  'task': 'bg-orange-100 text-orange-800',
  'other': 'bg-gray-100 text-gray-800',
};

export default function OpportunityActivityTab({ opportunity }: OpportunityActivityTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newActivityOpen, setNewActivityOpen] = useState(false);

  const activityForm = useForm({
    resolver: zodResolver(insertActivitySchema),
    defaultValues: {
      type: "note",
      description: "",
      opportunityId: opportunity.id,
      accountId: opportunity.accountId,
      contactId: opportunity.contactId,
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: InsertActivity) => {
      const response = await apiRequest("POST", "/api/activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Activity logged successfully.",
      });
      activityForm.reset();
      setNewActivityOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity.",
        variant: "destructive",
      });
    },
  });

  const handleCreateActivity = (data: any) => {
    createActivityMutation.mutate({
      ...data,
      opportunityId: opportunity.id,
      accountId: opportunity.accountId,
      contactId: opportunity.contactId,
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      {/* Activity Feed Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Timeline ({opportunity.activities?.filter(activity => activity.type !== 'stage_change').length || 0})</span>
            </CardTitle>
            <Dialog open={newActivityOpen} onOpenChange={setNewActivityOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Activity</DialogTitle>
                  <DialogDescription>
                    Record a new activity for this opportunity.
                  </DialogDescription>
                </DialogHeader>
                <Form {...activityForm}>
                  <form onSubmit={activityForm.handleSubmit(handleCreateActivity)} className="space-y-4">
                    <FormField
                      control={activityForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select activity type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
                              <SelectItem value="task">Task</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={activityForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the activity..."
                              className="min-h-[100px]"
                              {...field} 
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
                        onClick={() => setNewActivityOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createActivityMutation.isPending}
                      >
                        {createActivityMutation.isPending ? "Logging..." : "Log Activity"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {opportunity.activities && opportunity.activities.length > 0 ? (
          opportunity.activities
            .filter(activity => activity.type !== 'stage_change')
            .map((activity, index) => {
            const IconComponent = activityTypeIcons[activity.type as keyof typeof activityTypeIcons] || MessageSquare;
            const filteredActivities = opportunity.activities!.filter(activity => activity.type !== 'stage_change');
            const isLast = index === filteredActivities.length - 1;

            return (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
                )}

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Activity Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={activityTypeColors[activity.type as keyof typeof activityTypeColors]}>
                              {activity.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(activity.createdAt), 'MMM dd, yyyy • h:mm a')}
                            </span>
                          </div>
                        </div>

                        {/* Activity Description */}
                        <div className="prose prose-sm max-w-none">
                          <p className="text-foreground whitespace-pre-wrap">
                            {activity.description || 'No description provided'}
                          </p>
                        </div>

                        {/* Activity Metadata */}
                        <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                          {/* Created By */}
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {activity.createdBy ? 
                                  getInitials(activity.createdBy.firstName, activity.createdBy.lastName) : 
                                  'S'
                                }
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {activity.createdBy ? 
                                `${activity.createdBy.firstName} ${activity.createdBy.lastName}` : 
                                'System'
                              }
                            </span>
                          </div>

                          {/* Related Records */}
                          {activity.account && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{activity.account.companyName}</span>
                            </div>
                          )}

                          {activity.contact && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{activity.contact.firstName} {activity.contact.lastName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Activities Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start logging activities to track interactions and progress on this opportunity.
              </p>
              <Button onClick={() => setNewActivityOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log First Activity
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Summary */}
      {opportunity.activities && opportunity.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(activityTypeIcons).map(([type, IconComponent]) => {
                const count = opportunity.activities?.filter(a => a.type === type).length || 0;
                return (
                  <div key={type} className="text-center p-4 border rounded-lg">
                    <IconComponent className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type}s</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}