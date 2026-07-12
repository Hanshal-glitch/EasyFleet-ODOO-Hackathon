import { Plus, Search, Shield, AlertCircle } from 'lucide-react';
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
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '@transport-ops/shared/types';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.enum(['A', 'B', 'C', 'D', 'E', 'BE', 'CE', 'DE']),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).default('AVAILABLE'),
});

type DriverFormData = z.infer<typeof driverSchema>;

const statusBadges: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ON_TRIP: 'bg-blue-100 text-blue-800',
  OFF_DUTY: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

const licenseCategoryOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'BE', label: 'BE' },
  { value: 'CE', label: 'CE' },
  { value: 'DE', label: 'DE' },
];

const statusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export function DriversPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: DriverFormData) => api.post('/drivers', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); setIsModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DriverFormData> }) => api.patch(`/drivers/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); setIsModalOpen(false); setEditingDriver(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      licenseNumber: '',
      licenseCategory: 'C',
      licenseExpiryDate: '',
      contactNumber: '',
      safetyScore: 100,
      status: 'AVAILABLE',
    },
  });

  const handleSubmit = (data: DriverFormData) => {
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredDrivers = drivers?.data?.filter((d: any) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">Manage your driver roster</p>
        </div>
        {canManage && <Button onClick={() => { setEditingDriver(null); form.reset(); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Driver
        </Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Driver Roster</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter} options={statusFilterOptions} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading driver roster...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver: any) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell className="font-mono">{driver.licenseNumber}</TableCell>
                    <TableCell><Badge variant="secondary">{driver.licenseCategory}</Badge></TableCell>
                    <TableCell>{new Date(driver.licenseExpiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{driver.contactNumber}</TableCell>
                    <TableCell>
                      <div className={cn('flex items-center gap-2', driver.safetyScore < 70 ? 'text-destructive' : '')}>
                        <div className="flex items-center gap-1">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all" style={{ width: `${driver.safetyScore}%` }} />
                          </div>
                          <span className="text-sm font-medium">{driver.safetyScore}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadges[driver.status] || 'bg-gray-100 text-gray-800'}>
                        {driver.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    {canManage && <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingDriver(driver); setIsModalOpen(true); form.reset({ name: driver.name, licenseNumber: driver.licenseNumber, licenseCategory: driver.licenseCategory, licenseExpiryDate: driver.licenseExpiryDate, contactNumber: driver.contactNumber, safetyScore: driver.safetyScore, status: driver.status }); }}> <Shield className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(driver.id)}><AlertCircle className="h-4 w-4 text-destructive" /></Button>
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

      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingDriver(null); form.reset(); }} title={editingDriver ? 'Edit Driver' : 'Create Driver'} size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Name</label><Input {...form.register('name')} placeholder="John Doe" error={form.formState.errors.name?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">License Number</label><Input {...form.register('licenseNumber')} placeholder="DL123456" error={form.formState.errors.licenseNumber?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">License Category</label><Select onValueChange={(val) => form.setValue('licenseCategory', val as any)} value={form.watch('licenseCategory')} options={licenseCategoryOptions} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">License Expiry</label><Input type="date" {...form.register('licenseExpiryDate')} error={form.formState.errors.licenseExpiryDate?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Contact Number</label><Input {...form.register('contactNumber')} placeholder="+1-555-0123" error={form.formState.errors.contactNumber?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Safety Score</label><Input type="number" min="0" max="100" {...form.register('safetyScore', { valueAsNumber: true })} error={form.formState.errors.safetyScore?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Status</label><Select onValueChange={(val) => form.setValue('status', val as any)} value={form.watch('status')} options={statusOptions} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingDriver(null); form.reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingDriver ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DriversPage;
