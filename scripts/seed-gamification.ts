import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// Initialize Firebase Admin
if (getApps().length === 0) {
  // Use path.resolve to handle Windows paths correctly
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : path.resolve(__dirname, "../../serviceAccountKey.json");

  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

const db = getFirestore();

async function seedGamification() {
  console.log("🌱 Seeding Gamification Profiles...");
  const studentsSnap = await db.collection("studentProfiles").get();
  
  const batch = db.batch();
  let count = 0;

  for (const doc of studentsSnap.docs) {
    const data = doc.data();
    
    // Check if gamification profile exists
    const gamificationRef = db.collection("gamificationProfiles").doc(data.userId);
    const gSnap = await gamificationRef.get();
    
    if (!gSnap.exists) {
      // Create baseline profile
      batch.set(gamificationRef, {
        userId: data.userId,
        xp: 150, // Base XP for seeded students
        level: 2,
        lifetimeXp: 150,
        currentStreak: 1,
        longestStreak: 1,
        totalProjectsCompleted: 0,
        totalTasksCompleted: 0,
        totalMilestonesCompleted: 0,
        totalProblemsSolved: 0,
        totalAchievements: 1,
        showOnLeaderboard: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Award Profile Pioneer achievement
      const achievementRef = db.collection("users").doc(data.userId).collection("achievements").doc("profile-pioneer");
      batch.set(achievementRef, {
        id: `${data.userId}_profile-pioneer`,
        userId: data.userId,
        achievementId: "profile-pioneer",
        unlockedAt: new Date().toISOString(),
        progress: 1,
        completed: true,
      });

      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Seeded ${count} gamification profiles with baseline XP and 1 achievement.`);
  } else {
    console.log("ℹ️ No new gamification profiles needed seeding.");
  }
}

seedGamification()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding gamification:", error);
    process.exit(1);
  });
