'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { vehiclesApi } from '@/lib/api/vehicles';
import { useImportVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import type { VehicleImportResult } from '@poa/shared';

type Phase = 'idle' | 'uploading' | 'result';

interface VehicleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleImportDialog({ open, onOpenChange }: VehicleImportDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<VehicleImportResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportVehicles();

  const handleClose = () => {
    if (phase === 'uploading') return; // prevent closing during upload
    setPhase('idle');
    setResult(null);
    onOpenChange(false);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await vehiclesApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      link.download = 'fahrzeuge-import-vorlage.xlsx';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);
      toast.success('Vorlage heruntergeladen');
    } catch {
      toast.error('Fehler beim Herunterladen der Vorlage');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Client-side checks
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Bitte waehlen Sie eine .xlsx Datei aus.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei darf maximal 5 MB gross sein.');
      return;
    }

    setPhase('uploading');

    try {
      const importResult = await importMutation.mutateAsync(file);
      setResult(importResult);
      setPhase('result');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Import fehlgeschlagen';
      toast.error(message);
      setPhase('idle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fahrzeuge importieren</DialogTitle>
          <DialogDescription>
            Laden Sie mehrere Fahrzeuge gleichzeitig per Excel-Datei hoch.
          </DialogDescription>
        </DialogHeader>

        {/* Phase: idle */}
        {phase === 'idle' && (
          <div className="space-y-6 py-2">
            {/* Step 1: Download template */}
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium">Vorlage herunterladen</p>
                  <p className="text-sm text-muted-foreground">
                    Laden Sie die Excel-Vorlage herunter und fuellen Sie sie mit Ihren
                    Fahrzeugdaten aus.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl ml-11"
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Vorlage herunterladen
              </Button>
            </div>

            {/* Step 2: Upload file */}
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium">Ausgefuellte Datei hochladen</p>
                  <p className="text-sm text-muted-foreground">
                    Waehlen Sie die ausgefuellte Excel-Datei aus (max. 500 Zeilen, max. 5 MB).
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                className="rounded-xl ml-11"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Datei auswaehlen
              </Button>
            </div>
          </div>
        )}

        {/* Phase: uploading */}
        {phase === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Fahrzeuge werden importiert...
            </p>
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && result && (
          <div className="space-y-4 py-2">
            {/* Success banner */}
            {result.successCount > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-medium text-green-800">
                  {result.successCount} von {result.totalRows} Fahrzeug(en)
                  erfolgreich importiert
                </p>
              </div>
            )}

            {/* Error banner if all failed */}
            {result.successCount === 0 && result.errorCount > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-sm font-medium text-red-800">
                  Import fehlgeschlagen. Alle {result.totalRows} Zeile(n) enthalten
                  Fehler.
                </p>
              </div>
            )}

            {/* Partial error banner */}
            {result.successCount > 0 && result.errorCount > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <FileSpreadsheet className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  {result.errorCount} Zeile(n) konnten nicht importiert werden.
                </p>
              </div>
            )}

            {/* Error table */}
            {result.errors.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Zeile</TableHead>
                      <TableHead className="w-28">Feld</TableHead>
                      <TableHead className="w-28">Wert</TableHead>
                      <TableHead>Fehler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((err, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{err.row}</TableCell>
                        <TableCell className="text-sm">{err.field}</TableCell>
                        <TableCell className="text-sm font-mono truncate max-w-[120px]">
                          {err.value || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-red-600">{err.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button className="rounded-xl" onClick={handleClose}>
                Schliessen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
