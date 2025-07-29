import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Building, Mail, Phone, Calendar, Tag, Edit2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import LeadDetailTab from "./lead-detail-tab";
import type { Lead } from "@shared/schema";

interface LeadDetailLayoutProps {
  leadId: number;
  onBack: () => void;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'qualified':
      return 'bg-green-100 text-green-800';
    case 'converted':
      return 'bg-purple-100 text-purple-800';
    case 'lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'website':
      return 'bg-blue-100 text-blue-800';
    case 'referral':
      return 'bg-green-100 text-green-800';
    case 'cold-call':
      return 'bg-orange-100 text-orange-800';
    case 'social-media':
      return 'bg-purple-100 text-purple-800';
    case 'email-campaign':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getSourceLabel = (source: string | null) => {
  if (!source) return 'Unknown';
  return source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ');
};

export default function LeadDetailLayout({
  leadId,
  onBack,
  onEdit,
  onConvert
}: LeadDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['/api/leads', leadId],
    enabled: !!leadId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{lead.firstName} {lead.lastName}</h1>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
                {lead.source && (
                  <Badge variant="outline" className={getSourceColor(lead.source)}>
                    {getSourceLabel(lead.source)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onEdit(lead)}
            variant="outline"
            size="sm"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {lead.status !== 'converted' && (
            <Button
              onClick={() => onConvert(lead)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Convert
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <LeadDetailTab lead={lead} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Activity Tracking</h3>
                  <p className="text-muted-foreground">
                    Activity tracking for leads is coming soon. Convert to opportunity to track activities.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Notes & Comments</h3>
                  <p className="text-muted-foreground">
                    Notes functionality is coming soon. Convert to opportunity for full CRM features.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}