import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
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
const tripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  cargoWeightKg: z.number().positive('Cargo weight must be positive'),
  plannedDistanceKm: z.number().positive('Planned distance must be positive'),
});

type TripFormData = z.infer<typeof tripSchema>;

const statusBadges: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  DISPATCHED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function TripsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ trip: any; action: string } | null>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [actionPayload, setActionPayload] = useState<any>({});

  const queryClient = useQueryClient();
  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.get('/trips').then(res => res.data),
  });
  const { data: availableVehicles } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () => api.get('/trips/available-vehicles').then(r => r.data),
  });
  const { data: availableDrivers } = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => api.get('/trips/available-drivers').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: TripFormData) => api.post('/trips', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trips'] }); setIsModalOpen(false); },
    onError: (error: any) => alert(error.response?.data?.error || 'Failed to create trip'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: any }) => api.post(`/trips/${id}/${action.toLowerCase()}`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trips'] }); setSelectedAction(null); setActionPayload({}); },
    onError: (error: any) => alert(error.response?.data?.error || `Failed to ${selectedAction?.action}`),
  });

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: { cargoWeightKg: 0, plannedDistanceKm: 0 },
  });

  const handleSubmit = (data: TripFormData) => createMutation.mutate(data);

  const filteredTrips = trips?.data?.filter((trip: any) => {
    const matchesSearch = trip.source.toLowerCase().includes(search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(search.toLowerCase()) ||
      trip.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">Manage and track all fleet trips</p>
        </div>
        {canManage && <Button onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Create Trip
        </Button>}
      </div>

      <div className="flex gap-4 mb-4">
        <Input placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
        <Select value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip: any) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{trip.source} → {trip.destination}</p>
                      <p className="text-sm text-muted-foreground">{trip.id.slice(0, 8)}...</p>
                    </div>
                  </TableCell>
                  <TableCell>{trip.vehicle?.registrationNumber} - {trip.vehicle?.name}</TableCell>
                  <TableCell>{trip.driver?.name}</TableCell>
                  <TableCell>{trip.cargoWeightKg} kg</TableCell>
                  <TableCell>{trip.plannedDistanceKm} km</TableCell>
                  <TableCell>
                    <Badge className={statusBadges[trip.status] || 'bg-gray-100 text-gray-800'}>{trip.status?.replace('_', ' ')}</Badge>
                  </TableCell>
                  {canManage && <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {trip.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => setSelectedAction({ trip, action: 'dispatch' })}>Dispatch</Button>
                      )}
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <Button size="sm" onClick={() => setSelectedAction({ trip, action: 'complete' })}>Complete</Button>
                          <Button size="sm" variant="destructive" onClick={() => setSelectedAction({ trip, action: 'cancel' })}>Cancel</Button>
                        </>
                      )}
                      {trip.status === 'COMPLETED' && <span className="text-sm text-green-600">Completed</span>}
                      {trip.status === 'CANCELLED' && <span className="text-sm text-red-600">Cancelled</span>}
                    </div>
                  </TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); form.reset(); setEditingTrip(null); }} title={editingTrip ? 'Edit Trip' : 'Create Trip'} size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Source</label><Input {...form.register('source')} placeholder="Warehouse A" error={form.formState.errors.source?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Destination</label><Input {...form.register('destination')} placeholder="Client Site B" error={form.formState.errors.destination?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle</label>
              <Select 
                value={form.watch('vehicleId') || ''}
                onValueChange={(val) => form.setValue('vehicleId', val, { shouldValidate: true })} 
                options={(Array.isArray(availableVehicles) ? availableVehicles : (availableVehicles?.data || availableVehicles?.vehicles || []))?.map((v: any) => ({ value: v.id, label: `${v.registrationNumber} - ${v.name} (${v.maxLoadCapacityKg} kg)` })) || []} 
                placeholder="Select a vehicle"
                error={form.formState.errors.vehicleId?.message}
              />
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Driver</label>
              <Select 
                value={form.watch('driverId') || ''}
                onValueChange={(val) => form.setValue('driverId', val, { shouldValidate: true })} 
                options={(Array.isArray(availableDrivers) ? availableDrivers : (availableDrivers?.data || availableDrivers?.drivers || []))?.map((d: any) => ({ value: d.id, label: `${d.name} - ${d.licenseNumber}` })) || []} 
                placeholder="Select a driver"
                error={form.formState.errors.driverId?.message}
              />
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Cargo Weight (kg)</label>
              <Input type="number" {...form.register('cargoWeightKg', { valueAsNumber: true })} placeholder="5000" error={form.formState.errors.cargoWeightKg?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Planned Distance (km)</label>
              <Input type="number" {...form.register('plannedDistanceKm', { valueAsNumber: true })} min="1" error={form.formState.errors.plannedDistanceKm?.message} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTrip(null); form.reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>{editingTrip ? 'Update' : 'Create Trip'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selectedAction} onClose={() => { setSelectedAction(null); setActionPayload({}); }} title={`Confirm ${selectedAction?.action}`} size="sm">
        {selectedAction && (
          <div className="space-y-4">
            <p>Are you sure you want to <strong>{selectedAction.action}</strong> this trip?</p>
            
            {selectedAction.action === 'cancel' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cancellation Reason</label>
                <Input 
                  value={actionPayload.reason || ''} 
                  onChange={e => setActionPayload({ ...actionPayload, reason: e.target.value })}
                  placeholder="e.g. Weather conditions"
                />
              </div>
            )}

            {selectedAction.action === 'complete' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Actual Distance (km)</label>
                <Input 
                  type="number"
                  value={actionPayload.actualDistanceKm || ''} 
                  onChange={e => setActionPayload({ ...actionPayload, actualDistanceKm: parseFloat(e.target.value) })}
                />
                <label className="text-sm font-medium">End Odometer (km)</label>
                <Input 
                  type="number"
                  value={actionPayload.endOdometerKm || ''} 
                  onChange={e => setActionPayload({ ...actionPayload, endOdometerKm: parseFloat(e.target.value) })}
                />
                <label className="text-sm font-medium">Fuel Consumed (Liters)</label>
                <Input 
                  type="number"
                  value={actionPayload.fuelConsumedLiters || ''} 
                  onChange={e => setActionPayload({ ...actionPayload, fuelConsumedLiters: parseFloat(e.target.value) })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setSelectedAction(null); setActionPayload({}); }}>Cancel</Button>
              <Button 
                variant="destructive" 
                loading={actionMutation.isPending}
                onClick={() => { actionMutation.mutate({ id: selectedAction.trip.id, action: selectedAction.action, payload: actionPayload }); }}
              >
                Confirm {selectedAction.action}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TripsPage;
