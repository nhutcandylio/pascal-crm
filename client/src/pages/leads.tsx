import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import LeadModal from "../components/modals/lead-modal";
import ConvertToOpportunityModal from "../components/modals/convert-to-opportunity-modal";
import LeadDetailLayout from "../components/lead/lead-detail-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserPlus, Phone, Mail, Building, ArrowRight } from "lucide-react";
import type { Lead } from "@shared/schema";



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

export default function Leads() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewingLeadId, setViewingLeadId] = useState<number | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const filteredLeads = leads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show detail view if viewing a specific lead
  if (viewingLeadId) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar title="Lead Details" />
        <div className="flex-1 overflow-hidden">
          <LeadDetailLayout
            leadId={viewingLeadId}
            onBack={() => setViewingLeadId(null)}
            onConvert={(lead) => {
              setSelectedLead(lead);
              setConvertModalOpen(true);
            }}
          />
        </div>
        
        <LeadModal 
          open={isModalOpen} 
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingLead(null);
            }
          }}
        />
        
        <ConvertToOpportunityModal
          lead={selectedLead}
          open={convertModalOpen}
          onOpenChange={setConvertModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600">Manage potential customers and prospects</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No leads found matching your search." : "No leads found. Create your first lead to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setViewingLeadId(lead.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                            {lead.title && (
                              <div className="text-sm text-slate-500">{lead.title}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.company ? (
                          <div className="flex items-center text-sm">
                            <Building className="h-3 w-3 mr-1 text-slate-400" />
                            {lead.company}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.source ? (
                          <Badge variant="outline" className={getSourceColor(lead.source)}>
                            {lead.source.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-slate-400" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-slate-400" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(lead.status)}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <LeadModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingLead(null);
          }
        }}
      />
      
      <ConvertToOpportunityModal
        lead={selectedLead}
        open={convertModalOpen}
        onOpenChange={setConvertModalOpen}
      />
    </div>
  );
}