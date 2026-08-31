/**
 * Prisma seed script — generates realistic fake data for local dev.
 *
 * Generates:
 *   - 8 services across 4 categories
 *   - 50 customers
 *   - 20 mechanics
 *   - 500+ bookings spread across the past 90 days
 *   - Booking status history entries for every transition
 *   - 1 default admin user (admin@instantmechanic.dev / Admin@123)
 *
 * Run: npx ts-node prisma/seed.ts   (or via "prisma": { "seed": "..." } in package.json)
 */

import { PrismaClient, BookingStatus, MechanicStatus, UserRole } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Status pipeline: PENDING → ASSIGNED → MECHANIC_ON_THE_WAY → COMPLETED
// with CANCELLED branching from PENDING or ASSIGNED
const STATUS_PIPELINE: BookingStatus[] = [
  "PENDING",
  "ASSIGNED",
  "MECHANIC_ON_THE_WAY",
  "COMPLETED",
];

/** Build an ordered list of statuses for a booking based on a final status. */
function buildStatusChain(finalStatus: BookingStatus): BookingStatus[] {
  if (finalStatus === "CANCELLED") {
    const branchFrom = randomFrom(["PENDING", "ASSIGNED"] as BookingStatus[]);
    const chain: BookingStatus[] = ["PENDING"];
    if (branchFrom === "ASSIGNED") chain.push("ASSIGNED");
    chain.push("CANCELLED");
    return chain;
  }

  const idx = STATUS_PIPELINE.indexOf(finalStatus);
  return STATUS_PIPELINE.slice(0, idx + 1);
}

// ── Seed data constants ───────────────────────────────────────────────────────

const SERVICES = [
  { name: "Oil Change", category: "Maintenance", basePrice: 49.99 },
  { name: "Brake Repair", category: "Repair", basePrice: 149.99 },
  { name: "Battery Replacement", category: "Electrical", basePrice: 89.99 },
  { name: "AC Service", category: "HVAC", basePrice: 129.99 },
  { name: "Tire Replacement", category: "Maintenance", basePrice: 79.99 },
  { name: "General Diagnostics", category: "Inspection", basePrice: 59.99 },
  { name: "Transmission Service", category: "Repair", basePrice: 249.99 },
  { name: "Engine Tune-Up", category: "Maintenance", basePrice: 199.99 },
  { name: "Wheel Alignment", category: "Maintenance", basePrice: 69.99 },
  { name: "Suspension Repair", category: "Repair", basePrice: 299.99 },
];

const VEHICLE_MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Hyundai", "Kia", "Volkswagen", "Nissan"];
const VEHICLE_MODELS: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Highlander"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot"],
  Ford: ["F-150", "Mustang", "Explorer", "Escape"],
  Chevrolet: ["Silverado", "Malibu", "Equinox", "Tahoe"],
  BMW: ["3 Series", "5 Series", "X3", "X5"],
  Mercedes: ["C-Class", "E-Class", "GLC", "GLE"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe"],
  Kia: ["Sportage", "Sorento", "Telluride", "K5"],
  Volkswagen: ["Jetta", "Passat", "Tiguan", "Atlas"],
  Nissan: ["Altima", "Sentra", "Rogue", "Murano"],
};

// Final status distribution for 500+ bookings (realistic ops mix)
const STATUS_DISTRIBUTION: { status: BookingStatus; weight: number }[] = [
  { status: "COMPLETED", weight: 55 },
  { status: "PENDING", weight: 15 },
  { status: "ASSIGNED", weight: 10 },
  { status: "MECHANIC_ON_THE_WAY", weight: 8 },
  { status: "CANCELLED", weight: 12 },
];

function weightedRandomStatus(): BookingStatus {
  const total = STATUS_DISTRIBUTION.reduce((s, d) => s + d.weight, 0);
  let rand = Math.random() * total;
  for (const { status, weight } of STATUS_DISTRIBUTION) {
    rand -= weight;
    if (rand <= 0) return status;
  }
  return "COMPLETED";
}

// ── Main seed ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed…");

  // Wipe existing data (idempotent re-seed)
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // 1. Services
  console.log("  Creating services…");
  const services = await Promise.all(
    SERVICES.map((s) =>
      prisma.service.create({ data: { name: s.name, category: s.category, basePrice: s.basePrice } })
    )
  );

  // 2. Customers (50)
  console.log("  Creating 50 customers…");
  const customers = await Promise.all(
    Array.from({ length: 50 }, () =>
      prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email({ provider: "example.com" }),
          phone: faker.phone.number({ style: "national" }),
          createdAt: faker.date.between({ from: daysAgo(180), to: new Date() }),
        },
      })
    )
  );

  // 3. Mechanics (20)
  console.log("  Creating 20 mechanics…");
  const mechanicStatuses: MechanicStatus[] = ["AVAILABLE", "BUSY", "OFF_DUTY"];
  const mechanics = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      prisma.mechanic.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email({ provider: "mechanics.instantmechanic.dev" }),
          phone: faker.phone.number({ style: "national" }),
          status: i < 8 ? "AVAILABLE" : i < 14 ? "BUSY" : "OFF_DUTY",
          jobsCompleted: randomInt(10, 350),
          createdAt: faker.date.between({ from: daysAgo(365), to: daysAgo(30) }),
        },
      })
    )
  );

  // 4. Bookings (520 — spread over past 90 days with realistic variance)
  console.log("  Creating 520 bookings with status history…");

  const BOOKING_COUNT = 520;

  for (let i = 0; i < BOOKING_COUNT; i++) {
    const customer = randomFrom(customers);
    const service = randomFrom(services);
    const mechanic = randomFrom(mechanics);
    const finalStatus = weightedRandomStatus();

    // Scheduled somewhere in the past 90 days, with a few in the next 7 days
    const offsetDays = i < 30 ? -randomInt(1, 7) : randomInt(0, 90);
    const scheduledAt = daysAgo(offsetDays);

    // Price = base ± 20% variance (realistic job variation)
    const variance = 0.8 + Math.random() * 0.4;
    const amount = parseFloat((Number(service.basePrice) * variance).toFixed(2));

    // Build the status chain and timestamp each transition
    const chain = buildStatusChain(finalStatus);
    const chainMechanic = finalStatus !== "PENDING" && finalStatus !== "CANCELLED" ? mechanic : null;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        mechanicId: chainMechanic?.id ?? (finalStatus === "ASSIGNED" || finalStatus === "MECHANIC_ON_THE_WAY" ? mechanic.id : null),
        serviceId: service.id,
        vehicleMake: randomFrom(VEHICLE_MAKES),
        vehicleModel: "", // set below
        vehicleYear: randomInt(2008, 2024),
        vehiclePlate: faker.vehicle.vrm(),
        status: finalStatus,
        amount,
        scheduledAt,
        createdAt: new Date(scheduledAt.getTime() - randomInt(1, 48) * 3600_000),
      },
    });

    // Fix vehicle model (depends on make, which we chose above)
    const make = booking.vehicleMake;
    const model = randomFrom(VEHICLE_MODELS[make] ?? ["Unknown"]);
    await prisma.booking.update({ where: { id: booking.id }, data: { vehicleModel: model } });

    // Status history — one entry per transition
    let transitionTime = new Date(booking.createdAt.getTime());
    for (let j = 0; j < chain.length; j++) {
      const newStatus = chain[j];
      const oldStatus = j > 0 ? chain[j - 1] : null;
      transitionTime = new Date(transitionTime.getTime() + randomInt(5, 60) * 60_000);

      await prisma.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: oldStatus as BookingStatus | null,
          newStatus,
          changedAt: transitionTime,
        },
      });
    }
  }

  // 5. Default admin user
  console.log("  Creating default admin user…");
  const hash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      email: "admin@instantmechanic.dev",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Default login: admin@instantmechanic.dev / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
