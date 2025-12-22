import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimStatus, DamageCategory } from '@poa/database';
import * as ExcelJS from 'exceljs';

export interface ExportFilters {
  status?: ClaimStatus | ClaimStatus[];
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
  damageCategory?: DamageCategory;
}

const DAMAGE_CATEGORY_LABELS: Record<DamageCategory, string> = {
  LIABILITY: 'Haftpflicht',
  COMPREHENSIVE: 'Kasko',
  GLASS: 'Glas',
  WILDLIFE: 'Wild',
  PARKING: 'Parkschaden',
  THEFT: 'Diebstahl',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges',
};

const STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  APPROVED: 'Freigegeben',
  SENT: 'Gesendet',
  ACKNOWLEDGED: 'Bestätigt',
  CLOSED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
};

@Injectable()
export class ClaimsExportService {
  constructor(private prisma: PrismaService) {}

  async exportClaims(
    companyId: string,
    format: 'csv' | 'xlsx',
    filters: ExportFilters,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const claims = await this.getClaims(companyId, filters);

    if (format === 'csv') {
      return this.generateCsv(claims);
    } else {
      return this.generateXlsx(claims);
    }
  }

  private async getClaims(companyId: string, filters: ExportFilters) {
    const where: any = { companyId };

    // Status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Date filter
    if (filters.dateFrom || filters.dateTo) {
      where.accidentDate = {};
      if (filters.dateFrom) {
        where.accidentDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.accidentDate.lte = new Date(filters.dateTo);
      }
    }

    // Vehicle filter
    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    // Damage category filter
    if (filters.damageCategory) {
      where.damageCategory = filters.damageCategory;
    }

    return this.prisma.claim.findMany({
      where,
      include: {
        vehicle: {
          select: {
            licensePlate: true,
            brand: true,
            model: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        policy: {
          select: {
            policyNumber: true,
            insurer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { accidentDate: 'desc' },
    });
  }

  private generateCsv(claims: any[]): {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  } {
    const headers = [
      'Schadennummer',
      'Status',
      'Unfalldatum',
      'Unfallzeit',
      'Fahrzeug',
      'Kennzeichen',
      'Kategorie',
      'Beschreibung',
      'Unfallort',
      'Polizei',
      'Personenschaden',
      'Melder',
      'Fahrer',
      'Geschätzte Kosten',
      'Finale Kosten',
      'Versicherer',
      'Vertragsnummer',
      'Versicherer-Schadennummer',
      'Erstellt am',
    ];

    const rows = claims.map((claim) => [
      claim.claimNumber,
      STATUS_LABELS[claim.status as ClaimStatus] || claim.status,
      this.formatDate(claim.accidentDate),
      this.formatTime(claim.accidentTime),
      claim.vehicle
        ? `${claim.vehicle.brand || ''} ${claim.vehicle.model || ''}`.trim()
        : '',
      claim.vehicle?.licensePlate || '',
      DAMAGE_CATEGORY_LABELS[claim.damageCategory as DamageCategory] ||
        claim.damageCategory,
      (claim.description || '').replace(/[\n\r]/g, ' '),
      (claim.accidentLocation || '').replace(/[\n\r]/g, ' '),
      claim.policeInvolved ? 'Ja' : 'Nein',
      claim.hasInjuries ? 'Ja' : 'Nein',
      claim.reporter
        ? `${claim.reporter.firstName} ${claim.reporter.lastName}`
        : '',
      claim.driver ? `${claim.driver.firstName} ${claim.driver.lastName}` : '',
      this.formatCurrency(claim.estimatedCost),
      this.formatCurrency(claim.finalCost),
      claim.policy?.insurer?.name || '',
      claim.policy?.policyNumber || '',
      claim.insurerClaimNumber || '',
      this.formatDateTime(claim.createdAt),
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => this.escapeCsvField(String(cell || ''))).join(';'),
      ),
    ].join('\n');

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const buffer = Buffer.from(bom + csvContent, 'utf-8');

    const date = new Date().toISOString().split('T')[0];
    return {
      buffer,
      filename: `schaeden-export-${date}.csv`,
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  private async generateXlsx(claims: any[]): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POA - Point of Accident';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Schäden');

    // Define columns
    worksheet.columns = [
      { header: 'Schadennummer', key: 'claimNumber', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Unfalldatum', key: 'accidentDate', width: 12 },
      { header: 'Unfallzeit', key: 'accidentTime', width: 10 },
      { header: 'Fahrzeug', key: 'vehicle', width: 20 },
      { header: 'Kennzeichen', key: 'licensePlate', width: 12 },
      { header: 'Kategorie', key: 'category', width: 14 },
      { header: 'Beschreibung', key: 'description', width: 40 },
      { header: 'Unfallort', key: 'location', width: 25 },
      { header: 'Polizei', key: 'police', width: 8 },
      { header: 'Personenschaden', key: 'injuries', width: 14 },
      { header: 'Melder', key: 'reporter', width: 20 },
      { header: 'Fahrer', key: 'driver', width: 20 },
      { header: 'Geschätzte Kosten', key: 'estimatedCost', width: 16 },
      { header: 'Finale Kosten', key: 'finalCost', width: 14 },
      { header: 'Versicherer', key: 'insurer', width: 20 },
      { header: 'Vertragsnummer', key: 'policyNumber', width: 15 },
      { header: 'Versicherer-Nr.', key: 'insurerClaimNumber', width: 15 },
      { header: 'Erstellt am', key: 'createdAt', width: 18 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    claims.forEach((claim) => {
      worksheet.addRow({
        claimNumber: claim.claimNumber,
        status: STATUS_LABELS[claim.status as ClaimStatus] || claim.status,
        accidentDate: this.formatDate(claim.accidentDate),
        accidentTime: this.formatTime(claim.accidentTime),
        vehicle: claim.vehicle
          ? `${claim.vehicle.brand || ''} ${claim.vehicle.model || ''}`.trim()
          : '',
        licensePlate: claim.vehicle?.licensePlate || '',
        category:
          DAMAGE_CATEGORY_LABELS[claim.damageCategory as DamageCategory] ||
          claim.damageCategory,
        description: claim.description || '',
        location: claim.accidentLocation || '',
        police: claim.policeInvolved ? 'Ja' : 'Nein',
        injuries: claim.hasInjuries ? 'Ja' : 'Nein',
        reporter: claim.reporter
          ? `${claim.reporter.firstName} ${claim.reporter.lastName}`
          : '',
        driver: claim.driver
          ? `${claim.driver.firstName} ${claim.driver.lastName}`
          : '',
        estimatedCost: claim.estimatedCost
          ? Number(claim.estimatedCost)
          : null,
        finalCost: claim.finalCost ? Number(claim.finalCost) : null,
        insurer: claim.policy?.insurer?.name || '',
        policyNumber: claim.policy?.policyNumber || '',
        insurerClaimNumber: claim.insurerClaimNumber || '',
        createdAt: this.formatDateTime(claim.createdAt),
      });
    });

    // Format currency columns
    worksheet.getColumn('estimatedCost').numFmt = '#,##0.00 €';
    worksheet.getColumn('finalCost').numFmt = '#,##0.00 €';

    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `S${claims.length + 1}`,
    };

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const date = new Date().toISOString().split('T')[0];

    return {
      buffer,
      filename: `schaeden-export-${date}.xlsx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatTime(time: Date | string | null): string {
    if (!time) return '';
    const d = new Date(time);
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${this.formatDate(d)} ${this.formatTime(d)}`;
  }

  private formatCurrency(value: any): string {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private escapeCsvField(field: string): string {
    // Escape double quotes by doubling them and wrap field if needed
    if (field.includes(';') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
