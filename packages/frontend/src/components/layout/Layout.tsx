import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, Receipt, FileText, BarChart3, Menu, X, Bell, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Trips', href: '/trips', icon: Route },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel', href: '/fuel', icon: Fuel },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed inset-y-4 left-4 z-40 flex w-20 flex-col items-center border border-white/10 bg-card/60 backdrop-blur-xl rounded-2xl transition-transform duration-300 shadow-2xl py-6',
          isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
        )}
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-primary-foreground text-sm tracking-tighter">TO</span>
          </div>
          <button type="button" className="lg:hidden mt-4 absolute -right-12 top-4 bg-card/80 p-2 rounded-full border border-white/10" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-4 w-full px-2 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-200 group',
                      `tour-sidebar-${item.name.toLowerCase()}`,
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_12px_rgba(212,255,0,0.1)]'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    )}
                    onClick={onClose}
                  >
                    <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "drop-shadow-[0_0_8px_rgba(212,255,0,0.5)]" : "")} aria-hidden="true" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2 bg-card/90 backdrop-blur-md border-white/10">
                  <p className="font-medium tracking-wide">{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 flex flex-col items-center space-y-4 w-full">



        </div>
      </aside>
    </TooltipProvider>
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center gap-4 px-4 lg:px-8 py-6 pointer-events-none">
      <Button variant="outline" size="icon" onClick={onMenuClick} className="lg:hidden pointer-events-auto bg-card/60 backdrop-blur-md border-white/10 rounded-xl h-12 w-12">
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1" />

      {/* Floating Header Pills */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Search Pill */}
        <div className="hidden md:flex items-center bg-card/60 backdrop-blur-xl border border-white/10 rounded-full px-4 h-12 w-64 shadow-lg focus-within:w-80 focus-within:border-primary/50 transition-all duration-300">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <input type="text" placeholder="Search vehicles, trips, or drivers..." className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground" />
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 rounded border border-white/10">⌘</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 rounded border border-white/10">K</span>
          </div>
        </div>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full bg-card/60 backdrop-blur-xl border-white/10 shadow-lg hover:border-primary/50 transition-colors">
              <Bell className="h-5 w-5 text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card/90 backdrop-blur-md border-white/10">
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Top Profile Pill */}
        <Link to="/settings" className="flex items-center gap-3 bg-card/60 backdrop-blur-xl border border-white/10 rounded-full pl-2 pr-5 h-12 shadow-lg hover:border-primary/50 transition-colors cursor-pointer">
          <Avatar className="h-8 w-8 rounded-full border border-white/10">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.firstName} />
            <AvatarFallback className="bg-white/5 text-xs font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex sm:flex-col">
            <p className="text-sm font-semibold text-foreground leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] via-background to-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col min-h-screen transition-all duration-300 lg:pl-[104px]">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 lg:p-8 lg:pt-0 pb-12 w-full max-w-[1600px] mx-auto z-10 relative">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}