import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Handshake, 
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
];

export default function TopNav() {
  const [location] = useLocation();

  return (
    <div className="w-full bg-white shadow-sm border-b border-slate-200">
      <div className="px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="ml-3 text-xl font-semibold text-slate-900">CRM </span>
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