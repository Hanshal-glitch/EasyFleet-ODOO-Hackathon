import { Plus, Search, Eye, AlertTriangle, Calendar, Shield, Trash2 } from 'lucide-react';
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

const documentSchema = z.object({
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  type: z.enum(['DRIVING_LICENCE', 'AADHAR', 'PAN_CARD', 'INSURANCE', 'OTHER']),
  title: z.string().min(1, 'Title is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  file: z.any().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

const typeLabels: Record<string, string> = {
  DRIVING_LICENCE: 'Driving Licence',
  AADHAR: 'Aadhar Card',
  PAN_CARD: 'PAN Card',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

const typeBadges: Record<string, string> = {
  DRIVING_LICENCE: 'bg-indigo-100 text-indigo-800',
  AADHAR: 'bg-blue-100 text-blue-800',
  PAN_CARD: 'bg-yellow-100 text-yellow-800',
  INSURANCE: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const getExpiryStatus = (date: string) => {
  const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { label: 'Expired', class: 'bg-red-100 text-red-800' };
  if (daysUntil <= 30) return { label: `${daysUntil} days left`, class: 'bg-yellow-100 text-yellow-800' };
  if (daysUntil <= 90) return { label: `${daysUntil} days left`, class: 'bg-blue-100 text-blue-800' };
  return { label: 'Valid', class: 'bg-green-100 text-green-800' };
};

const vehicleOptions = (vehicles: any) => {
  const vArr = Array.isArray(vehicles) ? vehicles : (vehicles?.data || vehicles?.vehicles || []);
  return vArr.map((v: any) => ({ value: v.id, label: `${v.registrationNumber} - ${v.name}` }));
};

const driverOptions = (drivers: any) => {
  const dArr = Array.isArray(drivers) ? drivers : (drivers?.data || drivers?.drivers || []);
  return dArr.map((d: any) => ({ value: d.id, label: `${d.name} (${d.licenseNumber})` }));
};

const typeOptions = [
  { value: 'DRIVING_LICENCE', label: 'Driving Licence' },
  { value: 'AADHAR', label: 'Aadhar Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
];

export function DocumentsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then(res => res.data),
  });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles/available-for-dispatch').then(res => res.data.vehicles),
  });
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers/available-for-dispatch').then(res => res.data.drivers),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); setIsModalOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: { type: 'OTHER' },
  });

  const handleSubmit = (data: DocumentFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    uploadMutation.mutate(formData);
  };

  const filteredDocuments = documents?.data?.filter((d: any) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.driver?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || d.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage vehicle and driver documents</p>
        </div>
        {canManage && <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Upload Document
        </Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Expiring Soon (30 days)" value={documents?.data?.filter((d: any) => getExpiryStatus(d.expiryDate).label.includes('days')).length || 0} icon={Calendar} color="bg-yellow-500" />
        <StatCard title="Expired" value={documents?.data?.filter((d: any) => getExpiryStatus(d.expiryDate).label === 'Expired').length || 0} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Valid" value={documents?.data?.filter((d: any) => getExpiryStatus(d.expiryDate).label === 'Valid').length || 0} icon={Shield} color="bg-green-500" />
      </div>

      <Card>
<CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Document Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" /></div>
              <Select value={typeFilter} onValueChange={setTypeFilter} options={[
                { value: '', label: 'All Types' },
                { value: 'REGISTRATION', label: 'Registration' },
                { value: 'INSURANCE', label: 'Insurance' },
                { value: 'INSPECTION', label: 'Inspection' },
                { value: 'PERMIT', label: 'Permit' },
                { value: 'DRIVER_LICENSE', label: 'Driver License' },
                { value: 'MEDICAL_CERT', label: 'Medical Certificate' },
                { value: 'OTHER', label: 'Other' },
              ]} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoadingDocuments ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading documents...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle / Driver</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: any) => {
                  const expiryStatus = getExpiryStatus(doc.expiryDate);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell><Badge className={typeBadges[doc.type] || 'bg-gray-100 text-gray-800'}>{typeLabels[doc.type] || doc.type}</Badge></TableCell>
                      <TableCell>{doc.vehicle?.registrationNumber ? `${doc.vehicle.registrationNumber} - ${doc.vehicle.name}` : doc.driver ? `${doc.driver.name} (${doc.driver.licenseNumber})` : '-'}</TableCell>
                      <TableCell>{new Date(doc.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge className={expiryStatus.class}>{expiryStatus.label}</Badge></TableCell>
                      {canManage && <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document" size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" encType="multipart/form-data">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Document Type</label>
              <Select onValueChange={(val) => form.setValue('type', val as any)} value={form.watch('type')} options={typeOptions} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Title</label>
              <Input {...form.register('title')} placeholder="Vehicle Registration" error={form.formState.errors.title?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Expiry Date</label>
              <Input type="date" {...form.register('expiryDate')} error={form.formState.errors.expiryDate?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle (optional)</label>
              <Select onValueChange={(val) => form.setValue('vehicleId', val)} value={form.watch('vehicleId') || ''} options={vehicleOptions(vehicles)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Driver (optional)</label>
              <Select onValueChange={(val) => form.setValue('driverId', val)} value={form.watch('driverId') || ''} options={driverOptions(drivers)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">File</label>
              <Input type="file" {...form.register('file')} accept=".pdf,.jpg,.jpeg,.png" error={form.formState.errors.file?.message ? String(form.formState.errors.file.message) : undefined} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={uploadMutation.isPending}>Upload</Button>
          </div>
        </form>
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

export default DocumentsPage;
