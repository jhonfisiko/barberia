import { NextResponse, type NextRequest } from "next/server";
import { UUID, computeAvailability, parseServiceIds } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const ids = parseServiceIds(sp.get("services"));
  const barber = sp.get("barber") ?? "";

  if (!ids || (barber !== "any" && !UUID.test(barber))) {
    return NextResponse.json(
      { days: {}, error: "Solicitud no válida." },
      { status: 400 }
    );
  }

  try {
    const result = await computeAvailability(ids, barber);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { days: {}, error: "No se pudo calcular la disponibilidad." },
      { status: 500 }
    );
  }
}