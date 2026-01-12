import { PrismaClient, UserRole, VehicleType, CoverageType, PricingModel, ClaimStatus, DamageCategory, ClaimEventType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  // Create Demo Companies
  const demoCompany = await prisma.company.create({
    data: {
      name: 'Demo Transport GmbH',
      address: 'Musterstrasse 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      phone: '+49 30 123456789',
      website: 'https://demo-transport.de',
      numEmployees: 50,
      numVehicles: 25,
    },
  });

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

  console.log(`Created companies: ${demoCompany.name}, ${secondCompany.name}, ${thirdCompany.name}`);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      companyId: demoCompany.id,
      email: 'admin@demo-transport.de',
      passwordHash: await hashPassword('Admin123!'),
      role: UserRole.COMPANY_ADMIN,
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49 170 1234567',
      position: 'Fuhrparkleiter',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);

  // Create Employee Users
  const employeeUsers = await Promise.all([
    prisma.user.create({
      data: {
        companyId: demoCompany.id,
        email: 'fahrer1@demo-transport.de',
        passwordHash: await hashPassword('Fahrer123!'),
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
        passwordHash: await hashPassword('Fahrer123!'),
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
        passwordHash: await hashPassword('Fahrer123!'),
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

  console.log(`Created ${employeeUsers.length} employee users`);

  // Create Broker User
  const brokerUser = await prisma.user.create({
    data: {
      companyId: null, // Brokers don't belong to a company
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

  // Link Broker to all Companies
  await prisma.brokerCompanyLink.createMany({
    data: [
      { brokerUserId: brokerUser.id, companyId: demoCompany.id },
      { brokerUserId: brokerUser.id, companyId: secondCompany.id },
      { brokerUserId: brokerUser.id, companyId: thirdCompany.id },
    ],
  });

  console.log(`Created broker user: ${brokerUser.email} (linked to 3 companies)`);

  // Create Superadmin
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

  // Create Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: 'B-DT-1001',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2022,
        vehicleType: VehicleType.VAN,
        internalName: 'Sprinter 1',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: 'B-DT-1002',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2022,
        vehicleType: VehicleType.VAN,
        internalName: 'Sprinter 2',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: 'B-DT-2001',
        brand: 'MAN',
        model: 'TGX',
        year: 2021,
        vehicleType: VehicleType.TRUCK,
        internalName: 'LKW 1',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: 'B-DT-3001',
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2023,
        vehicleType: VehicleType.CAR,
        internalName: 'PKW Geschaeftsfuehrung',
        isActive: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: demoCompany.id,
        licensePlate: 'B-DT-3002',
        brand: 'Volkswagen',
        model: 'Passat',
        year: 2022,
        vehicleType: VehicleType.CAR,
        internalName: 'PKW Vertrieb',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${vehicles.length} vehicles for Demo Transport`);

  // Create Vehicles for Second Company (Schnell Logistik)
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
    prisma.vehicle.create({
      data: {
        companyId: secondCompany.id,
        licensePlate: 'HH-SL-2001',
        brand: 'Mercedes-Benz',
        model: 'Actros',
        year: 2021,
        vehicleType: VehicleType.TRUCK,
        internalName: 'Nahverkehr 1',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${vehiclesCompany2.length} vehicles for Schnell Logistik`);

  // Create Vehicles for Third Company (Sued-Express)
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

  console.log(`Created ${vehiclesCompany3.length} vehicles for Sued-Express`);

  // Create Admin users for other companies
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

  console.log('Created admin users for additional companies');

  // Create Policy
  const policy = await prisma.policy.create({
    data: {
      companyId: demoCompany.id,
      insurerId: insurers[0].id, // Allianz
      policyNumber: 'FL-2024-001234',
      coverageType: CoverageType.FLEET,
      pricingModel: PricingModel.QUOTA,
      annualPremium: 45000.0,
      deductible: 500.0,
      quotaThreshold: 0.65,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
      isActive: true,
      notes: 'Flottenvertrag fuer alle Fahrzeuge',
    },
  });

  console.log(`Created policy: ${policy.policyNumber}`);

  // Create Policies for other companies
  const policy2 = await prisma.policy.create({
    data: {
      companyId: secondCompany.id,
      insurerId: insurers[1].id, // HUK
      policyNumber: 'FL-2024-005678',
      coverageType: CoverageType.FLEET,
      pricingModel: PricingModel.PER_PIECE,
      annualPremium: 85000.0,
      deductible: 750.0,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
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
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
      isActive: true,
      notes: 'Flottenvertrag Sued-Express',
    },
  });

  console.log('Created policies for additional companies');

  // Create Demo Claims
  const claims = await Promise.all([
    // Claim 1: Submitted, waiting for approval
    prisma.claim.create({
      data: {
        companyId: demoCompany.id,
        vehicleId: vehicles[0].id,
        policyId: policy.id,
        reporterUserId: employeeUsers[0].id,
        driverUserId: employeeUsers[0].id,
        status: ClaimStatus.SUBMITTED,
        claimNumber: 'CLM-2024-00001',
        accidentDate: new Date('2024-12-10'),
        accidentTime: new Date('1970-01-01T14:30:00'),
        accidentLocation: 'A100, Ausfahrt Spandauer Damm, Berlin',
        gpsLat: 52.5163,
        gpsLng: 13.2937,
        damageCategory: DamageCategory.PARKING,
        description: 'Beim Ausparken auf dem Kundenparkplatz wurde das Fahrzeug von einem unbekannten Fahrzeug touchiert. Lackschaden an der hinteren Stossstange.',
        policeInvolved: false,
        hasInjuries: false,
        estimatedCost: 1500.0,
      },
    }),
    // Claim 2: Approved, ready to send
    prisma.claim.create({
      data: {
        companyId: demoCompany.id,
        vehicleId: vehicles[2].id,
        policyId: policy.id,
        reporterUserId: employeeUsers[1].id,
        driverUserId: employeeUsers[1].id,
        status: ClaimStatus.APPROVED,
        claimNumber: 'CLM-2024-00002',
        accidentDate: new Date('2024-12-08'),
        accidentTime: new Date('1970-01-01T06:45:00'),
        accidentLocation: 'B1, km 45, Brandenburg',
        gpsLat: 52.4100,
        gpsLng: 12.5500,
        damageCategory: DamageCategory.WILDLIFE,
        description: 'Wildunfall mit Reh auf der B1. Frontschaden am LKW, Tier verendet.',
        policeInvolved: true,
        policeFileNumber: 'POL-BB-2024-12345',
        hasInjuries: false,
        estimatedCost: 8500.0,
      },
    }),
    // Claim 3: Sent to insurer
    prisma.claim.create({
      data: {
        companyId: demoCompany.id,
        vehicleId: vehicles[3].id,
        policyId: policy.id,
        reporterUserId: adminUser.id,
        driverUserId: adminUser.id,
        status: ClaimStatus.SENT,
        claimNumber: 'CLM-2024-00003',
        accidentDate: new Date('2024-12-01'),
        accidentTime: new Date('1970-01-01T17:00:00'),
        accidentLocation: 'Kreuzung Friedrichstrasse/Unter den Linden, Berlin',
        gpsLat: 52.5170,
        gpsLng: 13.3888,
        damageCategory: DamageCategory.LIABILITY,
        thirdPartyInfo: {
          licensePlate: 'B-XY-4567',
          ownerName: 'Erika Beispiel',
          ownerPhone: '+49 170 9876543',
          insurerName: 'HUK-COBURG',
        },
        description: 'Auffahrunfall an roter Ampel. Gegner bremste ueberraschend, leichter Aufprall. Blechschaden an beiden Fahrzeugen.',
        policeInvolved: true,
        policeFileNumber: 'POL-B-2024-67890',
        hasInjuries: false,
        estimatedCost: 3200.0,
        sentAt: new Date('2024-12-02'),
      },
    }),
    // Claim 4: Closed
    prisma.claim.create({
      data: {
        companyId: demoCompany.id,
        vehicleId: vehicles[1].id,
        policyId: policy.id,
        reporterUserId: employeeUsers[2].id,
        driverUserId: employeeUsers[2].id,
        status: ClaimStatus.CLOSED,
        claimNumber: 'CLM-2024-00004',
        insurerClaimNumber: 'ALZ-2024-98765',
        accidentDate: new Date('2024-11-15'),
        accidentTime: new Date('1970-01-01T09:30:00'),
        accidentLocation: 'Berliner Ring A10, km 78',
        damageCategory: DamageCategory.GLASS,
        description: 'Steinschlag auf der Autobahn. Frontscheibe gerissen.',
        policeInvolved: false,
        hasInjuries: false,
        estimatedCost: 650.0,
        finalCost: 620.0,
        sentAt: new Date('2024-11-16'),
        acknowledgedAt: new Date('2024-11-18'),
        closedAt: new Date('2024-11-25'),
      },
    }),
  ]);

  console.log(`Created ${claims.length} demo claims for Demo Transport`);

  // Create Claims for Second Company (Schnell Logistik)
  const claimsCompany2 = await Promise.all([
    prisma.claim.create({
      data: {
        companyId: secondCompany.id,
        vehicleId: vehiclesCompany2[0].id,
        policyId: policy2.id,
        reporterUserId: adminCompany2.id,
        driverUserId: adminCompany2.id,
        status: ClaimStatus.SUBMITTED,
        claimNumber: 'CLM-2024-00010',
        accidentDate: new Date('2024-12-18'),
        accidentTime: new Date('1970-01-01T08:15:00'),
        accidentLocation: 'A7, Rastplatz Stillhorn, Hamburg',
        damageCategory: DamageCategory.PARKING,
        description: 'Beim Rangieren auf dem Rastplatz Aussenspiegel abgefahren.',
        policeInvolved: false,
        hasInjuries: false,
        estimatedCost: 850.0,
      },
    }),
    prisma.claim.create({
      data: {
        companyId: secondCompany.id,
        vehicleId: vehiclesCompany2[1].id,
        policyId: policy2.id,
        reporterUserId: adminCompany2.id,
        driverUserId: adminCompany2.id,
        status: ClaimStatus.APPROVED,
        claimNumber: 'CLM-2024-00011',
        accidentDate: new Date('2024-12-15'),
        accidentTime: new Date('1970-01-01T22:30:00'),
        accidentLocation: 'A1, km 320, bei Bremen',
        damageCategory: DamageCategory.WILDLIFE,
        description: 'Wildschwein ueberquerte nachts die Autobahn. Ausweichmanoever, Leitplanke touchiert.',
        policeInvolved: true,
        policeFileNumber: 'POL-HB-2024-45678',
        hasInjuries: false,
        estimatedCost: 12500.0,
      },
    }),
    prisma.claim.create({
      data: {
        companyId: secondCompany.id,
        vehicleId: vehiclesCompany2[2].id,
        policyId: policy2.id,
        reporterUserId: adminCompany2.id,
        driverUserId: adminCompany2.id,
        status: ClaimStatus.SENT,
        claimNumber: 'CLM-2024-00012',
        accidentDate: new Date('2024-12-05'),
        accidentTime: new Date('1970-01-01T11:00:00'),
        accidentLocation: 'Hamburger Hafen, Terminal Burchardkai',
        damageCategory: DamageCategory.COMPREHENSIVE,
        description: 'Container beim Beladen verrutscht und Aufbau beschaedigt.',
        policeInvolved: false,
        hasInjuries: false,
        estimatedCost: 4200.0,
        sentAt: new Date('2024-12-06'),
      },
    }),
  ]);

  console.log(`Created ${claimsCompany2.length} demo claims for Schnell Logistik`);

  // Create Claims for Third Company (Sued-Express)
  const claimsCompany3 = await Promise.all([
    prisma.claim.create({
      data: {
        companyId: thirdCompany.id,
        vehicleId: vehiclesCompany3[0].id,
        policyId: policy3.id,
        reporterUserId: adminCompany3.id,
        driverUserId: adminCompany3.id,
        status: ClaimStatus.SUBMITTED,
        claimNumber: 'CLM-2024-00020',
        accidentDate: new Date('2024-12-20'),
        accidentTime: new Date('1970-01-01T16:45:00'),
        accidentLocation: 'A8, Ausfahrt Augsburg-West',
        damageCategory: DamageCategory.LIABILITY,
        thirdPartyInfo: {
          licensePlate: 'A-BC-1234',
          ownerName: 'Friedrich Meier',
          ownerPhone: '+49 170 3333333',
          insurerName: 'Allianz',
        },
        description: 'Spurwechsel auf A8, anderes Fahrzeug nicht gesehen. Seitlicher Kontakt.',
        policeInvolved: true,
        policeFileNumber: 'POL-BY-2024-98765',
        hasInjuries: false,
        estimatedCost: 5800.0,
      },
    }),
    prisma.claim.create({
      data: {
        companyId: thirdCompany.id,
        vehicleId: vehiclesCompany3[1].id,
        policyId: policy3.id,
        reporterUserId: adminCompany3.id,
        driverUserId: adminCompany3.id,
        status: ClaimStatus.CLOSED,
        claimNumber: 'CLM-2024-00021',
        insurerClaimNumber: 'DEVK-2024-11111',
        accidentDate: new Date('2024-11-28'),
        accidentTime: new Date('1970-01-01T13:20:00'),
        accidentLocation: 'Muenchen Innenstadt, Marienplatz',
        damageCategory: DamageCategory.VANDALISM,
        description: 'Fahrzeug ueber Nacht geparkt, am naechsten Morgen Kratzer und eingeschlagener Spiegel.',
        policeInvolved: true,
        policeFileNumber: 'POL-M-2024-22222',
        hasInjuries: false,
        estimatedCost: 1800.0,
        finalCost: 1650.0,
        sentAt: new Date('2024-11-29'),
        acknowledgedAt: new Date('2024-12-02'),
        closedAt: new Date('2024-12-10'),
      },
    }),
  ]);

  console.log(`Created ${claimsCompany3.length} demo claims for Sued-Express`);

  // Combine all claims for event creation
  const allClaims = [...claims, ...claimsCompany2, ...claimsCompany3];

  // Create Claim Events for audit trail
  for (const claim of allClaims) {
    await prisma.claimEvent.create({
      data: {
        claimId: claim.id,
        userId: claim.reporterUserId,
        eventType: ClaimEventType.CREATED,
        newValue: { status: claim.status },
      },
    });
  }

  console.log(`Created claim events for ${allClaims.length} claims`);

  // Create some notifications for admin
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: 'NEW_CLAIM',
        title: 'Neuer Schaden eingegangen',
        message: 'Hans Schmidt hat einen neuen Schaden (CLM-2024-00001) gemeldet.',
        data: { claimId: claims[0].id, claimNumber: 'CLM-2024-00001' },
      },
      {
        userId: adminUser.id,
        type: 'NEW_CLAIM',
        title: 'Neuer Schaden eingegangen',
        message: 'Peter Mueller hat einen neuen Schaden (CLM-2024-00002) gemeldet.',
        data: { claimId: claims[1].id, claimNumber: 'CLM-2024-00002' },
      },
    ],
  });

  console.log('Created notifications');

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================\n');
  console.log('Demo Accounts:');
  console.log('----------------------------------------');
  console.log('Demo Transport GmbH (Berlin):');
  console.log('  Admin:    admin@demo-transport.de / Admin123!');
  console.log('  Fahrer 1: fahrer1@demo-transport.de / Fahrer123!');
  console.log('  Fahrer 2: fahrer2@demo-transport.de / Fahrer123!');
  console.log('  Fahrer 3: fahrer3@demo-transport.de / Fahrer123!');
  console.log('');
  console.log('Schnell Logistik AG (Hamburg):');
  console.log('  Admin:    admin@schnell-logistik.de / Admin123!');
  console.log('');
  console.log('Sued-Express Spedition (Muenchen):');
  console.log('  Admin:    admin@sued-express.de / Admin123!');
  console.log('');
  console.log('Broker (linked to all 3 companies):');
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
