import { NextResponse } from "next/server";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ProblemStatus } from "@/types/problem";

export async function GET() {
  try {
    let q = query(
      collection(db, "problems"),
      where("status", "==", ProblemStatus.PUBLISHED),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snapshot = await getDocs(q);
    
    return NextResponse.json({
      success: true,
      count: snapshot.size,
      docs: snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    });
  }
}
