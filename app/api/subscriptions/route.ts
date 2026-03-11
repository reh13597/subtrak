import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM Subscription");
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { 
    UserID, 
    ServiceID, 
    PaymentMethodType, 
    StartDate, 
    RenewalDate, 
    Status, 
    ActualPrice, 
    BillingFrequency, 
    AutoRenew, 
    CancellationDate 
  } = await req.json();

  try {
    await db.query(
      `INSERT INTO Subscription (
        UserID, 
        ServiceID, 
        PaymentMethodType, 
        StartDate, 
        RenewalDate, 
        Status, 
        ActualPrice, 
        BillingFrequency, 
        AutoRenew, 
        CancellationDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        UserID, 
        ServiceID, 
        PaymentMethodType, 
        StartDate, 
        RenewalDate, 
        Status, 
        ActualPrice, 
        BillingFrequency, 
        AutoRenew, 
        CancellationDate
      ]
    );
    return NextResponse.json({ message: "Subscription added!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}