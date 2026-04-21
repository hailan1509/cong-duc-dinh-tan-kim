import { prisma } from "@/lib/db";
import { z } from "zod";
import { publish } from "@/lib/sseBus";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const festivalId = url.searchParams.get("festivalId");
  const where = festivalId ? { festivalId: Number(festivalId) } : undefined;

  const merits = await prisma.merit.findMany({
    where,
    include: { festival: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ merits });
}

const MeritCreateSchema = z.object({
  festivalId: z.coerce.number().int().positive(),
  honorific: z.enum(["ong", "ba", "anh", "chi"]).optional(),
  announce: z.coerce.boolean().optional(),
  donorName: z.string().min(1),
  donorAddress: z.string().min(1),
  amount: z.coerce.number().int().min(0),
  note: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = MeritCreateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const { festivalId, donorName, donorAddress, amount, note, honorific, announce } = parsed.data;

  const merit = await prisma.merit.create({
    data: {
      festivalId,
      honorific: honorific ?? "ong",
      announce: announce ?? true,
      donorName,
      donorAddress,
      amount,
      note: note || null,
    },
  });

  publish({
    type: "merit_created",
    data: {
      id: merit.id,
      festivalId: merit.festivalId,
      honorific: merit.honorific,
      announce: merit.announce,
      donorName: merit.donorName,
      donorAddress: merit.donorAddress,
      amount: merit.amount,
      createdAt: merit.createdAt.toISOString(),
    },
  });

  return Response.json({ merit }, { status: 201 });
}

