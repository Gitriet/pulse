import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.wheretheiss.at/v1/satellites/25544",
      { next: { revalidate: 10 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "ISS API error" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      lat: parseFloat(data.latitude).toFixed(2),
      lng: parseFloat(data.longitude).toFixed(2),
      alt: parseFloat(data.altitude).toFixed(0),
      vel: parseFloat(data.velocity).toFixed(0),
    });
  } catch (err) {
    console.error("ISS API error:", err);
    return NextResponse.json(
      { lat: "51.50", lng: "4.90", alt: "408", vel: "27580" },
      { status: 200 }
    );
  }
}
