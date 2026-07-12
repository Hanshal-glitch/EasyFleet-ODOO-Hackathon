import { Plus, Search, Wrench, AlertCircle, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '@transport-ops/shared/types';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative().default(0),
  odometerAtStart: z.number().positive('Odometer must be positive'),
  odometerAtEnd: z.number().positive().optional(),
  actualCost: z.number().nonnegative().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

const statusBadges: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function MaintenancePage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

  const queryClient = useQueryClient();
  const { data: maintenance, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api.get('/maintenance').then(res => res.data),
  });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles/available-for-dispatch').then(res => res.data.vehicles),
  });

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceFormData) => api.post('/maintenance', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance'] }); setIsModalOpen(false); },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { odometerAtEnd: number; actualCost?: number } }) =>
      api.post(`/maintenance/${id}/close`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance'] }); setSelectedMaintenance(null); },
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { cost: 0 },
  });

  const handleSubmit = (data: MaintenanceFormData) => createMutation.mutate(data);

  const handleCloseSubmit = (data: any) => closeMutation.mutate({ id: selectedMaintenance.id, data });

  const filteredMaintenance = maintenance?.data?.filter((m: any) => {
    const matchesSearch = m.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      m.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Manage vehicle maintenance records</p>
        </div>
        {canManage && <Button onClick={() => { setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Maintenance
        </Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Open" value={maintenance?.data?.filter((m: any) => m.status === 'OPEN').length || 0} icon={AlertCircle} color="bg-yellow-500" />
        <StatCard title="In Progress" value={maintenance?.data?.filter((m: any) => m.status === 'IN_PROGRESS').length || 0} icon={Wrench} color="bg-blue-500" />
        <StatCard title="Completed" value={maintenance?.data?.filter((m: any) => m.status === 'COMPLETED').length || 0} icon={Shield} color="bg-green-500" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Maintenance Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter} options={[
                { value: '', label: 'All Statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoadingMaintenance ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading maintenance records...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.vehicle?.registrationNumber} - {m.vehicle?.name}</TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell>
                      <Badge className={statusBadges[m.status] || 'bg-gray-100 text-gray-800'}>{m.status?.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{m.cost?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{new Date(m.startedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{m.completedAt ? new Date(m.completedAt).toLocaleDateString() : '-'}</TableCell>
                      {canManage && <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'OPEN' && (
                          <Button size="sm" onClick={() => setSelectedMaintenance(m)}>Close</Button>
                        )}
                      </div>
                      </TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); form.reset(); }} title="New Maintenance" size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle</label>
              <Select onValueChange={(val) => form.setValue('vehicleId', val)} value={form.watch('vehicleId')} options={(Array.isArray(vehicles) ? vehicles : (vehicles?.data || vehicles?.vehicles || []))?.map((v: any) => ({ value: v.id, label: `${v.registrationNumber} - ${v.name}` })) || []} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label>
              <Input {...form.register('description')} placeholder="Oil change and filter replacement" error={form.formState.errors.description?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Estimated Cost</label>
              <Input type="number" step="0.01" {...form.register('cost', { valueAsNumber: true })} placeholder="250" error={form.formState.errors.cost?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Odometer at Start</label>
              <Input type="number" {...form.register('odometerAtStart', { valueAsNumber: true })} placeholder="50000" error={form.formState.errors.odometerAtStart?.message} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selectedMaintenance} onClose={() => setSelectedMaintenance(null)} title="Close Maintenance" size="sm">
        {selectedMaintenance && (
          <form onSubmit={form.handleSubmit(handleCloseSubmit)} className="space-y-4">
            <p>Closing maintenance for <strong>{selectedMaintenance.vehicle?.registrationNumber} - {selectedMaintenance.vehicle?.name}</strong></p>
            <div className="space-y-2"><label className="text-sm font-medium">Odometer at End</label>
              <Input type="number" {...form.register('odometerAtEnd', { valueAsNumber: true })} placeholder={selectedMaintenance.odometerAtStart.toString()} min={selectedMaintenance.odometerAtStart} error={form.formState.errors.odometerAtEnd?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Actual Cost (optional)</label>
              <Input type="number" step="0.01" {...form.register('actualCost', { valueAsNumber: true })} placeholder="Actual cost" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedMaintenance(null)}>Cancel</Button>
              <Button type="submit" loading={closeMutation.isPending}>Complete</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
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

export default MaintenancePage;
