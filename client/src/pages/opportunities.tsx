import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Handshake, DollarSign, Calendar, Building, FileText, Edit2, Check, X, UserPlus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OpportunityWithRelations, Opportunity, InsertOpportunity, Account } from "@shared/schema";

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

const stageOptions = [
  { value: "prospecting", label: "Prospecting" },
  { value: "qualification", label: "Qualification" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed-won", label: "Closed Won" },
  { value: "closed-lost", label: "Closed Lost" },
];

export default function Opportunities() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [viewingOpportunityId, setViewingOpportunityId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
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
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: opportunities = [], isLoading } = useQuery<OpportunityWithRelations[]>({
    queryKey: ['/api/opportunities'],
  });

  // Fetch lead data for selected opportunity when creating contact
  const { data: leadForContact } = useQuery({
    queryKey: ['/api/leads', selectedOpportunityForContact?.leadId],
    enabled: !!selectedOpportunityForContact?.leadId,
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertOpportunity> }) => {
      const response = await apiRequest("PATCH", `/api/opportunities/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Opportunity updated successfully.",
      });
      setEditingField(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity.",
        variant: "destructive",
      });
      setEditingField(null);
    },
  });

  const handleFieldEdit = (fieldKey: string, opportunityId: number, currentValue: string) => {
    setEditingField(`${fieldKey}-${opportunityId}`);
    setEditingValue(currentValue);
  };

  const handleFieldSave = (opportunityId: number, field: string) => {
    let value: any = editingValue;
    
    // Convert value based on field type
    if (field === 'probability') {
      value = parseInt(editingValue);
      if (isNaN(value) || value < 0 || value > 100) {
        toast({
          title: "Error",
          description: "Probability must be between 0 and 100.",
          variant: "destructive",
        });
        return;
      }
    } else if (field === 'value' || field === 'grossProfit') {
      if (!editingValue || isNaN(parseFloat(editingValue))) {
        toast({
          title: "Error",
          description: "Value must be a valid number.",
          variant: "destructive",
        });
        return;
      }
    } else if (field === 'closeDate') {
      value = editingValue ? editingValue : null;
    } else if (field === 'accountId') {
      if (editingValue === 'none' || !editingValue) {
        value = null;
      } else {
        value = parseInt(editingValue);
        if (isNaN(value)) {
          toast({
            title: "Error",
            description: "Invalid account selection.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    const updateData: any = { [field]: value };
    
    // Auto-calculate gross profit margin if updating value or grossProfit
    if (field === 'value' || field === 'grossProfit') {
      const opportunity = opportunities.find(opp => opp.id === opportunityId);
      if (opportunity) {
        const newValue = field === 'value' ? parseFloat(editingValue) || 0 : parseFloat(opportunity.value) || 0;
        const newGrossProfit = field === 'grossProfit' ? parseFloat(editingValue) || 0 : parseFloat(opportunity.grossProfit || '0') || 0;
        
        if (newValue > 0) {
          updateData.grossProfitMargin = Math.round((newGrossProfit / newValue) * 100);
        } else {
          updateData.grossProfitMargin = 0;
        }
      }
    }

    updateOpportunityMutation.mutate({
      id: opportunityId,
      data: updateData
    });
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValue("");
  };

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
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
            <p className="text-slate-600">Manage your sales pipeline and deals</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="btn-gradient h-11 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div>
        <Card className="glass-effect border-white/20">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading opportunities...</div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No opportunities found matching your search." : "No opportunities found. Create your first opportunity to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Opportunity Value</TableHead>
                    <TableHead>Gross Profit</TableHead>
                    <TableHead>Gross Profit Margin</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Close Date</TableHead>
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
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Handshake className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{opportunity.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {opportunity.account ? (
                            <>
                              <Building className="h-3 w-3 mr-1 text-slate-400" />
                              {opportunity.account.companyName}
                            </>
                          ) : (
                            <span className="text-slate-400">No Account</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center text-sm">
                          {opportunity.leadId ? (
                            // If converted from lead, make it clickable to show lead details
                            <div 
                              className="cursor-pointer hover:bg-slate-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadId(opportunity.leadId);
                                setIsLeadDetailsModalOpen(true);
                              }}
                              title="Click to view lead details"
                            >
                              {opportunity.leadSource ? (
                                <Badge variant="secondary" className="text-xs hover:opacity-80">
                                  {opportunity.leadSource.charAt(0).toUpperCase() + opportunity.leadSource.slice(1).replace('-', ' ')}
                                </Badge>
                              ) : (
                                <span className="text-slate-500 text-xs underline">Lead converted</span>
                              )}
                            </div>
                          ) : (
                            // If created directly as opportunity
                            <span className="text-slate-500 text-xs">Opportunity created</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {editingField === `value-${opportunity.id}` ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-24 h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFieldSave(opportunity.id, 'value');
                                if (e.key === 'Escape') handleFieldCancel();
                              }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldSave(opportunity.id, 'value');
                            }}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldCancel();
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center text-sm font-medium cursor-pointer hover:bg-slate-50 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldEdit('value', opportunity.id, opportunity.value);
                            }}
                          >
                            ${opportunity.value ? parseFloat(opportunity.value).toLocaleString() : '0'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === `grossProfit-${opportunity.id}` ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-24 h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFieldSave(opportunity.id, 'grossProfit');
                                if (e.key === 'Escape') handleFieldCancel();
                              }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldSave(opportunity.id, 'grossProfit');
                            }}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldCancel();
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center text-sm font-medium cursor-pointer hover:bg-slate-50 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldEdit('grossProfit', opportunity.id, opportunity.grossProfit || '0');
                            }}
                          >
                            ${opportunity.grossProfit ? parseFloat(opportunity.grossProfit).toLocaleString() : '0'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-1 rounded">
                          {opportunity.grossProfitMargin || 0}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingField === `stage-${opportunity.id}` ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={editingValue}
                              onValueChange={setEditingValue}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stageOptions.map((stage) => (
                                  <SelectItem key={stage.value} value={stage.value}>
                                    {stage.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldSave(opportunity.id, 'stage');
                            }}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldCancel();
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Badge 
                            className={`${getStageColor(opportunity.stage)} cursor-pointer hover:opacity-80`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldEdit('stage', opportunity.id, opportunity.stage);
                            }}
                          >
                            {opportunity.stage.charAt(0).toUpperCase() + opportunity.stage.slice(1).replace('-', ' ')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === `probability-${opportunity.id}` ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-16 h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFieldSave(opportunity.id, 'probability');
                                if (e.key === 'Escape') handleFieldCancel();
                              }}
                              autoFocus
                            />
                            <span className="text-sm">%</span>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldSave(opportunity.id, 'probability');
                            }}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldCancel();
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center cursor-pointer hover:bg-slate-50 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldEdit('probability', opportunity.id, (opportunity.probability || 0).toString());
                            }}
                          >
                            <div className="w-12 bg-slate-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${opportunity.probability || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-slate-600">{opportunity.probability || 0}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField === `closeDate-${opportunity.id}` ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="date"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-36 h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFieldSave(opportunity.id, 'closeDate');
                                if (e.key === 'Escape') handleFieldCancel();
                              }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldSave(opportunity.id, 'closeDate');
                            }}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              handleFieldCancel();
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldEdit('closeDate', opportunity.id, opportunity.closeDate ? new Date(opportunity.closeDate).toISOString().split('T')[0] : '');
                            }}
                          >
                            {opportunity.closeDate ? (
                              <>
                                <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                                {new Date(opportunity.closeDate).toLocaleDateString()}
                              </>
                            ) : (
                              <span className="text-slate-400">Click to set date</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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

      <AccountModal 
        open={isAccountModalOpen} 
        onOpenChange={(open) => {
          setIsAccountModalOpen(open);
          if (!open) {
            setNewAccountMode(false);
            setPendingOpportunityId(null);
          }
        }}
        onAccountCreated={(newAccount) => {
          if (pendingOpportunityId && newAccountMode) {
            updateOpportunityMutation.mutate({
              id: pendingOpportunityId,
              data: { accountId: newAccount.id }
            });
          }
          setIsAccountModalOpen(false);
          setNewAccountMode(false);
          setPendingOpportunityId(null);
          setEditingField(null);
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
        leadData={leadForContact as any}
      />

      <DescriptionModal
        opportunity={selectedOpportunityForDescription}
        open={isDescriptionModalOpen}
        onOpenChange={(open) => {
          setIsDescriptionModalOpen(open);
          if (!open) {
            setSelectedOpportunityForDescription(null);
          }
        }}
      />

      <LeadDetailsModal
        leadId={selectedLeadId}
        open={isLeadDetailsModalOpen}
        onOpenChange={(open) => {
          setIsLeadDetailsModalOpen(open);
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
      />
      </div>
    </div>
  );
}