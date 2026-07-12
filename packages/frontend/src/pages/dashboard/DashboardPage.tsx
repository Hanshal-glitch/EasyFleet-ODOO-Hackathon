import { Truck, Users, Route, Wrench, Fuel, Receipt, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { Joyride, STATUS, Step, EventData } from 'react-joyride';
import { useAuth } from '../../hooks/useAuth';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom dark map component that styles the map tiles
function DarkModeMap() {
  const map = useMap();
  map.getContainer().style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  return null;
}

export function DashboardPage() {
  const [runTour, setRunTour] = useState(false);
  const { user, setUser } = useAuth();

  const tourSteps: Step[] = [
    {
      target: '.tour-dashboard-kpis',
      content: 'These are your real-time key performance indicators. Watch them update live as your fleet operates.',
    },
    {
      target: '.tour-dashboard-fleet',
      content: 'This widget gives you a breakdown of your fleet availability. Watch the bar chart visualize the status.',
    },
    {
      target: '.tour-dashboard-map',
      content: 'Track all your active trips on this live map interface.',
    },
    {
      target: '.tour-sidebar-vehicles',
      content: 'Click here to manage your vehicle registry and add new trucks or vans.',
    },
    {
      target: '.tour-sidebar-drivers',
      content: 'Here you can manage your drivers and track their license expiry dates.',
    },
    {
      target: '.tour-sidebar-reports',
      content: 'Generate and download custom CSV/PDF reports for operations and accounting.',
    }
  ];
  
  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.get('/dashboard/kpis').then(res => res.data),
  });

  const handleStartTour = async () => {
    try {
      await api.post('/dashboard/tour');
      setRunTour(true);
    } catch (error) {
      console.error('Failed to start tour', error);
    }
  };

  const completeTour = async () => {
    try {
      const { data } = await api.post('/dashboard/tour/end');
      setUser(data.user);
    } catch (error) {
      console.error('Failed to complete tour', error);
    }
  };

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      await completeTour();
    }
  };

  if (user && !user.hasCompletedOnboardingTour && !runTour) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black/40 p-8 text-center relative">
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="relative z-10 flex flex-col items-center max-w-2xl">
          <Truck className="w-24 h-24 text-primary mb-6 animate-pulse" />
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Welcome to Transport Ops</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Take a quick walkthrough of the dashboard and learn where to find the tools you need. Your operational data will not be changed.
          </p>
          <button 
            type="button"
            onClick={handleStartTour}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100"
          >
            Give me a Tour
          </button>
          <button type="button" onClick={completeTour} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
            Explore on my own
          </button>
        </div>
      </div>
    );
  }

  const JoyrideComponent: any = Joyride;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black/40">
      <JoyrideComponent
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#d4ff00',
            backgroundColor: '#1a1a1a',
            textColor: '#ffffff',
            arrowColor: '#1a1a1a',
          },
          buttonNext: { backgroundColor: '#d4ff00', color: '#000000', fontWeight: 'bold' },
          buttonBack: { color: '#d4ff00' },
          buttonSkip: { color: '#a1a1aa' },
        }}
      />
      {/* Simulated Map Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity grayscale pointer-events-none"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-background via-transparent to-background/50" />
      
      {/* Floating Widgets Layer */}
      <div className="relative z-10 p-6 md:p-8 h-full flex flex-col gap-6">
        
        {/* Top Floating Dashboard Title & KPI Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="bg-card/40 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 shadow-lg">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
              Operations Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
              Real-time Overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-lg overflow-x-auto max-w-full tour-dashboard-kpis">
            <KPIPill label="Active" value={kpis?.activeVehicles || '-'} total={kpis ? (kpis.activeVehicles + kpis.availableVehicles) : '-'} color="text-primary" />
            <div className="w-px h-6 bg-white/10" />
            <KPIPill label="Drivers" value={kpis?.driversOnDuty || '-'} total={kpis ? (kpis.driversOnDuty + kpis.availableDrivers) : '-'} color="text-blue-400" />
            <div className="w-px h-6 bg-white/10" />
            <KPIPill label="Trips" value={kpis?.activeTrips || '-'} total={kpis ? (kpis.activeTrips + kpis.pendingTrips) : '-'} color="text-purple-400" />
            <div className="w-px h-6 bg-white/10" />
            <KPIPill label="Util" value={`${kpis?.fleetUtilizationPct || '-'}%`} color="text-pink-400" />
          </div>
        </div>

        {/* Main Grid Area */}
        <div className="grid lg:grid-cols-12 gap-6 flex-1 mt-4">
          
          {/* Left Column - Vehicle Tracking */}
          <div className="lg:col-span-4 flex flex-col gap-6 tour-dashboard-fleet">
            <Card className="bg-card/60 border-white/10 backdrop-blur-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Fleet Status
                  </h3>
                </div>
                <Badge color="bg-primary text-primary-foreground">Live</Badge>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Transit</span>
                    <span className="font-mono text-xl">{kpis?.activeVehicles || '-'}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="font-mono text-xl">{kpis?.availableVehicles || '-'}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/3 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">In Shop</span>
                    <span className="font-mono text-xl text-yellow-500">{kpis?.inShopVehicles || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-white/10 backdrop-blur-2xl">
               <CardContent className="p-6 flex flex-col gap-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-400" /> Map Legend
                  </h3>
                  <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-primary" /> Active Routes</div>
                  <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-blue-500" /> Available Units</div>
                  <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Maintenance</div>
               </CardContent>
            </Card>
          </div>

          {/* Center/Right Map Area */}
          <div className="lg:col-span-8 relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl min-h-[400px] tour-dashboard-map">
            <MapContainer center={[21.1458, 79.0882]} zoom={5} style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} zoomControl={true}>
              <DarkModeMap />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[21.1458, 79.0882]}>
                <Popup>TransportOps HQ - Nagpur</Popup>
              </Marker>
              <Marker position={[19.0760, 72.8777]} />
              <Marker position={[28.6139, 77.2090]} />
            </MapContainer>
            
            {/* Compass / Tools Floating */}
            <div className="absolute top-4 right-4 bg-card/60 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-lg flex flex-col gap-2 z-[400]">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer"><span className="text-xs font-mono font-bold">NW</span></div>
            </div>
          </div>

        </div>

        {/* Bottom Quick Actions Dock */}
        <div className="mt-auto pt-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 w-max">
            <QuickActionPill title="New Trip" icon={Route} color="bg-primary/20 text-primary border-primary/30" href="/trips" />
            <QuickActionPill title="Add Vehicle" icon={Truck} color="bg-blue-500/20 text-blue-400 border-blue-500/30" href="/vehicles" />
            <QuickActionPill title="Add Driver" icon={Users} color="bg-purple-500/20 text-purple-400 border-purple-500/30" href="/drivers" />
            <QuickActionPill title="Maintenance" icon={Wrench} color="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" href="/maintenance" />
            <QuickActionPill title="Log Fuel" icon={Fuel} color="bg-orange-500/20 text-orange-400 border-orange-500/30" href="/fuel" />
            <QuickActionPill title="Expenses" icon={Receipt} color="bg-pink-500/20 text-pink-400 border-pink-500/30" href="/expenses" />
          </div>
        </div>

      </div>
    </div>
  );
}

function KPIPill({ label, value, total, color }: { label: string; value: string | number; total?: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/5">
      <div className={cn("w-2 h-2 rounded-full", color.replace('text-', 'bg-'))} />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={cn("text-sm font-bold", color)}>
        {value} {total && <span className="text-white/30 text-xs font-normal">/ {total}</span>}
      </span>
    </div>
  );
}

function QuickActionPill({ title, icon: Icon, color, href }: { title: string; icon: any; color: string; href: string }) {
  return (
    <Link to={href} className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-105", color)}>
      <Icon className="h-5 w-5" />
      <span className="font-semibold text-sm">{title}</span>
    </Link>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold", color)}>
      {children}
    </span>
  );
}
