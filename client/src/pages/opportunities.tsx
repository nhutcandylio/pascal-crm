import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import OpportunityModal from "../components/modals/opportunity-modal";
import OpportunityDetailLayout from "../components/opportunity/opportunity-detail-layout";
import AccountModal from "../components/modals/account-modal";
import ContactModal from "../components/modals/contact-modal";
import DescriptionModal from "../components/modals/description-modal";
import { LeadDetailsModal } from "../components/modals/lead-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Handshake, DollarSign, Calendar, Building, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OpportunityWithRelations, Opportunity, Account } from "@shared/schema";

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'prospecting':
      return 'bg-blue-100 text-blue-800';
    case 'qualification':
      return 'bg-yellow-100 text-yellow-800';
    case 'proposal':
      return 'bg-orange-100 text-orange-800';
    case 'negotiation':
      return 'bg-purple-100 text-purple-800';
    case 'closed-won':
      return 'bg-green-100 text-green-800';
    case 'closed-lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export default function Opportunities() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [viewingOpportunityId, setViewingOpportunityId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountMode, setNewAccountMode] = useState(false);
  const [pendingOpportunityId, setPendingOpportunityId] = useState<number | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedOpportunityForDescription, setSelectedOpportunityForDescription] = useState<Opportunity | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLeadDetailsModalOpen, setIsLeadDetailsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedOpportunityForContact, setSelectedOpportunityForContact] = useState<OpportunityWithRelations | null>(null);
  
  const { toast } = useToast();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: opportunities = [], isLoading } = useQuery<OpportunityWithRelations[]>({
    queryKey: ['/api/opportunities/with-orders'],
  });

  // Fetch lead data for selected opportunity when creating contact
  const { data: leadForContact } = useQuery({
    queryKey: ['/api/leads', selectedOpportunityForContact?.leadId],
    enabled: !!selectedOpportunityForContact?.leadId,
  });

  const filteredOpportunities = opportunities.filter(opp =>
    opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opp.account?.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (opp.contact && `${opp.contact.firstName} ${opp.contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show detail view if viewing a specific opportunity
  if (viewingOpportunityId) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar title="Opportunity Details" />
        <div className="flex-1 overflow-hidden">
          <OpportunityDetailLayout
            opportunityId={viewingOpportunityId}
            onBack={() => setViewingOpportunityId(null)}
            onEdit={(opportunity) => {
              setEditingOpportunity(opportunity);
              setIsModalOpen(true);
            }}
            onCreateNew={() => {
              setViewingOpportunityId(null);
              setIsModalOpen(true);
            }}
          />
        </div>
        
        <OpportunityModal 
          open={isModalOpen} 
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingOpportunity(null);
            }
          }}
          opportunity={editingOpportunity}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Opportunities" />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-slate-900">All Opportunities</h2>
            {opportunities && (
              <Badge variant="outline">
                {opportunities.length} total
              </Badge>
            )}
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input 
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Handshake className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{opportunities.length}</p>
                  <p className="text-sm text-muted-foreground">Total Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    ${opportunities.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {opportunities.filter(opp => opp.stage === 'closed-won').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Won Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {Math.round(opportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) / Math.max(opportunities.length, 1))}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Probability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities Table */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredOpportunities || filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Handshake className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No opportunities found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery ? 'Try adjusting your search terms.' : 'Create your first opportunity to start tracking deals.'}
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Opportunity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Gross Profit</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.map((opportunity) => (
                  <TableRow 
                    key={opportunity.id} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setViewingOpportunityId(opportunity.id)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Handshake className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{opportunity.name}</div>
                          {opportunity.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {opportunity.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {opportunity.account ? (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium">{opportunity.account.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No account</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {opportunity.contact ? (
                        <div className="text-sm">
                          {opportunity.contact.firstName} {opportunity.contact.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No contact</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        ${opportunity.value ? parseFloat(opportunity.value).toLocaleString() : '0'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        ${(() => {
                          // Calculate actual gross profit from order items with subscription logic
                          let totalProposal = 0;
                          let totalCost = 0;
                          
                          if (opportunity.orders) {
                            opportunity.orders.forEach(order => {
                              if (order.items) {
                                order.items.forEach(item => {
                                  if (item.product?.type === 'subscription') {
                                    // For subscription: use calculated totals
                                    totalProposal += parseFloat(item.totalProposal || item.proposalValue || "0");
                                    totalCost += parseFloat(item.totalCost || item.costValue || "0");
                                  } else {
                                    // For non-subscription: use calculated totals or standard calculation
                                    totalProposal += parseFloat(item.totalProposal || "0") || (parseFloat(item.proposalValue || "0") * (item.quantity || 1));
                                    totalCost += parseFloat(item.totalCost || "0") || (parseFloat(item.costValue || "0") * (item.quantity || 1));
                                  }
                                });
                              }
                            });
                          }
                          
                          return (totalProposal - totalCost).toLocaleString();
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium text-slate-600">
                        {(() => {
                          // Calculate actual margin from order items with subscription logic
                          let totalProposal = 0;
                          let totalCost = 0;
                          
                          if (opportunity.orders) {
                            opportunity.orders.forEach(order => {
                              if (order.items) {
                                order.items.forEach(item => {
                                  if (item.product?.type === 'subscription') {
                                    // For subscription: use calculated totals
                                    totalProposal += parseFloat(item.totalProposal || item.proposalValue || "0");
                                    totalCost += parseFloat(item.totalCost || item.costValue || "0");
                                  } else {
                                    // For non-subscription: use calculated totals or standard calculation
                                    totalProposal += parseFloat(item.totalProposal || "0") || (parseFloat(item.proposalValue || "0") * (item.quantity || 1));
                                    totalCost += parseFloat(item.totalCost || "0") || (parseFloat(item.costValue || "0") * (item.quantity || 1));
                                  }
                                });
                              }
                            });
                          }
                          
                          const margin = totalProposal > 0 ? ((totalProposal - totalCost) / totalProposal * 100) : 0;
                          return margin.toFixed(1);
                        })()}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(opportunity.stage)}>
                        {opportunity.stage.charAt(0).toUpperCase() + opportunity.stage.slice(1).replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-12 bg-slate-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${opportunity.probability || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-600">{opportunity.probability || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {opportunity.closeDate ? 
                          new Date(opportunity.closeDate).toLocaleDateString() : 
                          'Not set'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingOpportunityId(opportunity.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Modals */}
      <OpportunityModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingOpportunity(null);
          }
        }}
        opportunity={editingOpportunity}
      />

      <AccountModal
        open={isAccountModalOpen}
        onOpenChange={(open) => {
          setIsAccountModalOpen(open);
          if (!open) {
            setNewAccountMode(false);
            setPendingOpportunityId(null);
          }
        }}
      />

      <ContactModal
        open={isContactModalOpen}
        onOpenChange={(open) => {
          setIsContactModalOpen(open);
          if (!open) {
            setSelectedOpportunityForContact(null);
          }
        }}
      />

      <DescriptionModal
        open={isDescriptionModalOpen}
        onOpenChange={(open) => {
          setIsDescriptionModalOpen(open);
          if (!open) {
            setSelectedOpportunityForDescription(null);
          }
        }}
      />

      <LeadDetailsModal
        open={isLeadDetailsModalOpen}
        onOpenChange={(open) => {
          setIsLeadDetailsModalOpen(open);
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
      />
    </div>
  );
}