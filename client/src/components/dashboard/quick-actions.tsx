import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Handshake, Plus, BarChart3 } from "lucide-react";
import CustomerModal from "@/components/modals/customer-modal";
import DealModal from "../modals/deal-modal";
import ActivityModal from "../modals/activity-modal";

export default function QuickActions() {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const actions = [
    {
      label: "Add Customer",
      icon: UserPlus,
      onClick: () => setCustomerModalOpen(true),
    },
    {
      label: "New Deal",
      icon: Handshake,
      onClick: () => setDealModalOpen(true),
    },
    {
      label: "Log Activity",
      icon: Plus,
      onClick: () => setActivityModalOpen(true),
    },
    {
      label: "Generate Report",
      icon: BarChart3,
      onClick: () => {
        // TODO: Implement reporting functionality
        console.log("Generate report clicked");
      },
    },
  ];

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="flex items-center justify-center px-4 py-3 h-auto hover:bg-slate-50 transition-colors"
                onClick={action.onClick}
              >
                <action.icon className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />

      <DealModal
        isOpen={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
      />

      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      />
    </>
  );
}
