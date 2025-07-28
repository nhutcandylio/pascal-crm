import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  action?: React.ReactNode;
}

function TopBar({ 
  title, 
  subtitle, 
  searchQuery = "", 
  onSearchChange, 
  searchPlaceholder = "Search...",
  action 
}: TopBarProps) {
  return (
    <header className="glass-effect border-b border-white/20 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-80 pl-12 h-11 bg-white/60 backdrop-blur-sm border-white/30 rounded-xl shadow-lg focus:shadow-xl transition-all duration-200"
              />
            </div>
          )}
          
          {/* Action Button */}
          {action}
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative h-11 w-11 rounded-xl bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-200">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export { TopBar };
export default TopBar;
