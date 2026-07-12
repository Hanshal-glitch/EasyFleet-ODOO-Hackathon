import { Download, TrendingUp, DollarSign, Truck, Fuel, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

const reportTypes = [
  { key: 'fuel-efficiency', label: 'Fuel Efficiency', description: 'Distance per fuel consumption by vehicle', icon: Fuel },
  { key: 'fleet-utilization', label: 'Fleet Utilization', description: 'Vehicle usage percentage over time', icon: Truck },
  { key: 'operational-cost', label: 'Operational Cost', description: 'Fuel + maintenance costs by vehicle', icon: Receipt },
  { key: 'vehicle-roi', label: 'Vehicle ROI', description: 'Return on investment per vehicle', icon: TrendingUp },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('fuel-efficiency');
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', vehicleType: '', region: '' });
  const [timeDuration, setTimeDuration] = useState('1-month');

  useEffect(() => {
    if (timeDuration !== 'custom') {
      const to = new Date();
      const from = new Date();
      if (timeDuration === '1-month') from.setMonth(from.getMonth() - 1);
      else if (timeDuration === '3-months') from.setMonth(from.getMonth() - 3);
      else if (timeDuration === '6-months') from.setMonth(from.getMonth() - 6);
      else if (timeDuration === '1-year') from.setFullYear(from.getFullYear() - 1);
      
      setFilters(prev => ({
        ...prev,
        dateFrom: from.toISOString().split('T')[0],
        dateTo: to.toISOString().split('T')[0],
      }));
    } else {
      setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    }
  }, [timeDuration]);

  const getCleanFilters = () => {
    const clean: Record<string, string> = {};
    if (filters.vehicleType) clean.vehicleType = filters.vehicleType;
    if (filters.region) clean.region = filters.region;
    if (filters.dateFrom) clean.dateFrom = new Date(filters.dateFrom).toISOString();
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      clean.dateTo = to.toISOString();
    }
    return clean;
  };

  const { data: reportData } = useQuery({
    queryKey: ['reports', activeReport, filters],
    queryFn: () => api.get(`/reports/${activeReport}`, { params: getCleanFilters() }).then(res => res.data),
  });

  const { data: summaryStats } = useQuery({
    queryKey: ['reports-summary', filters],
    queryFn: () => api.get(`/reports/summary`, { params: getCleanFilters() }).then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">View operational metrics and export reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Vehicles" value={summaryStats?.totalVehicles ?? '-'} icon={Truck} color="bg-blue-500" />
        <StatCard title="Total Trips" value={summaryStats?.totalTrips ?? '-'} icon={Truck} color="bg-purple-500" />
        <StatCard title="Avg Fuel Efficiency" value={`${summaryStats?.avgFuelEfficiency ?? '-'} km/L`} icon={Fuel} color="bg-orange-500" />
        <StatCard title="Total Revenue" value={`₹${summaryStats?.totalRevenue?.toLocaleString('en-IN') ?? '-'}`} icon={DollarSign} color="bg-green-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map(report => (
          <ReportCard key={report.key} report={report} active={activeReport === report.key} onClick={() => setActiveReport(report.key)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{reportTypes.find(r => r.key === activeReport)?.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{reportTypes.find(r => r.key === activeReport)?.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select 
                value={timeDuration}
                onValueChange={(val) => setTimeDuration(val)}
                options={[
                  { value: '1-month', label: 'Last 1 Month' },
                  { value: '3-months', label: 'Last 3 Months' },
                  { value: '6-months', label: 'Last 6 Months' },
                  { value: '1-year', label: 'Last 1 Year' },
                  { value: 'custom', label: 'Custom' },
                ]} 
              />
              {timeDuration === 'custom' && (
                <div className="flex gap-2">
                  <Input 
                    type="date" 
                    placeholder="From" 
                    className="w-40" 
                    value={filters.dateFrom}
                    onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                  <Input 
                    type="date" 
                    placeholder="To" 
                    className="w-40" 
                    value={filters.dateTo}
                    onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              )}
              <Select 
                placeholder="Vehicle Type" 
                value={filters.vehicleType}
                onValueChange={val => setFilters(prev => ({ ...prev, vehicleType: val }))}
                options={[
                { value: '', label: 'All Types' },
                { value: 'VAN', label: 'Van' },
                { value: 'TRUCK', label: 'Truck' },
                { value: 'TRAILER', label: 'Trailer' },
              ]} />
              <Select 
                placeholder="Region" 
                value={filters.region}
                onValueChange={val => setFilters(prev => ({ ...prev, region: val }))}
                options={[
                { value: '', label: 'All Regions' },
                { value: 'North', label: 'North' },
                { value: 'South', label: 'South' },
              ]} />
              <Button variant="outline" onClick={() => window.open(`${api.defaults.baseURL}/reports/export?reportType=${activeReport}&format=csv&${new URLSearchParams(getCleanFilters()).toString()}`, '_blank')}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
              <Button variant="outline" onClick={() => window.open(`${api.defaults.baseURL}/reports/export?reportType=${activeReport}&format=pdf&${new URLSearchParams(getCleanFilters()).toString()}`, '_blank')}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReportView reportKey={activeReport} data={reportData} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCard({ report, active, onClick }: { report: typeof reportTypes[0]; active: boolean; onClick: () => void }) {
  const Icon = report.icon;
  return (
    <Card onClick={onClick} className={cn('cursor-pointer transition-all hover:shadow-md', active && 'ring-2 ring-primary')}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-full', active ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">{report.label}</h3>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportView({ reportKey, data }: { reportKey: string; data: any }) {
  if (!data) return <div className="text-center py-12 text-muted-foreground">Loading report data...</div>;

  switch (reportKey) {
    case 'fuel-efficiency':
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{data?.data?.length || 0} vehicles analyzed</p>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Vehicle</TableHead><TableHead>Registration</TableHead>
              <TableHead>Total Distance</TableHead><TableHead>Total Fuel</TableHead>
              <TableHead>Efficiency (km/L)</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.data?.map((row: any) => (
                <TableRow key={row.vehicleId}>
                  <TableCell className="font-medium">{row.vehicleName}</TableCell>
                  <TableCell>{row.vehicleRegistration}</TableCell>
                  <TableCell>{row.totalDistanceKm.toFixed(1)} km</TableCell>
                  <TableCell>{row.totalFuelLiters.toFixed(1)} L</TableCell>
                  <TableCell className="font-semibold">{row.efficiencyKmPerLiter.toFixed(2)} km/L</TableCell>
                </TableRow>
              )) || <TableRow><TableCell className="text-center text-muted-foreground" colSpan={5}>No data available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      );
    case 'fleet-utilization':
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{data?.data?.length || 0} vehicles analyzed</p>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Vehicle</TableHead><TableHead>Registration</TableHead>
              <TableHead>Trip Days</TableHead><TableHead>Total Days</TableHead>
              <TableHead>Utilization %</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.data?.map((row: any) => (
                <TableRow key={row.vehicleId}>
                  <TableCell className="font-medium">{row.vehicleName}</TableCell>
                  <TableCell>{row.vehicleRegistration}</TableCell>
                  <TableCell>{row.tripDays}</TableCell>
                  <TableCell>{row.totalDays}</TableCell>
                  <TableCell className="font-semibold">{row.utilizationPct.toFixed(1)}%</TableCell>
                </TableRow>
              )) || <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      );
    case 'operational-cost':
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{data?.data?.length || 0} vehicles analyzed</p>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Vehicle</TableHead><TableHead>Registration</TableHead>
              <TableHead>Fuel Cost</TableHead><TableHead>Maintenance Cost</TableHead><TableHead>Total Cost</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.data?.map((row: any) => (
                <TableRow key={row.vehicleId}>
                  <TableCell className="font-medium">{row.vehicleName}</TableCell>
                  <TableCell>{row.vehicleRegistration}</TableCell>
                  <TableCell>₹{row.fuelCost.toFixed(2)}</TableCell>
                  <TableCell>₹{row.maintenanceCost.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">₹{row.totalCost.toFixed(2)}</TableCell>
                </TableRow>
              )) || <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      );
    case 'vehicle-roi':
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{data?.data?.length || 0} vehicles analyzed</p>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Vehicle</TableHead><TableHead>Registration</TableHead>
              <TableHead>Revenue</TableHead><TableHead>Fuel Cost</TableHead>
              <TableHead>Maintenance Cost</TableHead><TableHead>Acquisition Cost</TableHead>
              <TableHead>ROI %</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.data?.map((row: any) => (
                <TableRow key={row.vehicleId}>
                  <TableCell className="font-medium">{row.vehicleName}</TableCell>
                  <TableCell>{row.vehicleRegistration}</TableCell>
                  <TableCell>₹{row.revenue.toFixed(2)}</TableCell>
                  <TableCell>₹{row.fuelCost.toFixed(2)}</TableCell>
                  <TableCell>₹{row.maintenanceCost.toFixed(2)}</TableCell>
                  <TableCell>₹{row.acquisitionCost.toFixed(2)}</TableCell>
                  <TableCell className={cn('font-semibold', row.roi >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {row.roi >= 0 ? '+' : ''}{row.roi.toFixed(1)}%
                  </TableCell>
                </TableRow>
              )) || <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No data available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      );
    default:
      return <div className="text-center py-12 text-muted-foreground">Select a report type</div>;
  }
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
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

export default ReportsPage;