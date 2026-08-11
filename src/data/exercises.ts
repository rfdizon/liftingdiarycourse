import "server-only";

import { db } from "@/db";

/**
 * Exercises are a shared, global reference list (no owner column), so
 * unlike workouts they don't need to be scoped to a user.
 */
export async function getAllExercises() {
  return db.query.exercises.findMany({
    orderBy: { name: "asc" },
  });
}
