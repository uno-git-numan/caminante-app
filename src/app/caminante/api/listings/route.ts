import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPublishedListings } from "@/lib/listings/queries";

const querySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(["activity", "transport", "accommodation", "package"]).optional(),
  destination: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    destination: url.searchParams.get("destination") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listings = await searchPublishedListings(parsed.data);
    return NextResponse.json({ data: listings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
