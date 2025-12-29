'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Car, MapPin, Calendar, FileText } from 'lucide-react';

interface ExtractedClaimData {
  vehicleId?: string;
  vehicleLicensePlate?: string;
  accidentDate?: string;
  accidentTime?: string;
  accidentLocation?: string;
  damageCategory?: string;
  description?: string;
  policeInvolved?: boolean;
  hasInjuries?: boolean;
}

interface ChatSummaryProps {
  data: Partial<ExtractedClaimData>;
}

const damageCategoryLabels: Record<string, string> = {
  LIABILITY: 'Haftpflichtschaden',
  COMPREHENSIVE: 'Kaskoschaden',
  GLASS: 'Glasschaden',
  WILDLIFE: 'Wildschaden',
  PARKING: 'Parkschaden',
  THEFT: 'Diebstahl',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges',
};

export function ChatSummary({ data }: ChatSummaryProps) {
  const hasData =
    data.vehicleLicensePlate ||
    data.accidentDate ||
    data.accidentLocation ||
    data.damageCategory;

  if (!hasData) {
    return null;
  }

  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-5 w-5 text-primary" />
          Erfasste Daten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {data.vehicleLicensePlate && (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Fahrzeug:</span>
            <span>{data.vehicleLicensePlate}</span>
          </div>
        )}

        {data.accidentDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Datum:</span>
            <span>
              {data.accidentDate}
              {data.accidentTime && ` um ${data.accidentTime} Uhr`}
            </span>
          </div>
        )}

        {data.accidentLocation && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Ort:</span>
            <span>{data.accidentLocation}</span>
          </div>
        )}

        {data.damageCategory && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Schadenart:</span>
            <Badge variant="secondary" className="rounded-lg">
              {damageCategoryLabels[data.damageCategory] || data.damageCategory}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {data.policeInvolved && (
            <Badge variant="outline" className="rounded-lg text-xs">
              Polizei involviert
            </Badge>
          )}
          {data.hasInjuries && (
            <Badge variant="destructive" className="rounded-lg text-xs">
              Personenschaden
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
