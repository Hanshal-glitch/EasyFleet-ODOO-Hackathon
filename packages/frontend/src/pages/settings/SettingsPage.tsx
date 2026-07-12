import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '../../components/ui/Tabs';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Separator } from '../../components/ui/Separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme: resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });
  const [activeTab, setActiveTab] = useState('profile');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.patch('/users/me', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auth'] }); },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => api.post('/auth/change-password', data),
    onSuccess: () => { passwordForm.reset(); },
  });

  const handleProfileSubmit = (data: ProfileFormData) => updateProfileMutation.mutate(data);
  const handlePasswordSubmit = (data: PasswordFormData) => changePasswordMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 max-w-md">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...profileForm.register('firstName')} error={profileForm.formState.errors.firstName?.message} /></div>
                  <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...profileForm.register('lastName')} error={profileForm.formState.errors.lastName?.message} /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} /></div>
                </div>
                <Button type="submit" loading={updateProfileMutation.isPending}>Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2"><Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} /></div>
                <div className="space-y-2"><Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
                  <p className="text-sm text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, and number</p></div>
                <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} /></div>
                <Button type="submit" loading={changePasswordMutation.isPending}>Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><label className="font-medium">Email Notifications</label><p className="text-sm text-muted-foreground">Receive email notifications</p></div>
                <Switch checked={notifications.email} onCheckedChange={v => setNotifications(p => ({ ...p, email: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><label className="font-medium">Push Notifications</label><p className="text-sm text-muted-foreground">Receive push notifications</p></div>
                <Switch checked={notifications.push} onCheckedChange={v => setNotifications(p => ({ ...p, push: v }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><label className="font-medium">SMS Alerts</label><p className="text-sm text-muted-foreground">Receive SMS for critical alerts</p></div>
                <Switch checked={notifications.sms} onCheckedChange={v => setNotifications(p => ({ ...p, sms: v }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {['light', 'dark', 'system'].map(mode => {
                  const label = mode === 'system' ? 'Follows OS' : mode === 'dark' ? 'Dark mode' : 'Light mode';
                  return (
                    <Button
                      key={mode}
                      variant={resolvedTheme === mode ? 'default' : 'outline'}
                      className="h-24 flex-col gap-2"
                      onClick={() => setTheme(mode as 'light' | 'dark' | 'system')}
                    >
                      <span className="capitalize">{mode}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" onClick={() => { if (confirm('Are you sure?')) logout(); }}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPage;