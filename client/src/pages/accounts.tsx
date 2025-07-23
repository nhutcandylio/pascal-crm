import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import AccountModal from "../components/modals/account-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building, Phone, Globe, MapPin } from "lucide-react";
import type { Account } from "@shared/schema";

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const filteredAccounts = accounts.filter(account =>
    account.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <TopBar 
        title="Accounts"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search accounts..."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No accounts found matching your search." : "No accounts found. Create your first account to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{account.companyName}</div>
                            {account.website && (
                              <div className="text-sm text-slate-500 flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                {account.website.replace('https://', '')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.industry ? (
                          <Badge variant="secondary">{account.industry}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.phone ? (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-slate-400" />
                            {account.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {account.address ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                            {account.address}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}