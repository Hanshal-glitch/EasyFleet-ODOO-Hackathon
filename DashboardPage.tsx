import { Truck, Users, Route, Wrench, Fuel, Receipt, FileText, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent } from '../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

const stats = [
  { name: 'Active Vehicles', icon: Truck, color: 'bg-blue-500', query: ['dashboard', 'kpis'] },
  { name: 'Available Vehicles', icon: Truck, color: 'bg-green-500', query: ['dashboard', 'kpis'] },
  { name: 'Active Trips', icon: Route, color: 'bg-purple-500', query: ['dashboard', 'kpis'] },
  { name: 'Pending Trips', icon: Route, color: 'bg-yellow-500', query: ['dashboard', 'kpis'] },
  { name: 'Drivers On Duty', icon: Users, color: 'bg-orange-500', query: ['dashboard', 'kpis'] },
  { name: 'Available Drivers', icon: Users, color: 'bg-indigo-500', query: ['dashboard', 'kpis'] },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.get('/dashboard/kpis').then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}! Here's what's happening with your fleet.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse">Loading dashboard data...</div>
        ) : kpis ? (
          <>
            <StatCard title="Active Vehicles" value={kpis.activeVehicles} icon={Truck} color="bg-blue-500" />
            <StatCard title="Available Vehicles" value={kpis.availableVehicles} icon={Truck} color="bg-green-500" />
            <StatCard title="In Shop" value={kpis.inShopVehicles} icon={Wrench} color="bg-yellow-500" />
            <StatCard title="Retired Vehicles" value={kpis.retiredVehicles} icon={Truck} color="bg-gray-500" />
            <StatCard title="Active Trips" value={kpis.activeTrips} icon={Route} color="bg-purple-500" />
            <StatCard title="Pending Trips" value={kpis.pendingTrips} icon={Route} color="bg-yellow-500" />
            <StatCard title="Drivers On Duty" value={kpis.driversOnDuty} icon={Users} color="bg-orange-500" />
            <StatCard title="Available Drivers" value={kpis.availableDrivers} icon={Users} color="bg-indigo-500" />
            <StatCard title="Fleet Utilization" value={`${kpis.fleetUtilizationPct}%`} icon={BarChart3} color="bg-pink-500" />
          </>
        ) : (
          stats.map((stat) => (
            <StatCard key={stat.name} title={stat.name} value="—" icon={stat.icon} color={stat.color} />
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard title="Create Trip" description="Dispatch a new trip" icon={Route} color="bg-blue-500" href="/trips" />
        <QuickActionCard title="Add Vehicle" description="Register a new vehicle" icon={Truck} color="bg-green-500" href="/vehicles" />
        <QuickActionCard title="Add Driver" description="Register a new driver" icon={Users} color="bg-indigo-500" href="/drivers" />
        <QuickActionCard title="Log Maintenance" description="Record maintenance work" icon={Wrench} color="bg-yellow-500" href="/maintenance" />
        <QuickActionCard title="Log Fuel" description="Record fuel purchase" icon={Fuel} color="bg-orange-500" href="/fuel" />
        <QuickActionCard title="Log Expense" description="Record an expense" icon={Receipt} color="bg-pink-500" href="/expenses" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Vehicles', href: '/vehicles', icon: Truck },
            { name: 'Drivers', href: '/drivers', icon: Users },
            { name: 'Trips', href: '/trips', icon: Route },
            { name: 'Maintenance', href: '/maintenance', icon: Wrench },
            { name: 'Fuel', href: '/fuel', icon: Fuel },
            { name: 'Expenses', href: '/expenses', icon: Receipt },
            { name: 'Reports', href: '/reports', icon: BarChart3 },
            { name: 'Documents', href: '/documents', icon: FileText },
            { name: 'Settings', href: '/settings', icon: Settings },
          ].map((item) => (
            <a key={item.name} href={item.href} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <item.icon className="h-4 w-4" />
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ title, description, icon: Icon, color, href }: { title: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string; href: string }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = href}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardPage;