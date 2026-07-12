import { useState } from 'react';
import { Plus, Search, Truck, Wrench } from 'lucide-react';
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
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '@transport-ops/shared/types';


const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Name is required'),
  model: z.string().optional(),
  type: z.enum(['VAN', 'TRUCK', 'TRAILER', 'PICKUP', 'OTHER']),
  maxLoadCapacityKg: z.number().positive('Max load capacity must be positive'),
  acquisitionCost: z.number().nonnegative('Acquisition cost cannot be negative'),
  region: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const statusBadges: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ON_TRIP: 'bg-blue-100 text-blue-800',
  IN_SHOP: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};

export function VehiclesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleFormData) => api.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => api.patch(`/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsModalOpen(false);
      setEditingVehicle(null);
    },
  });

  const retireMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      name: '',
      model: '',
      type: 'VAN',
      maxLoadCapacityKg: 0,
      acquisitionCost: 0,
      region: '',
    },
  });

  const handleSubmit = (data: VehicleFormData) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    form.reset();
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    form.reset({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      model: vehicle.model || '',
      type: vehicle.type,
      maxLoadCapacityKg: vehicle.maxLoadCapacityKg,
      acquisitionCost: vehicle.acquisitionCost,
      region: vehicle.region || '',
    });
    setIsModalOpen(true);
  };

  const filteredVehicles = vehicles?.data?.filter((v: any) => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        {canManage && <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Vehicle Registry</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter} options={[
                { value: '', label: 'All Statuses' },
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ON_TRIP', label: 'On Trip' },
                { value: 'IN_SHOP', label: 'In Shop' },
                { value: 'RETIRED', label: 'Retired' }
              ]} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles?.map((vehicle: any) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-mono font-medium">{vehicle.registrationNumber}</TableCell>
                    <TableCell>{vehicle.name}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell>{vehicle.maxLoadCapacityKg?.toLocaleString() || '0'} kg</TableCell>
                    <TableCell>{vehicle.odometerKm?.toLocaleString() || '0'} km</TableCell>
                    <TableCell>
                      <Badge className={statusBadges[vehicle.status] || 'bg-gray-100 text-gray-800'}>
                        {vehicle.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    {canManage && <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(vehicle)}>
                          <Wrench className="h-4 w-4" />
                        </Button>
                        {vehicle.status !== 'RETIRED' && vehicle.status !== 'IN_SHOP' && (
                          <Button variant="ghost" size="icon" onClick={() => retireMutation.mutate(vehicle.id)}>
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingVehicle(null); form.reset(); }} title={editingVehicle ? 'Edit Vehicle' : 'Create Vehicle'} size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Number</label>
              <Input {...form.register('registrationNumber')} placeholder="ABC-1234" error={form.formState.errors.registrationNumber?.message} disabled={!!editingVehicle} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register('name')} placeholder="Delivery Van 1" error={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input {...form.register('model')} placeholder="Ford Transit" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                options={[
                  { value: 'VAN', label: 'Van' },
                  { value: 'TRUCK', label: 'Truck' },
                  { value: 'TRAILER', label: 'Trailer' },
                  { value: 'PICKUP', label: 'Pickup' },
                  { value: 'OTHER', label: 'Other' }
                ]}
                onValueChange={(val) => form.setValue('type', val as any)}
                value={form.watch('type')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Load Capacity (kg)</label>
              <Input type="number" {...form.register('maxLoadCapacityKg', { valueAsNumber: true })} placeholder="1000" error={form.formState.errors.maxLoadCapacityKg?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Acquisition Cost</label>
              <Input type="number" step="0.01" {...form.register('acquisitionCost', { valueAsNumber: true })} placeholder="35000" error={form.formState.errors.acquisitionCost?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Input {...form.register('region')} placeholder="North" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingVehicle(null); form.reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingVehicle ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VehiclesPage;
