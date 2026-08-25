import { adminDb } from "../src/lib/firebase/admin";
import { ProblemStatus } from "../src/types/problem";

async function run() {
  try {
    let q = adminDb.collection("problems")
      .where("status", "==", ProblemStatus.PUBLISHED)
      .orderBy("createdAt", "desc")
      .limit(20);

    const snapshot = await q.get();
    console.log(`Found ${snapshot.size} problems.`);
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data().title, doc.data().status);
    });
  } catch (error) {
    console.error("Query failed:", error);
  }
}

run().catch(console.error);
