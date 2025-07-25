import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building, User, Users, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { OpportunityWithRelations } from "@shared/schema";

interface OpportunityRelatedTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityRelatedTab({ opportunity }: OpportunityRelatedTabProps) {
  return (
    <div className="space-y-6">
      {/* Related Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Related Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Account</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <User className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Contact</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{opportunity.activities?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Activities</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{opportunity.stageLogs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Stage Changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.account ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-base font-semibold">{opportunity.account.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-base">{opportunity.account.industry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <p className="text-base">{opportunity.account.website || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{opportunity.account.phone || 'Not provided'}</p>
                </div>
              </div>
              {opportunity.account.address && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base">{opportunity.account.address}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No account information available</p>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Primary Contact</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.contact ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base font-semibold">
                    {opportunity.contact.firstName} {opportunity.contact.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-base">{opportunity.contact.title || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{opportunity.contact.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{opportunity.contact.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No contact information available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities Summary */}
      {opportunity.activities && opportunity.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunity.activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{activity.type}</Badge>
                      <p className="font-medium">{activity.subject}</p>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {activity.createdAt && !isNaN(new Date(activity.createdAt).getTime()) 
                      ? format(new Date(activity.createdAt), 'MMM dd') 
                      : 'No date'
                    }
                  </div>
                </div>
              ))}
              {opportunity.activities.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{opportunity.activities.length - 3} more activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Information (if originated from lead) - Hidden for now as lead is not in current schema */}
    </div>
  );
}