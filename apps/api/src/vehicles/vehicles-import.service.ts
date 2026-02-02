import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleType } from '@poa/database';
import type {
  VehicleImportResult,
  VehicleImportRowError,
} from '@poa/shared';

const VEHICLE_TYPE_MAP: Record<string, VehicleType> = {
  PKW: VehicleType.CAR,
  LKW: VehicleType.TRUCK,
  TRANSPORTER: VehicleType.VAN,
  MOTORRAD: VehicleType.MOTORCYCLE,
  SONSTIGES: VehicleType.OTHER,
};

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const MAX_ROWS = 500;
const BATCH_SIZE = 50;

@Injectable()
export class VehiclesImportService {
  constructor(private prisma: PrismaService) {}

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POA - Point of Accident';
    workbook.created = new Date();

    // Sheet 1: Fahrzeuge
    const ws = workbook.addWorksheet('Fahrzeuge');

    ws.columns = [
      { header: 'Kennzeichen', key: 'licensePlate', width: 18 },
      { header: 'Fahrzeugtyp', key: 'vehicleType', width: 16 },
      { header: 'Marke', key: 'brand', width: 16 },
      { header: 'Modell', key: 'model', width: 16 },
      { header: 'Baujahr', key: 'year', width: 10 },
      { header: 'Farbe', key: 'color', width: 14 },
      { header: 'Interner Name', key: 'internalName', width: 18 },
      { header: 'FIN', key: 'vin', width: 22 },
      { header: 'HSN', key: 'hsn', width: 10 },
      { header: 'TSN', key: 'tsn', width: 10 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    // Example data row
    ws.addRow({
      licensePlate: 'B-AB-1234',
      vehicleType: 'PKW',
      brand: 'BMW',
      model: '3er',
      year: 2022,
      color: 'Schwarz',
      internalName: 'Pool-01',
      vin: 'WBA12345678901234',
      hsn: '0005',
      tsn: 'AAA',
    });

    // Data validation for vehicle type column (column B, rows 2-501)
    (ws as any).dataValidations.add('B2:B501', {
      type: 'list',
      allowBlank: true,
      formulae: ['"PKW,LKW,Transporter,Motorrad,Sonstiges"'],
      showErrorMessage: true,
      errorTitle: 'Ungueltiger Typ',
      error: 'Bitte waehlen Sie einen gueltigen Fahrzeugtyp.',
    });

    // Freeze header row
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Sheet 2: Gueltige Werte
    const refSheet = workbook.addWorksheet('Gueltige Werte');
    refSheet.columns = [
      { header: 'Fahrzeugtyp', key: 'type', width: 20 },
    ];

    const refHeader = refSheet.getRow(1);
    refHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    refHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    ['PKW', 'LKW', 'Transporter', 'Motorrad', 'Sonstiges'].forEach((t) => {
      refSheet.addRow({ type: t });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async parseAndValidate(
    buffer: Buffer,
    companyId: string,
  ): Promise<VehicleImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException(
        'Die Excel-Datei enthaelt kein gueltiges Arbeitsblatt.',
      );
    }

    const rowCount = worksheet.rowCount - 1; // exclude header
    if (rowCount <= 0) {
      throw new BadRequestException(
        'Die Excel-Datei enthaelt keine Datenzeilen.',
      );
    }
    if (rowCount > MAX_ROWS) {
      throw new BadRequestException(
        `Maximal ${MAX_ROWS} Zeilen erlaubt. Die Datei enthaelt ${rowCount} Datenzeilen.`,
      );
    }

    const errors: VehicleImportRowError[] = [];
    const validRows: {
      rowNum: number;
      data: {
        companyId: string;
        licensePlate: string;
        vehicleType: VehicleType;
        brand: string | null;
        model: string | null;
        year: number | null;
        color: string | null;
        internalName: string | null;
        vin: string | null;
        hsn: string | null;
        tsn: string | null;
        isActive: boolean;
      };
    }[] = [];

    const seenPlates = new Map<string, number>(); // plate -> first row number
    const currentYear = new Date().getFullYear();

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const cellVal = (col: number): string => {
        const cell = row.getCell(col);
        if (cell.value === null || cell.value === undefined) return '';
        return String(cell.value).trim();
      };

      const rowErrors: VehicleImportRowError[] = [];

      // Column 1: Kennzeichen (required)
      let licensePlate = cellVal(1).toUpperCase().replace(/\s/g, '-');
      if (!licensePlate) {
        rowErrors.push({
          row: rowNumber,
          field: 'Kennzeichen',
          value: '',
          message: 'Kennzeichen ist ein Pflichtfeld',
        });
      } else if (licensePlate.length > 20) {
        rowErrors.push({
          row: rowNumber,
          field: 'Kennzeichen',
          value: licensePlate,
          message: 'Kennzeichen darf maximal 20 Zeichen haben',
        });
      }

      // Duplicate within file
      if (licensePlate) {
        const firstRow = seenPlates.get(licensePlate);
        if (firstRow !== undefined) {
          rowErrors.push({
            row: rowNumber,
            field: 'Kennzeichen',
            value: licensePlate,
            message: `Doppeltes Kennzeichen (bereits in Zeile ${firstRow})`,
          });
        } else {
          seenPlates.set(licensePlate, rowNumber);
        }
      }

      // Column 2: Fahrzeugtyp
      const typeRaw = cellVal(2).toUpperCase();
      let vehicleType: VehicleType = VehicleType.CAR;
      if (typeRaw) {
        const mapped = VEHICLE_TYPE_MAP[typeRaw];
        if (mapped) {
          vehicleType = mapped;
        } else {
          rowErrors.push({
            row: rowNumber,
            field: 'Fahrzeugtyp',
            value: cellVal(2),
            message:
              'Ungueltiger Fahrzeugtyp. Erlaubt: PKW, LKW, Transporter, Motorrad, Sonstiges',
          });
        }
      }

      // Column 3: Marke
      const brand = cellVal(3) || null;
      if (brand && brand.length > 100) {
        rowErrors.push({
          row: rowNumber,
          field: 'Marke',
          value: brand,
          message: 'Marke darf maximal 100 Zeichen haben',
        });
      }

      // Column 4: Modell
      const model = cellVal(4) || null;
      if (model && model.length > 100) {
        rowErrors.push({
          row: rowNumber,
          field: 'Modell',
          value: model,
          message: 'Modell darf maximal 100 Zeichen haben',
        });
      }

      // Column 5: Baujahr
      let year: number | null = null;
      const yearRaw = cellVal(5);
      if (yearRaw) {
        const parsed = parseInt(yearRaw, 10);
        if (isNaN(parsed)) {
          rowErrors.push({
            row: rowNumber,
            field: 'Baujahr',
            value: yearRaw,
            message: 'Baujahr muss eine Zahl sein',
          });
        } else if (parsed < 1900 || parsed > currentYear + 1) {
          rowErrors.push({
            row: rowNumber,
            field: 'Baujahr',
            value: yearRaw,
            message: `Baujahr muss zwischen 1900 und ${currentYear + 1} liegen`,
          });
        } else {
          year = parsed;
        }
      }

      // Column 6: Farbe
      const color = cellVal(6) || null;
      if (color && color.length > 50) {
        rowErrors.push({
          row: rowNumber,
          field: 'Farbe',
          value: color,
          message: 'Farbe darf maximal 50 Zeichen haben',
        });
      }

      // Column 7: Interner Name
      const internalName = cellVal(7) || null;
      if (internalName && internalName.length > 100) {
        rowErrors.push({
          row: rowNumber,
          field: 'Interner Name',
          value: internalName,
          message: 'Interner Name darf maximal 100 Zeichen haben',
        });
      }

      // Column 8: FIN
      let vin: string | null = cellVal(8).toUpperCase() || null;
      if (vin) {
        if (vin.length !== 17) {
          rowErrors.push({
            row: rowNumber,
            field: 'FIN',
            value: vin,
            message: 'FIN muss genau 17 Zeichen haben',
          });
        } else if (!VIN_REGEX.test(vin)) {
          rowErrors.push({
            row: rowNumber,
            field: 'FIN',
            value: vin,
            message: 'Ungueltige FIN (nur A-Z ohne I/O/Q und 0-9 erlaubt)',
          });
        }
      }

      // Column 9: HSN
      const hsn = cellVal(9) || null;
      if (hsn && hsn.length > 10) {
        rowErrors.push({
          row: rowNumber,
          field: 'HSN',
          value: hsn,
          message: 'HSN darf maximal 10 Zeichen haben',
        });
      }

      // Column 10: TSN
      const tsn = cellVal(10) || null;
      if (tsn && tsn.length > 10) {
        rowErrors.push({
          row: rowNumber,
          field: 'TSN',
          value: tsn,
          message: 'TSN darf maximal 10 Zeichen haben',
        });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push({
          rowNum: rowNumber,
          data: {
            companyId,
            licensePlate,
            vehicleType,
            brand,
            model,
            year,
            color,
            internalName,
            vin,
            hsn,
            tsn,
            isActive: true,
          },
        });
      }
    });

    // Check duplicates against DB
    if (validRows.length > 0) {
      const plates = validRows.map((r) => r.data.licensePlate);
      const existing = await this.prisma.vehicle.findMany({
        where: {
          companyId,
          licensePlate: { in: plates },
        },
        select: { licensePlate: true },
      });

      const existingSet = new Set(existing.map((v) => v.licensePlate));
      const filteredRows = validRows.filter((r) => {
        if (existingSet.has(r.data.licensePlate)) {
          errors.push({
            row: r.rowNum,
            field: 'Kennzeichen',
            value: r.data.licensePlate,
            message: 'Fahrzeug mit diesem Kennzeichen existiert bereits',
          });
          return false;
        }
        return true;
      });

      // Batch insert
      const createdVehicles: { licensePlate: string; id: string }[] = [];

      for (let i = 0; i < filteredRows.length; i += BATCH_SIZE) {
        const batch = filteredRows.slice(i, i + BATCH_SIZE);
        const batchData = batch.map((r) => r.data);

        await this.prisma.vehicle.createMany({
          data: batchData,
          skipDuplicates: true,
        });

        // Retrieve created vehicles for this batch to get IDs
        const createdBatch = await this.prisma.vehicle.findMany({
          where: {
            companyId,
            licensePlate: { in: batchData.map((d) => d.licensePlate) },
          },
          select: { id: true, licensePlate: true },
        });

        createdVehicles.push(
          ...createdBatch.map((v) => ({
            licensePlate: v.licensePlate,
            id: v.id,
          })),
        );
      }

      // Sort errors by row number
      errors.sort((a, b) => a.row - b.row);

      return {
        totalRows: rowCount,
        successCount: createdVehicles.length,
        errorCount: errors.length,
        errors,
        createdVehicles,
      };
    }

    // All rows had errors
    errors.sort((a, b) => a.row - b.row);

    return {
      totalRows: rowCount,
      successCount: 0,
      errorCount: errors.length,
      errors,
      createdVehicles: [],
    };
  }
}
