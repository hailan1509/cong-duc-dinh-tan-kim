import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const festivals = await prisma.festival.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
  });
  return Response.json({ festivals });
}

const FestivalCreateSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(3000),
  active: z.coerce.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = FestivalCreateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const { name, startDate, endDate, year, active } = parsed.data;
  const festival = await prisma.$transaction(async (tx) => {
    if (active) {
      await tx.festival.updateMany({ data: { active: false }, where: { active: true } });
    }
    return await tx.festival.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year,
        active: !!active,
      },
    });
  });

  return Response.json({ festival }, { status: 201 });
}

