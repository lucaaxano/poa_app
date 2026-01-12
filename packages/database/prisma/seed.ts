import { PrismaClient, UserRole, VehicleType, CoverageType, PricingModel, ClaimStatus, DamageCategory, ClaimEventType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS - Relative Date Calculation
// ============================================

/**
 * Returns a date that is N days ago from today
 * This ensures demo data stays "fresh" relative to current date
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns a random date between minDays and maxDays ago
 */
function randomDaysAgo(minDays: number, maxDays: number): Date {
  const days = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  return daysAgo(days);
}

/**
 * Returns a random element from an array
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random number between min and max, rounded to 2 decimal places
 */
function randomCost(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Returns a random time of day as a Date object
 */
function randomTime(): Date {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  return new Date(`1970-01-01T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
}

/**
 * Generates a random GPS coordinate near Berlin
 */
function randomBerlinCoords(): { lat: number; lng: number } {
  // Berlin area: roughly 52.3-52.7 lat, 13.1-13.7 lng
  return {
    lat: 52.3 + Math.random() * 0.4,
    lng: 13.1 + Math.random() * 0.6,
  };
}

// ============================================
// VEHICLE DATA - German Brands & Models
// ============================================

const carData = [
  { brand: 'Volkswagen', models: ['Golf', 'Passat', 'Tiguan', 'ID.4', 'Polo', 'T-Roc'] },
  { brand: 'BMW', models: ['3er', '5er', 'X3', 'X5', '1er', 'X1'] },
  { brand: 'Audi', models: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'e-tron'] },
  { brand: 'Mercedes-Benz', models: ['C-Klasse', 'E-Klasse', 'GLA', 'GLC', 'A-Klasse'] },
  { brand: 'Ford', models: ['Focus', 'Fiesta', 'Kuga', 'Puma', 'Mondeo'] },
  { brand: 'Opel', models: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Grandland'] },
  { brand: 'Skoda', models: ['Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Fabia'] },
];

const vanData = [
  { brand: 'Mercedes-Benz', models: ['Sprinter', 'Vito', 'Citan'] },
  { brand: 'Volkswagen', models: ['Crafter', 'Transporter', 'Caddy'] },
  { brand: 'Ford', models: ['Transit', 'Transit Custom', 'Transit Connect'] },
  { brand: 'Iveco', models: ['Daily', 'Daily 35S'] },
  { brand: 'Fiat', models: ['Ducato', 'Talento', 'Doblo'] },
  { brand: 'Renault', models: ['Master', 'Trafic', 'Kangoo'] },
];

const truckData = [
  { brand: 'MAN', models: ['TGX', 'TGS', 'TGM', 'TGL'] },
  { brand: 'Mercedes-Benz', models: ['Actros', 'Arocs', 'Atego'] },
  { brand: 'Volvo', models: ['FH', 'FM', 'FMX', 'FE'] },
  { brand: 'Scania', models: ['R500', 'S500', 'P-Serie', 'G-Serie'] },
  { brand: 'DAF', models: ['XF', 'XG', 'CF', 'LF'] },
  { brand: 'Iveco', models: ['S-Way', 'Eurocargo', 'Stralis'] },
];

const motorcycleData = [
  { brand: 'BMW', models: ['R 1250 GS', 'F 900 R', 'S 1000 RR'] },
  { brand: 'Honda', models: ['Africa Twin', 'CB650R', 'NC750X'] },
  { brand: 'Yamaha', models: ['MT-07', 'Tracer 9', 'XSR700'] },
];

// ============================================
// CLAIM DATA - Descriptions & Locations
// ============================================

const claimDescriptions: Record<DamageCategory, string[]> = {
  [DamageCategory.PARKING]: [
    'Beim Ausparken auf dem Kundenparkplatz wurde das Fahrzeug von einem unbekannten Fahrzeug touchiert. Lackschaden an der hinteren Stossstange.',
    'Parkrempler im Parkhaus. Unbekannter Verursacher. Delle und Kratzer an der Fahrertuer.',
    'Beim Einparken Poller uebersehen. Frontschuerze beschaedigt.',
    'Fahrzeug wurde auf dem Firmenparkplatz angefahren. Seitlicher Blechschaden.',
    'Rangieren auf engem Hof. Spiegel an Hausecke abgefahren.',
  ],
  [DamageCategory.LIABILITY]: [
    'Auffahrunfall an roter Ampel. Gegner bremste ueberraschend, leichter Aufprall. Blechschaden an beiden Fahrzeugen.',
    'Spurwechsel auf der Autobahn, anderes Fahrzeug nicht gesehen. Seitlicher Kontakt.',
    'Vorfahrt missachtet. Zusammenstoss im Kreuzungsbereich.',
    'Beim Abbiegen Radfahrer uebersehen. Leichter Kontakt, keine Verletzungen.',
    'Rueckwaertsfahren aus Grundstueck. Kollision mit vorbeifahrendem PKW.',
  ],
  [DamageCategory.COMPREHENSIVE]: [
    'Container beim Beladen verrutscht und Aufbau beschaedigt.',
    'Hagelschaden nach schwerem Unwetter. Zahlreiche Dellen auf Dach und Motorhaube.',
    'Ueberschwemmung auf Firmenhof. Innenraum und Elektronik beschaedigt.',
    'Sturmschaden durch herabfallenden Ast. Frontscheibe und Motorhaube beschaedigt.',
    'Brand in Nachbarfahrzeug. Hitzeschaeden an Lack und Kunststoffteilen.',
  ],
  [DamageCategory.GLASS]: [
    'Steinschlag auf der Autobahn. Frontscheibe gerissen.',
    'Unbekannter Gegenstand traf Windschutzscheibe. Stern mit Riss.',
    'Heckscheibe durch Ladungssicherungsproblem gebrochen.',
    'Seitenscheibe durch Steinwurf von Bruecke beschaedigt.',
    'Frontscheibe durch Kiesspritzer vom Vordermann beschaedigt.',
  ],
  [DamageCategory.WILDLIFE]: [
    'Wildunfall mit Reh auf der Landstrasse. Frontschaden am Fahrzeug.',
    'Wildschwein ueberquerte nachts die Autobahn. Ausweichmanoever, Leitplanke touchiert.',
    'Zusammenstoss mit Fuchs. Schaden an Frontschuerze und Kuehler.',
    'Wildunfall auf der B96. Hirsch sprang auf die Fahrbahn.',
    'Nachts in waldreichem Gebiet. Damwild erfasst. Totalschaden.',
  ],
  [DamageCategory.THEFT]: [
    'Einbruch in Transporter. Werkzeuge und Navigationsgeraet gestohlen.',
    'Diebstahl von Katalysator. Fahrzeug nicht mehr fahrbereit.',
    'Versuchter Diebstahl. Tuerschloss und Lenkradsperre beschaedigt.',
    'Komplettdiebstahl des Fahrzeugs vom Firmenhof.',
    'Aufbruch ueber Nacht. Elektronik und persoenliche Gegenstaende entwendet.',
  ],
  [DamageCategory.VANDALISM]: [
    'Fahrzeug ueber Nacht geparkt, am naechsten Morgen Kratzer und eingeschlagener Spiegel.',
    'Graffiti auf der Fahrzeugseite. Professionelle Reinigung erforderlich.',
    'Reifen zerstochen. Alle vier Reifen beschaedigt.',
    'Antenne abgebrochen, Scheibenwischer verbogen.',
    'Unbekannte haben Lack zerkratzt. Grossflaechige Beschaedigung.',
  ],
  [DamageCategory.OTHER]: [
    'Motorschaden nach Oelverlust. Ursache unklar.',
    'Fahrzeug in Senke eingebrochen. Unterbodenschaden.',
    'Technischer Defekt fuehrte zu Rauchentwicklung. Motorraum beschaedigt.',
    'Reifenplatzer auf der Autobahn. Schaden am Radkasten.',
    'Ladungsschaden durch mangelnde Sicherung der Fracht.',
  ],
};

const berlinLocations = [
  'A100, Ausfahrt Spandauer Damm, Berlin',
  'Kreuzung Friedrichstrasse/Unter den Linden, Berlin',
  'Berliner Ring A10, km 78',
  'Alexanderplatz, Berlin-Mitte',
  'Potsdamer Platz, Berlin',
  'Kurfuerstendamm 120, Berlin',
  'Tempelhofer Damm, Berlin-Tempelhof',
  'Frankfurter Allee, Berlin-Friedrichshain',
  'Prenzlauer Allee, Berlin-Prenzlauer Berg',
  'Karl-Marx-Strasse, Berlin-Neukoelln',
  'A113, Ausfahrt Schoenefeld',
  'B96a, Berlin-Treptow',
  'Marzahner Promenade, Berlin-Marzahn',
  'Siemensstadt, Berlin-Spandau',
  'Muehlenstrasse, Berlin-Friedrichshain',
];

const germanLocations = [
  'A2, km 145, bei Magdeburg',
  'B1, km 45, Brandenburg',
  'A9, Raststatte Frankenwald',
  'A7, Elbtunnel Hamburg',
  'A3, Ausfahrt Koeln-Ost',
  'B27, bei Stuttgart',
  'A8, Ausfahrt Augsburg-West',
  'A4, bei Dresden',
  'A1, km 320, bei Bremen',
  'B10, bei Karlsruhe',
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding database...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.emailLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.brokerCompanyLink.deleteMany();
  await prisma.claimComment.deleteMany();
  await prisma.claimEvent.deleteMany();
  await prisma.claimAttachment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.insurer.deleteMany();
  await prisma.company.deleteMany();

  console.log('Cleaned existing data');

  // Create Insurers (German insurance companies)
  const insurers = await Promise.all([
    prisma.insurer.create({
      data: {
        name: 'Allianz Versicherung',
        claimsEmail: 'schaden@allianz.de',
        contactPhone: '+49 800 4 100 101',
        website: 'https://www.allianz.de',
        isActive: true,
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'HUK-COBURG',
        claimsEmail: 'schaden@huk.de',
        contactPhone: '+49 800 2 153 153',
        website: 'https://www.huk.de',
        isActive: true,
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'DEVK',
        claimsEmail: 'schaden@devk.de',
        contactPhone: '+49 800 4 757 757',
        website: 'https://www.devk.de',
        isActive: true,
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'AXA Versicherung',
        claimsEmail: 'kfz-schaden@axa.de',
        contactPhone: '+49 800 9 30 30 30',
        website: 'https://www.axa.de',
        isActive: true,
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'Zurich Versicherung',
        claimsEmail: 'schaden@zurich.de',
        contactPhone: '+49 800 6 86 86 86',
        website: 'https://www.zurich.de',
        isActive: true,
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'R+V Versicherung',
        claimsEmail: 'kfz-schaden@ruv.de',
        contactPhone: '+49 800 533 1111',
        website: 'https://www.ruv.de',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${insurers.length} insurers`);

  // ============================================
  // DEMO TRANSPORT GmbH - Main Demo Company
  // 85 Vehicles, 120 Claims
  // ============================================

  const demoCompany = await prisma.company.create({
    data: {
      name: 'Demo Transport GmbH',
      address: 'Musterstrasse 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      phone: '+49 30 123456789',
      website: 'https://demo-transport.de',
      numEmployees: 100,
      numVehicles: 85,
    },
  });

  console.log(`Created main demo company: ${demoCompany.name}`);

  // Create Users for Demo Transport (minimal but functional)
  const demoPassword = await hashPassword('Demo123!');

  const adminUser = await prisma.user.create({
    data: {
      companyId: demoCompany.id,
      email: 'admin@demo-transport.de',
      passwordHash: demoPassword,
      role: UserRole.COMPANY_ADMIN,
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49 170 1234567',
      position: 'Fuhrparkleiter',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const employeeUsers = await Promise.all([
    prisma.user.create({
      data: {
        companyId: demoCompany.id,
        email: 'fahrer1@demo-transport.de',
        passwordHash: demoPassword,
        role: UserRole.EMPLOYEE,
        firstName: 'Hans',
        lastName: 'Schmidt',
        phone: '+49 170 2345678',
        position: 'Fahrer',
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        companyId: demoCompany.id,
        email: 'fahrer2@demo-transport.de',
        passwordHash: demoPassword,
        role: UserRole.EMPLOYEE,
        firstName: 'Peter',
        lastName: 'Mueller',
        phone: '+49 170 3456789',
        position: 'Fahrer',
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        companyId: demoCompany.id,
        email: 'fahrer3@demo-transport.de',
        passwordHash: demoPassword,
        role: UserRole.EMPLOYEE,
        firstName: 'Klaus',
        lastName: 'Weber',
        phone: '+49 170 4567890',
        position: 'Fahrer',
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  const allDemoUsers = [adminUser, ...employeeUsers];
  console.log(`Created ${allDemoUsers.length} users for Demo Transport`);

  // ============================================
  // CREATE 85 VEHICLES FOR DEMO TRANSPORT
  // ============================================

  const demoVehicles: Awaited<ReturnType<typeof prisma.vehicle.create>>[] = [];

  // 40 PKWs (B-DT-1001 to B-DT-1040)
  for (let i = 1; i <= 40; i++) {
    const brandData = randomElement(carData);
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: `B-DT-${1000 + i}`,
        brand: brandData.brand,
        model: randomElement(brandData.models),
        year: 2019 + Math.floor(Math.random() * 6), // 2019-2024
        vehicleType: VehicleType.CAR,
        internalName: `PKW ${i}`,
        isActive: true,
      },
    });
    demoVehicles.push(vehicle);
  }
  console.log('Created 40 PKWs');

  // 28 Transporter (B-DT-2001 to B-DT-2028)
  for (let i = 1; i <= 28; i++) {
    const brandData = randomElement(vanData);
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: `B-DT-${2000 + i}`,
        brand: brandData.brand,
        model: randomElement(brandData.models),
        year: 2018 + Math.floor(Math.random() * 7), // 2018-2024
        vehicleType: VehicleType.VAN,
        internalName: `Transporter ${i}`,
        isActive: true,
      },
    });
    demoVehicles.push(vehicle);
  }
  console.log('Created 28 Transporter');

  // 14 LKWs (B-DT-3001 to B-DT-3014)
  for (let i = 1; i <= 14; i++) {
    const brandData = randomElement(truckData);
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: `B-DT-${3000 + i}`,
        brand: brandData.brand,
        model: randomElement(brandData.models),
        year: 2017 + Math.floor(Math.random() * 8), // 2017-2024
        vehicleType: VehicleType.TRUCK,
        internalName: `LKW ${i}`,
        isActive: true,
      },
    });
    demoVehicles.push(vehicle);
  }
  console.log('Created 14 LKWs');

  // 3 Motorrader (B-DT-4001 to B-DT-4003)
  for (let i = 1; i <= 3; i++) {
    const brandData = randomElement(motorcycleData);
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: `B-DT-${4000 + i}`,
        brand: brandData.brand,
        model: randomElement(brandData.models),
        year: 2020 + Math.floor(Math.random() * 5), // 2020-2024
        vehicleType: VehicleType.MOTORCYCLE,
        internalName: `Motorrad ${i}`,
        isActive: true,
      },
    });
    demoVehicles.push(vehicle);
  }
  console.log('Created 3 Motorraeder');
  console.log(`Total vehicles for Demo Transport: ${demoVehicles.length}`);

  // Create Main Policy (valid for 2+ years)
  const demoPolicy = await prisma.policy.create({
    data: {
      companyId: demoCompany.id,
      insurerId: insurers[0].id, // Allianz
      policyNumber: 'FL-DEMO-2024-001',
      coverageType: CoverageType.FLEET,
      pricingModel: PricingModel.QUOTA,
      annualPremium: 125000.0,
      deductible: 500.0,
      quotaThreshold: 0.65,
      validFrom: daysAgo(730), // 2 years ago
      validTo: daysAgo(-365), // Valid for another year
      isActive: true,
      notes: 'Flottenvertrag fuer Demo Transport GmbH - Alle Fahrzeuge',
    },
  });
  console.log(`Created policy: ${demoPolicy.policyNumber}`);

  // ============================================
  // CREATE 120 CLAIMS FOR DEMO TRANSPORT
  // Weighted distribution: more recent = more claims
  // ============================================

  const demoClaims: Awaited<ReturnType<typeof prisma.claim.create>>[] = [];
  let claimCounter = 1;

  // Distribution: [maxDaysAgo, numberOfClaims]
  const timeDistribution = [
    { maxDays: 30, count: 15 },    // Last 30 days: 15 claims
    { maxDays: 90, count: 20 },    // 1-3 months: 20 claims
    { maxDays: 180, count: 25 },   // 3-6 months: 25 claims
    { maxDays: 365, count: 30 },   // 6-12 months: 30 claims
    { maxDays: 730, count: 30 },   // 12-24 months: 30 claims
  ];

  // Status distribution weights
  const statusWeights: { status: ClaimStatus; weight: number }[] = [
    { status: ClaimStatus.DRAFT, weight: 5 },
    { status: ClaimStatus.SUBMITTED, weight: 15 },
    { status: ClaimStatus.APPROVED, weight: 10 },
    { status: ClaimStatus.SENT, weight: 8 },
    { status: ClaimStatus.ACKNOWLEDGED, weight: 7 },
    { status: ClaimStatus.CLOSED, weight: 70 },
    { status: ClaimStatus.REJECTED, weight: 5 },
  ];

  // Category distribution weights
  const categoryWeights: { category: DamageCategory; weight: number }[] = [
    { category: DamageCategory.PARKING, weight: 25 },
    { category: DamageCategory.LIABILITY, weight: 20 },
    { category: DamageCategory.COMPREHENSIVE, weight: 15 },
    { category: DamageCategory.GLASS, weight: 18 },
    { category: DamageCategory.WILDLIFE, weight: 12 },
    { category: DamageCategory.THEFT, weight: 8 },
    { category: DamageCategory.VANDALISM, weight: 12 },
    { category: DamageCategory.OTHER, weight: 10 },
  ];

  function weightedRandom<T>(items: { weight: number }[], getter: (idx: number) => T): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      random -= items[i].weight;
      if (random <= 0) return getter(i);
    }
    return getter(items.length - 1);
  }

  // Cost ranges based on category
  const costRanges: Record<DamageCategory, { min: number; max: number }> = {
    [DamageCategory.PARKING]: { min: 200, max: 2500 },
    [DamageCategory.LIABILITY]: { min: 500, max: 15000 },
    [DamageCategory.COMPREHENSIVE]: { min: 1000, max: 25000 },
    [DamageCategory.GLASS]: { min: 150, max: 1500 },
    [DamageCategory.WILDLIFE]: { min: 800, max: 20000 },
    [DamageCategory.THEFT]: { min: 500, max: 35000 },
    [DamageCategory.VANDALISM]: { min: 300, max: 5000 },
    [DamageCategory.OTHER]: { min: 200, max: 10000 },
  };

  let prevMaxDays = 0;
  for (const { maxDays, count } of timeDistribution) {
    for (let i = 0; i < count; i++) {
      const accidentDate = randomDaysAgo(prevMaxDays + 1, maxDays);
      const category = weightedRandom(categoryWeights, (idx) => categoryWeights[idx].category);
      const status = weightedRandom(statusWeights, (idx) => statusWeights[idx].status);
      const vehicle = randomElement(demoVehicles);
      const reporter = randomElement(allDemoUsers);
      const driver = randomElement(allDemoUsers);
      const costRange = costRanges[category];
      const estimatedCost = randomCost(costRange.min, costRange.max);
      const coords = randomBerlinCoords();
      const location = Math.random() > 0.3
        ? randomElement(berlinLocations)
        : randomElement(germanLocations);
      const description = randomElement(claimDescriptions[category]);

      // Determine if police was involved (more likely for certain categories)
      const policeCategories = [DamageCategory.LIABILITY, DamageCategory.WILDLIFE, DamageCategory.THEFT, DamageCategory.VANDALISM];
      const policeInvolved = policeCategories.includes(category)
        ? Math.random() > 0.3
        : Math.random() > 0.8;

      // Generate claim number
      const claimNumber = `CLM-${new Date().getFullYear()}-${claimCounter.toString().padStart(5, '0')}`;

      // Calculate dates based on status
      const daysSinceAccident = Math.floor((Date.now() - accidentDate.getTime()) / (1000 * 60 * 60 * 24));
      let sentAt: Date | null = null;
      let acknowledgedAt: Date | null = null;
      let closedAt: Date | null = null;
      let finalCost: number | null = null;
      let insurerClaimNumber: string | null = null;

      if ([ClaimStatus.SENT, ClaimStatus.ACKNOWLEDGED, ClaimStatus.CLOSED].includes(status)) {
        sentAt = daysAgo(daysSinceAccident - Math.floor(Math.random() * 3) - 1);
      }
      if ([ClaimStatus.ACKNOWLEDGED, ClaimStatus.CLOSED].includes(status)) {
        acknowledgedAt = daysAgo(daysSinceAccident - Math.floor(Math.random() * 5) - 3);
        insurerClaimNumber = `ALZ-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
      }
      if (status === ClaimStatus.CLOSED) {
        closedAt = daysAgo(Math.max(1, daysSinceAccident - Math.floor(Math.random() * 20) - 7));
        finalCost = estimatedCost * (0.85 + Math.random() * 0.3); // Final cost varies from estimate
      }

      // Third party info for liability claims
      let thirdPartyInfo: object | null = null;
      if (category === DamageCategory.LIABILITY && Math.random() > 0.3) {
        thirdPartyInfo = {
          licensePlate: `B-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 9000) + 1000}`,
          ownerName: randomElement(['Max Mueller', 'Anna Schmidt', 'Peter Weber', 'Maria Bauer', 'Thomas Fischer']),
          ownerPhone: `+49 170 ${Math.floor(Math.random() * 9000000) + 1000000}`,
          insurerName: randomElement(insurers).name,
        };
      }

      const claim = await prisma.claim.create({
        data: {
          companyId: demoCompany.id,
          vehicleId: vehicle.id,
          policyId: demoPolicy.id,
          reporterUserId: reporter.id,
          driverUserId: driver.id,
          status,
          claimNumber,
          insurerClaimNumber,
          accidentDate,
          accidentTime: randomTime(),
          accidentLocation: location,
          gpsLat: coords.lat,
          gpsLng: coords.lng,
          damageCategory: category,
          description,
          policeInvolved,
          policeFileNumber: policeInvolved ? `POL-B-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}` : null,
          hasInjuries: Math.random() > 0.95, // 5% have injuries
          estimatedCost,
          finalCost,
          sentAt,
          acknowledgedAt,
          closedAt,
          thirdPartyInfo,
        },
      });

      demoClaims.push(claim);
      claimCounter++;
    }
    prevMaxDays = maxDays;
  }

  console.log(`Created ${demoClaims.length} claims for Demo Transport`);

  // Create Claim Events for all demo claims
  for (const claim of demoClaims) {
    await prisma.claimEvent.create({
      data: {
        claimId: claim.id,
        userId: claim.reporterUserId,
        eventType: ClaimEventType.CREATED,
        newValue: { status: claim.status },
      },
    });
  }
  console.log(`Created claim events for ${demoClaims.length} claims`);

  // ============================================
  // ADDITIONAL COMPANIES (Minimal data)
  // ============================================

  const secondCompany = await prisma.company.create({
    data: {
      name: 'Schnell Logistik AG',
      address: 'Industrieweg 45',
      city: 'Hamburg',
      postalCode: '20095',
      country: 'DE',
      phone: '+49 40 987654321',
      website: 'https://schnell-logistik.de',
      numEmployees: 120,
      numVehicles: 65,
    },
  });

  const thirdCompany = await prisma.company.create({
    data: {
      name: 'Sued-Express Spedition',
      address: 'Bahnhofstrasse 78',
      city: 'Muenchen',
      postalCode: '80335',
      country: 'DE',
      phone: '+49 89 456789012',
      website: 'https://sued-express.de',
      numEmployees: 80,
      numVehicles: 40,
    },
  });

  // Create admin users for other companies
  const adminCompany2 = await prisma.user.create({
    data: {
      companyId: secondCompany.id,
      email: 'admin@schnell-logistik.de',
      passwordHash: await hashPassword('Admin123!'),
      role: UserRole.COMPANY_ADMIN,
      firstName: 'Julia',
      lastName: 'Schneider',
      phone: '+49 170 1111111',
      position: 'Fuhrparkmanagerin',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const adminCompany3 = await prisma.user.create({
    data: {
      companyId: thirdCompany.id,
      email: 'admin@sued-express.de',
      passwordHash: await hashPassword('Admin123!'),
      role: UserRole.COMPANY_ADMIN,
      firstName: 'Michael',
      lastName: 'Bauer',
      phone: '+49 170 2222222',
      position: 'Betriebsleiter',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create a few vehicles for other companies
  const vehiclesCompany2 = await Promise.all([
    prisma.vehicle.create({
      data: {
        companyId: secondCompany.id,
        licensePlate: 'HH-SL-1001',
        brand: 'Volvo',
        model: 'FH16',
        year: 2023,
        vehicleType: VehicleType.TRUCK,
        internalName: 'Fernverkehr 1',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: secondCompany.id,
        licensePlate: 'HH-SL-1002',
        brand: 'Scania',
        model: 'R500',
        year: 2022,
        vehicleType: VehicleType.TRUCK,
        internalName: 'Fernverkehr 2',
        isActive: true,
      },
    }),
  ]);

  const vehiclesCompany3 = await Promise.all([
    prisma.vehicle.create({
      data: {
        companyId: thirdCompany.id,
        licensePlate: 'M-SE-1001',
        brand: 'DAF',
        model: 'XF',
        year: 2022,
        vehicleType: VehicleType.TRUCK,
        internalName: 'Sattelzug 1',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: thirdCompany.id,
        licensePlate: 'M-SE-2001',
        brand: 'Iveco',
        model: 'Daily',
        year: 2023,
        vehicleType: VehicleType.VAN,
        internalName: 'Kurier 1',
        isActive: true,
      },
    }),
  ]);

  // Create policies for other companies
  const policy2 = await prisma.policy.create({
    data: {
      companyId: secondCompany.id,
      insurerId: insurers[1].id, // HUK
      policyNumber: 'FL-2024-005678',
      coverageType: CoverageType.FLEET,
      pricingModel: PricingModel.PER_PIECE,
      annualPremium: 85000.0,
      deductible: 750.0,
      validFrom: daysAgo(365),
      validTo: daysAgo(-365),
      isActive: true,
      notes: 'Flottenvertrag Schnell Logistik',
    },
  });

  const policy3 = await prisma.policy.create({
    data: {
      companyId: thirdCompany.id,
      insurerId: insurers[2].id, // DEVK
      policyNumber: 'FL-2024-009012',
      coverageType: CoverageType.FLEET,
      pricingModel: PricingModel.QUOTA,
      annualPremium: 52000.0,
      deductible: 500.0,
      quotaThreshold: 0.70,
      validFrom: daysAgo(365),
      validTo: daysAgo(-365),
      isActive: true,
      notes: 'Flottenvertrag Sued-Express',
    },
  });

  // Create a few sample claims for other companies
  const claimsCompany2 = await prisma.claim.create({
    data: {
      companyId: secondCompany.id,
      vehicleId: vehiclesCompany2[0].id,
      policyId: policy2.id,
      reporterUserId: adminCompany2.id,
      driverUserId: adminCompany2.id,
      status: ClaimStatus.SUBMITTED,
      claimNumber: 'CLM-2024-90001',
      accidentDate: daysAgo(5),
      accidentTime: randomTime(),
      accidentLocation: 'A7, Rastplatz Stillhorn, Hamburg',
      damageCategory: DamageCategory.PARKING,
      description: 'Beim Rangieren auf dem Rastplatz Aussenspiegel abgefahren.',
      policeInvolved: false,
      hasInjuries: false,
      estimatedCost: 850.0,
    },
  });

  const claimsCompany3 = await prisma.claim.create({
    data: {
      companyId: thirdCompany.id,
      vehicleId: vehiclesCompany3[0].id,
      policyId: policy3.id,
      reporterUserId: adminCompany3.id,
      driverUserId: adminCompany3.id,
      status: ClaimStatus.CLOSED,
      claimNumber: 'CLM-2024-90002',
      insurerClaimNumber: 'DEVK-2024-11111',
      accidentDate: daysAgo(45),
      accidentTime: randomTime(),
      accidentLocation: 'Muenchen Innenstadt, Marienplatz',
      damageCategory: DamageCategory.VANDALISM,
      description: 'Fahrzeug ueber Nacht geparkt, am naechsten Morgen Kratzer und eingeschlagener Spiegel.',
      policeInvolved: true,
      policeFileNumber: 'POL-M-2024-22222',
      hasInjuries: false,
      estimatedCost: 1800.0,
      finalCost: 1650.0,
      sentAt: daysAgo(44),
      acknowledgedAt: daysAgo(41),
      closedAt: daysAgo(35),
    },
  });

  // Create claim events for other companies
  await prisma.claimEvent.createMany({
    data: [
      {
        claimId: claimsCompany2.id,
        userId: adminCompany2.id,
        eventType: ClaimEventType.CREATED,
        newValue: { status: ClaimStatus.SUBMITTED },
      },
      {
        claimId: claimsCompany3.id,
        userId: adminCompany3.id,
        eventType: ClaimEventType.CREATED,
        newValue: { status: ClaimStatus.CLOSED },
      },
    ],
  });

  console.log('Created additional companies with minimal data');

  // ============================================
  // BROKER USER
  // ============================================

  const brokerUser = await prisma.user.create({
    data: {
      companyId: null,
      email: 'broker@versicherungsmakler.de',
      passwordHash: await hashPassword('Broker123!'),
      role: UserRole.BROKER,
      firstName: 'Thomas',
      lastName: 'Broker',
      phone: '+49 170 5678901',
      position: 'Versicherungsmakler',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.brokerCompanyLink.createMany({
    data: [
      { brokerUserId: brokerUser.id, companyId: demoCompany.id },
      { brokerUserId: brokerUser.id, companyId: secondCompany.id },
      { brokerUserId: brokerUser.id, companyId: thirdCompany.id },
    ],
  });

  console.log(`Created broker user: ${brokerUser.email}`);

  // ============================================
  // SUPERADMIN
  // ============================================

  const superadminUser = await prisma.user.create({
    data: {
      companyId: null,
      email: 'admin@poa-app.de',
      passwordHash: await hashPassword('SuperAdmin123!'),
      role: UserRole.SUPERADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Created superadmin user: ${superadminUser.email}`);

  // ============================================
  // NOTIFICATIONS FOR DEMO
  // ============================================

  // Create some recent notifications for admin
  const recentClaims = demoClaims.filter(c => {
    const daysSince = Math.floor((Date.now() - new Date(c.accidentDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince < 14;
  }).slice(0, 5);

  for (const claim of recentClaims) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'NEW_CLAIM',
        title: 'Neuer Schaden eingegangen',
        message: `Ein neuer Schaden (${claim.claimNumber}) wurde gemeldet.`,
        data: { claimId: claim.id, claimNumber: claim.claimNumber },
      },
    });
  }

  console.log('Created notifications');

  // ============================================
  // SUMMARY OUTPUT
  // ============================================

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================\n');
  console.log('DEMO TRANSPORT GmbH (Hauptaccount):');
  console.log('----------------------------------------');
  console.log(`  Fahrzeuge: ${demoVehicles.length}`);
  console.log('    - PKW: 40');
  console.log('    - Transporter: 28');
  console.log('    - LKW: 14');
  console.log('    - Motorrad: 3');
  console.log(`  Schaeden: ${demoClaims.length}`);
  console.log('');
  console.log('Login-Daten (Passwort fuer alle: Demo123!):');
  console.log('  Admin:    admin@demo-transport.de');
  console.log('  Fahrer 1: fahrer1@demo-transport.de');
  console.log('  Fahrer 2: fahrer2@demo-transport.de');
  console.log('  Fahrer 3: fahrer3@demo-transport.de');
  console.log('');
  console.log('Weitere Accounts:');
  console.log('----------------------------------------');
  console.log('Schnell Logistik AG (Hamburg):');
  console.log('  admin@schnell-logistik.de / Admin123!');
  console.log('');
  console.log('Sued-Express Spedition (Muenchen):');
  console.log('  admin@sued-express.de / Admin123!');
  console.log('');
  console.log('Broker (verknuepft mit allen 3 Firmen):');
  console.log('  broker@versicherungsmakler.de / Broker123!');
  console.log('');
  console.log('Superadmin:');
  console.log('  admin@poa-app.de / SuperAdmin123!');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
