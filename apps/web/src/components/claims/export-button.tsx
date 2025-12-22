'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { claimsApi } from '@/lib/api/claims';
import { toast } from 'sonner';
import type { ClaimStatus, DamageCategory } from '@poa/shared';

interface ExportButtonProps {
  filters?: {
    status?: ClaimStatus[];
    dateFrom?: string;
    dateTo?: string;
    vehicleId?: string;
    damageCategory?: DamageCategory;
  };
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    // Close the dropdown immediately
    setIsOpen(false);

    // Small delay to ensure dropdown closes before starting export
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsExporting(true);
    setExportFormat(format);

    try {
      const blob = await claimsApi.exportClaims(format, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';

      const date = new Date().toISOString().split('T')[0];
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      link.download = `schaeden-export-${date}.${extension}`;

      document.body.appendChild(link);
      link.click();

      // Delay cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

      toast.success(
        format === 'xlsx'
          ? 'Excel-Export erfolgreich'
          : 'CSV-Export erfolgreich'
      );
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="rounded-xl">
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportiere...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportieren
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('xlsx')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <span>Als Excel exportieren</span>
          {exportFormat === 'xlsx' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          <span>Als CSV exportieren</span>
          {exportFormat === 'csv' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
