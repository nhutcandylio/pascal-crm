import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { User, Building, Mail, Phone, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import type { Lead } from "@shared/schema";

interface LeadDetailsModalProps {
  leadId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsModal({ leadId, open, onOpenChange }: LeadDetailsModalProps) {
  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['/api/leads', leadId],
    enabled: open && !!leadId,
  });

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

  const getSourceLabel = (source: string | null) => {
    if (!source) return 'Unknown';
    return source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ');
  };

  if (!open || !leadId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lead Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading lead details...</div>
        ) : lead ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{lead.email}</span>
                    </div>
                    
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-sm">{lead.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {lead.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{lead.company}</span>
                      </div>
                    )}
                    
                    {lead.title && (
                      <div className="text-sm text-slate-600">
                        {lead.title}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status and Source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead Status & Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">Status</div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">Source</div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-400" />
                      <Badge variant="outline">
                        {getSourceLabel(lead.source)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>Created on {format(new Date(lead.createdAt), 'PPP')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">Lead not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}