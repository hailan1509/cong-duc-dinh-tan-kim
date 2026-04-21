import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const festival = await prisma.festival.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!festival) return Response.json({ festival: null, merits: [] });

  const merits = await prisma.merit.findMany({
    where: { festivalId: festival.id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    festival: {
      id: festival.id,
      name: festival.name,
      year: festival.year,
      startDate: festival.startDate.toISOString(),
      endDate: festival.endDate.toISOString(),
    },
    merits: merits.map((m) => ({
      id: m.id,
      donorName: m.donorName,
      donorAddress: m.donorAddress,
      amount: m.amount,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

