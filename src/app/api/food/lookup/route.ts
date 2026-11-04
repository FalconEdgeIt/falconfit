import { NextResponse } from "next/server";
import { requireUser, isResponse } from "../../../../lib/authz";
import { lookupBarcode, searchFoods } from "../../../../lib/foodLookup";

// GET packaged food data: ?q= searches by name, ?barcode= finds one product
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const query = searchParams.get("q")?.trim();

  try {
    if (barcode !== null) {
      if (!/^\d{6,14}$/.test(barcode)) {
        return NextResponse.json({ error: "That doesn't look like a barcode" }, { status: 400 });
      }
      const { product, name } = await lookupBarcode(barcode);
      if (!product) return NextResponse.json({ error: "Product not found", name }, { status: 404 });
      return NextResponse.json(product);
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "q must be at least 2 characters" }, { status: 400 });
    }
    return NextResponse.json(await searchFoods(query));
  } catch {
    return NextResponse.json({ error: "Food database unavailable" }, { status: 502 });
  }
}
