import { Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '@transport-ops/shared/types';

const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  liters: z.number().positive('Liters must be positive'),
  costPerLiter: z.number().positive('Cost per liter must be positive'),
  date: z.string().min(1, 'Date is required'),
  odometerKm: z.number().positive('Odometer must be positive'),
  stationName: z.string().optional(),
  receiptNumber: z.string().optional(),
});

type FuelFormData = z.infer<typeof fuelSchema>;

export function FuelPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: fuelLogs, isLoading: isLoadingFuel } = useQuery({
    queryKey: ['fuel'],
    queryFn: () => api.get('/fuel').then(res => res.data),
  });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles/available-for-dispatch').then(res => res.data.vehicles),
  });

  const createMutation = useMutation({
    mutationFn: (data: FuelFormData) => api.post('/fuel', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fuel'] }); setIsModalOpen(false); },
  });

  const form = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { liters: 0, costPerLiter: 0, odometerKm: 0 },
  });

  const handleSubmit = (data: FuelFormData) => createMutation.mutate(data);

  const filteredLogs = fuelLogs?.data?.filter((f: any) => {
    const matchesSearch = f.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      f.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.stationName?.toLowerCase().includes(search.toLowerCase());
    const matchesVehicle = !vehicleFilter || f.vehicleId === vehicleFilter;
    return matchesSearch && matchesVehicle;
  }) || [];

  const vehicleOptions = (Array.isArray(vehicles) ? vehicles : (vehicles?.data || vehicles?.vehicles || []))?.map((v: any) => ({ value: v.id, label: `${v.registrationNumber} - ${v.name}` })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Logs</h1>
          <p className="text-muted-foreground">Track fuel consumption and costs</p>
        </div>
        {canManage && <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Fuel Log
        </Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Fuel Logs</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" /></div>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter} options={[
                { value: '', label: 'All Vehicles' },
                ...vehicleOptions,
              ]} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoadingFuel ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading fuel logs...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost/L</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Station</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((fuel: any) => (
                  <TableRow key={fuel.id}>
                    <TableCell className="font-medium">{fuel.vehicle?.registrationNumber} - {fuel.vehicle?.name}</TableCell>
                    <TableCell>{new Date(fuel.date).toLocaleDateString()}</TableCell>
                    <TableCell>{fuel.liters} L</TableCell>
                    <TableCell>₹{fuel.costPerLiter?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>₹{fuel.totalCost?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{fuel.odometerKm?.toLocaleString() || '0'} km</TableCell>
                    <TableCell>{fuel.stationName || '-'}</TableCell>
                  </TableRow>
                )) || []}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Fuel Log" size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle</label>
              <Select onValueChange={(val) => form.setValue('vehicleId', val)} value={form.watch('vehicleId')} options={vehicleOptions} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Date</label>
              <Input type="date" {...form.register('date')} error={form.formState.errors.date?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Liters</label>
              <Input type="number" step="0.1" {...form.register('liters', { valueAsNumber: true })} placeholder="50" error={form.formState.errors.liters?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Cost per Liter</label>
              <Input type="number" step="0.01" {...form.register('costPerLiter', { valueAsNumber: true })} placeholder="1.50" error={form.formState.errors.costPerLiter?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Odometer (km)</label>
              <Input type="number" {...form.register('odometerKm', { valueAsNumber: true })} placeholder="15000" error={form.formState.errors.odometerKm?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Station Name</label>
              <Input {...form.register('stationName')} placeholder="Shell Station" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Receipt Number</label>
              <Input {...form.register('receiptNumber')} placeholder="RCPT-12345" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Fuel Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FuelPage;
