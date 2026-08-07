import "server-only";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

/**
 * Fetches all workouts (with exercises and sets) belonging to the
 * currently authenticated user. Scoped to `userId` from the Clerk
 * session — never accepts a caller-supplied id — so a user can only
 * ever read their own data.
 */
export async function getWorkoutsForCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return db.query.workouts.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    with: {
      workoutExercises: {
        orderBy: { order: "asc" },
        with: {
          exercise: true,
          sets: {
            orderBy: { setNumber: "asc" },
          },
        },
      },
    },
  });
}
