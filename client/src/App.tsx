import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Contacts from "@/pages/contacts";
import Leads from "@/pages/leads";
import Opportunities from "@/pages/opportunities";
import Activities from "@/pages/activities";
import { ProductsPage } from "@/pages/products";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";
import TopNav from "@/components/layout/top-nav";
import OpportunityDetailLayout from "@/components/opportunity/opportunity-detail-layout";

function OpportunityDetailPageWrapper({ opportunityId }: { opportunityId: number }) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <OpportunityDetailLayout
          opportunityId={opportunityId}
          onBack={() => setLocation("/opportunities")}
          onEdit={() => {}}
          onCreateNew={() => setLocation("/opportunities")}
        />
      </div>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/leads" component={Leads} />
          <Route path="/opportunities" component={Opportunities} />
          <Route path="/opportunities/:id">
            {(params) => (
              <OpportunityDetailPageWrapper opportunityId={parseInt(params.id)} />
            )}
          </Route>
          <Route path="/activities" component={Activities} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/users" component={Users} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
