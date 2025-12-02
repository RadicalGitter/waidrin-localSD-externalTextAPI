// SPDX-License-Identifier: AGPL-3.0-or-later
// Venice proxy disabled; use provider endpoint directly.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Venice proxy disabled; call Venice directly." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Venice proxy disabled; call Venice directly." }, { status: 410 });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 204 });
}
