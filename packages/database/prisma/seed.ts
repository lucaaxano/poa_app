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

  // Create Demo Company
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

  console.log(`Created company: ${demoCompany.name}`);

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

  // Link Broker to Company
  await prisma.brokerCompanyLink.create({
    data: {
      brokerUserId: brokerUser.id,
      companyId: demoCompany.id,
    },
  });

  console.log(`Created broker user: ${brokerUser.email}`);

  // Create Superadmin
  const superadminUser = await prisma.user.create({
    data: {
      companyId: null,
      email: 'superadmin@poa-app.de',
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

  console.log(`Created ${vehicles.length} vehicles`);

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

  console.log(`Created ${claims.length} demo claims`);

  // Create Claim Events for audit trail
  for (const claim of claims) {
    await prisma.claimEvent.create({
      data: {
        claimId: claim.id,
        userId: claim.reporterUserId,
        eventType: ClaimEventType.CREATED,
        newValue: { status: claim.status },
      },
    });
  }

  console.log('Created claim events');

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
  console.log('Admin:      admin@demo-transport.de / Admin123!');
  console.log('Fahrer 1:   fahrer1@demo-transport.de / Fahrer123!');
  console.log('Fahrer 2:   fahrer2@demo-transport.de / Fahrer123!');
  console.log('Fahrer 3:   fahrer3@demo-transport.de / Fahrer123!');
  console.log('Broker:     broker@versicherungsmakler.de / Broker123!');
  console.log('Superadmin: superadmin@poa-app.de / SuperAdmin123!');
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
