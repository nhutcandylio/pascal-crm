import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Handshake, 
  Calendar, 
  BarChart3, 
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
  { name: "Users", href: "/users", icon: User },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 glass-effect shadow-2xl border-r border-white/20 flex flex-col">
      {/* Logo and Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            CRM Pro
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/50 hover:shadow-md"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3 transition-transform duration-200",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-primary group-hover:scale-110"
                )} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center p-3 rounded-xl bg-white/30 backdrop-blur-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold text-slate-900">John Smith</p>
            <p className="text-xs text-slate-600">Sales Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
