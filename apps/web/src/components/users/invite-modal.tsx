'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInviteUser } from '@/hooks/use-users';
import { UserRole } from '@poa/shared';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';

const inviteSchema = z.object({
  email: z.string().email('Ungueltige E-Mail-Adresse'),
  role: z.enum(['EMPLOYEE', 'COMPANY_ADMIN'] as const),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleOptions = [
  { value: 'EMPLOYEE' as const, label: 'Mitarbeiter', description: 'Kann Schaeden melden' },
  { value: 'COMPANY_ADMIN' as const, label: 'Administrator', description: 'Vollzugriff auf alle Funktionen' },
];

export function InviteModal() {
  const [open, setOpen] = useState(false);
  const inviteUser = useInviteUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'EMPLOYEE',
    },
  });

  const role = watch('role');

  const onSubmit = async (data: InviteFormData) => {
    try {
      await inviteUser.mutateAsync({
        email: data.email,
        role: data.role as UserRole,
      });
      toast.success('Einladung erfolgreich gesendet');
      reset();
      setOpen(false);
    } catch (error: unknown) {
      // Use getErrorMessage to extract the actual error message from the API response
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <UserPlus className="mr-2 h-4 w-4" />
          Benutzer einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Benutzer einladen</DialogTitle>
          <DialogDescription>
            Senden Sie eine Einladung per E-Mail an einen neuen Mitarbeiter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="name@beispiel.de"
                className="rounded-xl"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value as 'EMPLOYEE' | 'COMPANY_ADMIN')}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Rolle waehlen" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Abbrechen
            </Button>
            <Button type="submit" className="rounded-xl" disabled={inviteUser.isPending}>
              {inviteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Einladung senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
