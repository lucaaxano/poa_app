'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  usePolicies,
  useInsurers,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from '@/hooks/use-policies';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Policy, CreatePolicyData, UpdatePolicyData } from '@/lib/api/policies';

type PolicyFormData = {
  insurerId: string;
  policyNumber: string;
  coverageType: 'FLEET' | 'SINGLE_VEHICLE';
  pricingModel: 'QUOTA' | 'FLAT_RATE' | 'PER_VEHICLE' | '';
  annualPremium: string;
  deductible: string;
  quotaThreshold: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

export default function PoliciesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<Policy | null>(null);

  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: insurers, isLoading: insurersLoading } = useInsurers();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PolicyFormData>({
    defaultValues: {
      insurerId: '',
      policyNumber: '',
      coverageType: 'FLEET',
      pricingModel: '',
      annualPremium: '',
      deductible: '',
      quotaThreshold: '',
      validFrom: '',
      validTo: '',
      notes: '',
    },
  });

  const watchedInsurerId = watch('insurerId');
  const watchedCoverageType = watch('coverageType');

  const openCreateDialog = () => {
    reset({
      insurerId: '',
      policyNumber: '',
      coverageType: 'FLEET',
      pricingModel: '',
      annualPremium: '',
      deductible: '',
      quotaThreshold: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      notes: '',
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (policy: Policy) => {
    reset({
      insurerId: policy.insurerId,
      policyNumber: policy.policyNumber,
      coverageType: policy.coverageType,
      pricingModel: policy.pricingModel || '',
      annualPremium: policy.annualPremium?.toString() || '',
      deductible: policy.deductible?.toString() || '',
      quotaThreshold: policy.quotaThreshold?.toString() || '',
      validFrom: policy.validFrom.split('T')[0],
      validTo: policy.validTo?.split('T')[0] || '',
      notes: policy.notes || '',
    });
    setEditingPolicy(policy);
  };

  const closeDialogs = () => {
    setIsCreateDialogOpen(false);
    setEditingPolicy(null);
    reset();
  };

  const onSubmit = async (data: PolicyFormData) => {
    // Build payload, ensuring empty strings are converted to undefined
    const payload: CreatePolicyData | UpdatePolicyData = {
      insurerId: data.insurerId,
      policyNumber: data.policyNumber,
      coverageType: data.coverageType,
      validFrom: data.validFrom,
    };

    // Only include optional fields if they have values
    if (data.pricingModel) {
      payload.pricingModel = data.pricingModel as 'QUOTA' | 'FLAT_RATE' | 'PER_VEHICLE';
    }
    if (data.annualPremium && data.annualPremium !== '') {
      payload.annualPremium = parseFloat(data.annualPremium);
    }
    if (data.deductible && data.deductible !== '') {
      payload.deductible = parseFloat(data.deductible);
    }
    if (data.quotaThreshold && data.quotaThreshold !== '') {
      payload.quotaThreshold = parseFloat(data.quotaThreshold);
    }
    if (data.validTo && data.validTo !== '') {
      payload.validTo = data.validTo;
    }
    if (data.notes && data.notes !== '') {
      payload.notes = data.notes;
    }

    try {
      if (editingPolicy) {
        await updatePolicy.mutateAsync({ id: editingPolicy.id, data: payload });
        toast.success('Police erfolgreich aktualisiert');
      } else {
        await createPolicy.mutateAsync(payload as CreatePolicyData);
        toast.success('Police erfolgreich erstellt');
      }
      closeDialogs();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingPolicy) return;

    try {
      await deletePolicy.mutateAsync(deletingPolicy.id);
      toast.success('Police erfolgreich deaktiviert');
      setDeletingPolicy(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  const getCoverageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FLEET: 'Flottenversicherung',
      SINGLE_VEHICLE: 'Einzelfahrzeug',
    };
    return labels[type] || type;
  };

  const getPricingModelLabel = (model: string | null) => {
    if (!model) return '-';
    const labels: Record<string, string> = {
      QUOTA: 'Quotenmodell',
      FLAT_RATE: 'Pauschale',
      PER_VEHICLE: 'Pro Fahrzeug',
    };
    return labels[model] || model;
  };

  if (policiesLoading || insurersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Policen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Versicherungspolicen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Police
        </Button>
      </div>

      {policies && policies.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policennummer</TableHead>
                <TableHead>Versicherer</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Preismodell</TableHead>
                <TableHead>Jahrespraemie</TableHead>
                <TableHead>Gueltig ab</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">
                    {policy.policyNumber}
                  </TableCell>
                  <TableCell>{policy.insurer.name}</TableCell>
                  <TableCell>{getCoverageTypeLabel(policy.coverageType)}</TableCell>
                  <TableCell>{getPricingModelLabel(policy.pricingModel)}</TableCell>
                  <TableCell>{formatCurrency(policy.annualPremium)}</TableCell>
                  <TableCell>{formatDate(policy.validFrom)}</TableCell>
                  <TableCell>
                    <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                      {policy.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(policy)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPolicy(policy)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Keine Policen vorhanden</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Erstellen Sie Ihre erste Versicherungspolice
          </p>
          <Button className="mt-4" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Police
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingPolicy}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? 'Police bearbeiten' : 'Neue Police erstellen'}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy
                ? 'Aktualisieren Sie die Daten der Versicherungspolice'
                : 'Erfassen Sie eine neue Versicherungspolice'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurerId">Versicherer *</Label>
                <Select
                  value={watchedInsurerId}
                  onValueChange={(value) => setValue('insurerId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Versicherer waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {insurers?.map((insurer) => (
                      <SelectItem key={insurer.id} value={insurer.id}>
                        {insurer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.insurerId && (
                  <p className="text-sm text-destructive">{errors.insurerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyNumber">Policennummer *</Label>
                <Input
                  id="policyNumber"
                  {...register('policyNumber', {
                    required: 'Policennummer ist erforderlich',
                  })}
                  placeholder="z.B. POL-2024-001"
                />
                {errors.policyNumber && (
                  <p className="text-sm text-destructive">{errors.policyNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverageType">Deckungstyp *</Label>
                <Select
                  value={watchedCoverageType}
                  onValueChange={(value: 'FLEET' | 'SINGLE_VEHICLE') =>
                    setValue('coverageType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLEET">Flottenversicherung</SelectItem>
                    <SelectItem value="SINGLE_VEHICLE">Einzelfahrzeug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingModel">Preismodell</Label>
                <Select
                  value={watch('pricingModel')}
                  onValueChange={(value) => setValue('pricingModel', value as 'QUOTA' | 'FLAT_RATE' | 'PER_VEHICLE' | '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Preismodell waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUOTA">Quotenmodell</SelectItem>
                    <SelectItem value="FLAT_RATE">Pauschale</SelectItem>
                    <SelectItem value="PER_VEHICLE">Pro Fahrzeug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualPremium">Jahrespraemie (EUR)</Label>
                <Input
                  id="annualPremium"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('annualPremium')}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible">Selbstbeteiligung (EUR)</Label>
                <Input
                  id="deductible"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('deductible')}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotaThreshold">Quotenschwelle</Label>
                <Input
                  id="quotaThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('quotaThreshold')}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validFrom">Gueltig ab *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  {...register('validFrom', {
                    required: 'Startdatum ist erforderlich',
                  })}
                />
                {errors.validFrom && (
                  <p className="text-sm text-destructive">{errors.validFrom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Gueltig bis</Label>
                <Input id="validTo" type="date" {...register('validTo')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Optionale Bemerkungen zur Police"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createPolicy.isPending || updatePolicy.isPending}
              >
                {(createPolicy.isPending || updatePolicy.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingPolicy ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPolicy}
        onOpenChange={(open) => !open && setDeletingPolicy(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Police deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Moechten Sie die Police &quot;{deletingPolicy?.policyNumber}&quot; wirklich
              deaktivieren? Die Police kann spaeter wieder aktiviert werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePolicy.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deaktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
