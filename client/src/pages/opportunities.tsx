import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import OpportunityModal from "../components/modals/opportunity-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Handshake, DollarSign, Calendar, Building, User } from "lucide-react";
import type { OpportunityWithRelations } from "@shared/schema";

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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: opportunities = [], isLoading } = useQuery<OpportunityWithRelations[]>({
    queryKey: ['/api/opportunities'],
  });

  const filteredOpportunities = opportunities.filter(opp =>
    opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opp.account?.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (opp.contact && `${opp.contact.firstName} ${opp.contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <TopBar 
        title="Opportunities"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search opportunities..."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto p-6">
        <Card>
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Close Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.id} className="cursor-pointer hover:bg-slate-50">
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
                        {opportunity.account ? (
                          <div className="flex items-center text-sm">
                            <Building className="h-3 w-3 mr-1 text-slate-400" />
                            {opportunity.account.companyName}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {opportunity.contact ? (
                          <div className="flex items-center text-sm">
                            <User className="h-3 w-3 mr-1 text-slate-400" />
                            {opportunity.contact.firstName} {opportunity.contact.lastName}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="h-3 w-3 mr-1 text-green-600" />
                          ${parseFloat(opportunity.value).toLocaleString()}
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
                        {opportunity.closeDate ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                            {new Date(opportunity.closeDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
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
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}