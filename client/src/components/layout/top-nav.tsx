import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Handshake, 
  Calendar, 
  TrendingUp,
  User,
  Building,
  UserPlus
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Accounts", href: "/accounts", icon: Building },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Opportunities", href: "/opportunities", icon: Handshake },
  { name: "Activities", href: "/activities", icon: Calendar },
];

export default function TopNav() {
  const [location] = useLocation();

  return (
    <div className="w-full bg-white shadow-sm border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="ml-3 text-xl font-semibold text-slate-900">CRM Pro</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900">John Smith</p>
              <p className="text-xs text-slate-500">Sales Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                      isActive
                        ? "text-primary border-primary"
                        : "text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}