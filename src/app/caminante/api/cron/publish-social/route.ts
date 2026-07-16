import { NextResponse } from "next/server";
import { fetchDuePosts, claimPost, markPublished, markFailed } from "@/lib/social/posts";
import { publishToInstagram } from "@/lib/social/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel) → PUBLICADOR: toma las publicaciones programadas ya vencidas
// (scheduled_at <= now) y las publica en Instagram con el token de social_accounts.
// Protegido con CRON_SECRET (igual que send-surveys / cupo-honesto).
//
// Idempotente: claimPost pasa la fila a 'publishing' de forma atómica antes de
// publicar, así dos corridas solapadas no publican dos veces. markFailed reintenta
// hasta 3 veces y luego la deja 'failed'.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const due = await fetchDuePosts(10);
  let published = 0;
  let failed = 0;
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const post of due) {
    if (!(await claimPost(post.id))) continue; // otra corrida ya la tomó
    try {
      const res = await publishToInstagram({
        format: post.format,
        imageUrls: post.imageUrls,
        caption: post.caption ?? undefined,
      });
      if (res.ok) {
        await markPublished(post.id, res.mediaId, res.permalink);
        published++;
        results.push({ id: post.id, ok: true });
      } else {
        await markFailed(post.id, res.error);
        failed++;
        results.push({ id: post.id, ok: false, error: res.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      await markFailed(post.id, msg);
      failed++;
      results.push({ id: post.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({ ok: true, checked: due.length, published, failed, results });
}
