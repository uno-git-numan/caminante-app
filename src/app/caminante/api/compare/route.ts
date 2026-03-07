import { NextResponse } from "next/server";
import { z } from "zod";
import { getListingsByIds } from "@/lib/listings/queries";

const bodySchema = z.object({
  listingIds: z.array(z.uuid()).min(2).max(5),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listings = await getListingsByIds(parsed.data.listingIds);

    const compareRows = listings.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      price: "TODO",
      vibe: item.vibe,
      difficulty: item.difficulty,
      availability: "TODO",
      destination: item.destination,
    }));

    return NextResponse.json({ data: compareRows }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
