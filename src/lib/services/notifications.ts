import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppNotification, NotificationType } from "@/types/notification";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notifRef = collection(db, "notifications");
    await addDoc(notifRef, {
      userId,
      type,
      title,
      message,
      read: false,
      link,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}
