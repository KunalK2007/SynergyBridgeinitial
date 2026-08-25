import { adminDb } from "../src/lib/firebase/admin";

async function run() {
  const certsSnap = await adminDb.collection("certificates").get();
  console.log(`Found ${certsSnap.size} certificates.`);
  certsSnap.forEach((doc: any) => {
    console.log(doc.id, doc.data());
  });
}

run().catch(console.error);
