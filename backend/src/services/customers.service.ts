/**
 * Customers service — paginated list and single customer detail.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function getCustomers(page = 1, limit = 20, search?: string) {
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { bookings: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          service: { select: { name: true, category: true } },
          mechanic: { select: { name: true } },
        },
      },
    },
  });
  if (!customer) throw new AppError(404, `Customer ${id} not found`);
  return customer;
}
