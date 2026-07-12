import { Plus, Search, Fuel, DollarSign, Wrench } from 'lucide-react';
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

const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.enum(['FUEL', 'MAINTENANCE', 'TOLL', 'PARKING', 'INSURANCE', 'PERMIT', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const typeBadges: Record<string, string> = {
  FUEL: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-green-100 text-green-800',
  TOLL: 'bg-yellow-100 text-yellow-800',
  PARKING: 'bg-purple-100 text-purple-800',
  INSURANCE: 'bg-red-100 text-red-800',
  PERMIT: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const typeLabels: Record<string, string> = {
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
  TOLL: 'Toll',
  PARKING: 'Parking',
  INSURANCE: 'Insurance',
  PERMIT: 'Permit',
  OTHER: 'Other',
};

const typeOptions = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'TOLL', label: 'Toll' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'OTHER', label: 'Other' },
];

export function ExpensesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER'] as Role[]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses').then(res => res.data),
  });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles/available-for-dispatch').then(res => res.data.vehicles),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => api.post('/expenses', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setIsModalOpen(false); },
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: 0, type: 'OTHER' },
  });

  const handleSubmit = (data: ExpenseFormData) => createMutation.mutate(data);

  const filteredExpenses = expenses?.data?.filter((e: any) => {
    const matchesSearch = e.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || e.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track all operational expenses</p>
        </div>
        {canManage && <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Expenses" value={`₹${expenses?.data?.reduce((acc: number, e: any) => acc + (e.amount || 0), 0).toFixed(2) || '0.00'}`} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Total Fuel" value={`₹${expenses?.data?.filter((e: any) => e.type === 'FUEL').reduce((acc: number, e: any) => acc + (e.amount || 0), 0).toFixed(2) || '0.00'}`} icon={Fuel} color="bg-green-500" />
        <StatCard title="Total Maintenance" value={`₹${expenses?.data?.filter((e: any) => e.type === 'MAINTENANCE').reduce((acc: number, e: any) => acc + (e.amount || 0), 0).toFixed(2) || '0.00'}`} icon={Wrench} color="bg-yellow-500" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Expense Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" /></div>
              <Select value={typeFilter} onValueChange={setTypeFilter} options={[
                { value: '', label: 'All Types' },
                { value: 'FUEL', label: 'Fuel' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'TOLL', label: 'Toll' },
                { value: 'PARKING', label: 'Parking' },
                { value: 'INSURANCE', label: 'Insurance' },
                { value: 'PERMIT', label: 'Permit' },
                { value: 'OTHER', label: 'Other' },
              ]} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoadingExpenses ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading expenses...</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{e.vehicle?.registrationNumber} - {e.vehicle?.name}</TableCell>
                    <TableCell><Badge className={typeBadges[e.type] || 'bg-gray-100 text-gray-800'}>{typeLabels[e.type] || e.type}</Badge></TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-right font-medium">₹{e.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{e.receiptUrl ? <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a> : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense" size="lg">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Date</label><Input type="date" {...form.register('date')} error={form.formState.errors.date?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle</label>
              <Select onValueChange={(val) => form.setValue('vehicleId', val)} value={form.watch('vehicleId')} options={(Array.isArray(vehicles) ? vehicles : (vehicles?.data || vehicles?.vehicles || []))?.map((v: any) => ({ value: v.id, label: `${v.registrationNumber} - ${v.name}` })) || []} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Type</label>
              <Select onValueChange={(val) => form.setValue('type', val as any)} value={form.watch('type')} options={typeOptions} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label>
              <Input {...form.register('description')} placeholder="Toll payment" error={form.formState.errors.description?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Amount</label>
              <Input type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} placeholder="25.00" error={form.formState.errors.amount?.message} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Receipt URL (optional)</label>
              <Input type="url" {...form.register('receiptUrl')} placeholder="https://example.com/receipt.pdf" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
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

export default ExpensesPage;
