'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  MessageSquare,
  Clock,
  FileText,
  Car,
  MapPin,
  AlertTriangle,
  User,
  Loader2,
  Edit,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Video,
  File,
  Trash2,
  X,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useClaim,
  useApproveClaim,
  useRejectClaim,
  useSubmitClaim,
  useSendClaim,
  useAddClaimComment,
  useUploadAttachment,
  useDeleteAttachment,
  useUpdateClaim,
} from '@/hooks/use-claims';
import { usePolicies } from '@/hooks/use-policies';
import { useAuthStore } from '@/stores/auth-store';
import { ClaimStatus, DamageCategory, ClaimEventType, UserRole } from '@poa/shared';

const statusLabels: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'Entwurf',
  [ClaimStatus.SUBMITTED]: 'Eingereicht',
  [ClaimStatus.APPROVED]: 'Genehmigt',
  [ClaimStatus.SENT]: 'Gesendet',
  [ClaimStatus.ACKNOWLEDGED]: 'Bestätigt',
  [ClaimStatus.CLOSED]: 'Abgeschlossen',
  [ClaimStatus.REJECTED]: 'Abgelehnt',
};

const statusColors: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [ClaimStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [ClaimStatus.APPROVED]: 'bg-green-100 text-green-700',
  [ClaimStatus.SENT]: 'bg-purple-100 text-purple-700',
  [ClaimStatus.ACKNOWLEDGED]: 'bg-teal-100 text-teal-700',
  [ClaimStatus.CLOSED]: 'bg-gray-100 text-gray-700',
  [ClaimStatus.REJECTED]: 'bg-red-100 text-red-700',
};

const damageCategoryLabels: Record<DamageCategory, string> = {
  [DamageCategory.LIABILITY]: 'Haftpflicht',
  [DamageCategory.COMPREHENSIVE]: 'Kasko',
  [DamageCategory.GLASS]: 'Glasschaden',
  [DamageCategory.WILDLIFE]: 'Wildschaden',
  [DamageCategory.PARKING]: 'Parkschaden',
  [DamageCategory.THEFT]: 'Diebstahl',
  [DamageCategory.VANDALISM]: 'Vandalismus',
  [DamageCategory.OTHER]: 'Sonstiges',
};

const eventTypeLabels: Record<ClaimEventType, string> = {
  [ClaimEventType.CREATED]: 'Erstellt',
  [ClaimEventType.UPDATED]: 'Aktualisiert',
  [ClaimEventType.STATUS_CHANGED]: 'Status geändert',
  [ClaimEventType.EMAIL_SENT]: 'E-Mail gesendet',
  [ClaimEventType.COMMENT_ADDED]: 'Kommentar hinzugefügt',
  [ClaimEventType.ATTACHMENT_ADDED]: 'Anhang hinzugefügt',
  [ClaimEventType.ATTACHMENT_REMOVED]: 'Anhang entfernt',
  [ClaimEventType.ASSIGNED]: 'Zugewiesen',
};

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const { user } = useAuthStore();
  const { data: claim, isLoading, error } = useClaim(claimId);

  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();
  const submitMutation = useSubmitClaim();
  const sendMutation = useSendClaim();
  const addCommentMutation = useAddClaimComment();
  const updateMutation = useUpdateClaim();
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();
  const { data: policies } = usePolicies();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.COMPANY_ADMIN || user?.role === UserRole.SUPERADMIN;
  const isReporter = user?.id === claim?.reporter?.id;

  const canApprove = isAdmin && claim?.status === ClaimStatus.SUBMITTED;
  const canReject = isAdmin && claim?.status === ClaimStatus.SUBMITTED;
  const canSubmit = (isAdmin || isReporter) && claim?.status === ClaimStatus.DRAFT;
  const hasPolicyWithInsurer = !!(claim?.policy && claim.policy.insurer);
  const canSend = isAdmin && claim?.status === ClaimStatus.APPROVED;
  const canSendReady = canSend && hasPolicyWithInsurer;
  const canEdit = (isAdmin || isReporter) &&
    (claim?.status === ClaimStatus.DRAFT || claim?.status === ClaimStatus.REJECTED);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(claimId);
      toast.success('Schaden erfolgreich genehmigt');
    } catch (error) {
      console.error('Error approving claim:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: claimId, reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason('');
      toast.success('Schaden abgelehnt');
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(claimId);
      toast.success('Schaden eingereicht');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleAssignPolicy = async (policyId: string) => {
    try {
      await updateMutation.mutateAsync({ id: claimId, data: { policyId } });
      toast.success('Police zugewiesen');
    } catch (error) {
      console.error('Error assigning policy:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync(claimId);
      toast.success('Schaden erfolgreich an Versicherung gesendet');
    } catch (error) {
      console.error('Error sending claim to insurer:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ id: claimId, content: newComment });
      setNewComment('');
      toast.success('Kommentar hinzugefügt');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({ id: claimId, file });
        toast.success(`${file.name} hochgeladen`);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Anhang wirklich löschen?')) return;
    try {
      await deleteMutation.mutateAsync({ claimId, attachmentId });
      toast.success('Anhang gelöscht');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [claimId]);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'IMAGE') return <ImageIcon className="h-5 w-5" />;
    if (fileType === 'VIDEO') return <Video className="h-5 w-5" />;
    if (fileType === 'PDF') return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  const formatDateTime = (dateString: string | Date) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 mb-4">Schaden nicht gefunden</p>
        <Link href={'/claims' as Route}>
          <Button>Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href={'/claims' as Route}>
            <Button variant="ghost" size="icon" className="rounded-xl mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {claim.claimNumber}
              </h1>
              <Badge className={statusColors[claim.status as ClaimStatus]} variant="secondary">
                {statusLabels[claim.status as ClaimStatus]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Erstellt am {formatDateTime(claim.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/claims/${claimId}/edit` as Route}>
              <Button variant="outline" className="rounded-xl">
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Button>
            </Link>
          )}
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="rounded-xl"
            >
              {submitMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Einreichen
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="rounded-xl bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Genehmigen
            </Button>
          )}
          {canReject && (
            <Button
              onClick={() => setRejectDialogOpen(true)}
              variant="destructive"
              className="rounded-xl"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Ablehnen
            </Button>
          )}
          {canSend && (
            <div className="flex items-center gap-2">
              {!hasPolicyWithInsurer && (
                <Select
                  onValueChange={handleAssignPolicy}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[250px] rounded-xl">
                    <SelectValue placeholder="Police zuweisen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(policies?.filter((p) => p.isActive) ?? []).map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.policyNumber} - {policy.insurer?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !hasPolicyWithInsurer}
                className="rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                An Versicherung senden
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason */}
      {claim.status === ClaimStatus.REJECTED && claim.rejectionReason && (
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Ablehnungsgrund</p>
                <p className="text-red-700">{claim.rejectionReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="details" className="rounded-lg">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="attachments" className="rounded-lg">
            <Paperclip className="mr-2 h-4 w-4" />
            Anhänge ({claim.attachments?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">
            <Clock className="mr-2 h-4 w-4" />
            Verlauf
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-lg">
            <MessageSquare className="mr-2 h-4 w-4" />
            Kommentare ({claim.comments?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {/* Fahrzeug */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Fahrzeug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Kennzeichen</p>
                  <p className="font-medium">{claim.vehicle?.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fahrzeug</p>
                  <p className="font-medium">
                    {claim.vehicle?.brand} {claim.vehicle?.model}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unfalldetails */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Unfalldetails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Unfalldatum</p>
                  <p className="font-medium">{formatDate(claim.accidentDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unfallzeit</p>
                  <p className="font-medium">
                    {claim.accidentTime
                      ? format(new Date(claim.accidentTime), 'HH:mm')
                      : '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Unfallort</p>
                  <p className="font-medium">{claim.accidentLocation || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Schadenart</p>
                  <p className="font-medium">
                    {damageCategoryLabels[claim.damageCategory as DamageCategory]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unterkategorie</p>
                  <p className="font-medium">{claim.damageSubcategory || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geschaetzte Kosten</p>
                  <p className="font-medium">{formatCurrency(claim.estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finale Kosten</p>
                  <p className="font-medium">{formatCurrency(claim.finalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beschreibung */}
          {claim.description && (
            <Card className="rounded-2xl border shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Beschreibung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{claim.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Zusätzliche Infos */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Zusätzliche Informationen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Polizei involviert</p>
                  <p className="font-medium">{claim.policeInvolved ? 'Ja' : 'Nein'}</p>
                </div>
                {claim.policeInvolved && claim.policeFileNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Aktenzeichen</p>
                    <p className="font-medium">{claim.policeFileNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Personenschaden</p>
                  <p className="font-medium">{claim.hasInjuries ? 'Ja' : 'Nein'}</p>
                </div>
                {claim.hasInjuries && claim.injuryDetails && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Details zum Personenschaden</p>
                    <p className="font-medium">{claim.injuryDetails}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Melder */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Melder & Fahrer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Gemeldet von</p>
                  <p className="font-medium">
                    {claim.reporter?.firstName} {claim.reporter?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{claim.reporter?.email}</p>
                </div>
                {claim.driver && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fahrer</p>
                    <p className="font-medium">
                      {claim.driver?.firstName} {claim.driver?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{claim.driver?.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anhänge
              </CardTitle>
              <CardDescription>
                Fotos, Videos und Dokumente zum Schaden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="font-medium">
                        Dateien hier ablegen oder klicken zum Auswählen
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bilder, Videos und PDFs bis 20 MB
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Attachments Grid */}
              {claim.attachments && claim.attachments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {claim.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="group relative rounded-xl border overflow-hidden bg-muted/50"
                    >
                      {/* Preview */}
                      {attachment.fileType === 'IMAGE' ? (
                        <div
                          className="aspect-square cursor-pointer"
                          onClick={() => setPreviewImage(attachment.fileUrl)}
                        >
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-muted">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary"
                          >
                            {getFileIcon(attachment.fileType)}
                            <span className="text-xs text-center px-2 truncate max-w-full">
                              {attachment.fileName}
                            </span>
                          </a>
                        </div>
                      )}

                      {/* Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{attachment.fileName}</p>
                        <p className="text-white/70 text-xs">{formatFileSize(attachment.fileSize)}</p>
                      </div>

                      {/* Delete Button */}
                      {(isAdmin || isReporter) && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Noch keine Anhänge vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Verlauf</CardTitle>
              <CardDescription>
                Alle Änderungen und Ereignisse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claim.events && claim.events.length > 0 ? (
                <div className="space-y-4">
                  {claim.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {eventTypeLabels[event.eventType as ClaimEventType] || event.eventType}
                        </p>
                        {event.newValue && (
                          <p className="text-sm text-muted-foreground">
                            {JSON.stringify(event.newValue)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(event.createdAt)}
                          {(event as any).user && ` von ${(event as any).user.firstName} ${(event as any).user.lastName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Keine Ereignisse vorhanden</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Kommentare</CardTitle>
              <CardDescription>
                Interne Kommunikation zum Schaden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              {claim.comments && claim.comments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {claim.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(comment.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">Noch keine Kommentare</p>
              )}

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Kommentar schreiben..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="rounded-xl"
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Kommentar senden
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schaden ablehnen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen Grund für die Ablehnung an.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ablehnungsgrund..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {previewImage && (
            <img
              src={previewImage}
              alt="Vorschau"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
