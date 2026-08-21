import "server-only";

import { eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { sets, workoutExercises, workouts } from "@/db/schema";

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

/**
 * Fetches a single workout (with exercises and sets) by id, scoped to the
 * currently authenticated user. Returns `undefined` if the workout does not
 * exist or does not belong to the current user.
 */
export async function getWorkoutByIdForCurrentUser(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return db.query.workouts.findFirst({
    where: { id: workoutId, userId },
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

export type UpdateWorkoutSetInput = {
  id?: string;
  setNumber: number;
  weight: string | null;
  reps: number;
};

export type UpdateWorkoutExerciseInput = {
  id: string;
  sets: UpdateWorkoutSetInput[];
};

export type UpdateWorkoutInput = {
  name: string | null;
  startedAt: Date;
  exercises: UpdateWorkoutExerciseInput[];
};

/**
 * Updates a workout's name, start time, and its exercises' sets, scoped to
 * the currently authenticated user. Exercise/set ids that don't belong to
 * this user's workout are ignored rather than trusted as-is, so a caller
 * can never use this to mutate another user's rows.
 */
export async function updateWorkoutForCurrentUser(
  workoutId: string,
  input: UpdateWorkoutInput
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const existing = await db.query.workouts.findFirst({
    where: { id: workoutId, userId },
    with: {
      workoutExercises: {
        with: { sets: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Workout not found");
  }

  await db
    .update(workouts)
    .set({
      name: input.name,
      startedAt: input.startedAt,
      updatedAt: new Date(),
    })
    .where(eq(workouts.id, workoutId));

  const keptExerciseIds = new Set(
    input.exercises.map((exercise) => exercise.id)
  );
  const exerciseIdsToRemove = existing.workoutExercises
    .filter((workoutExercise) => !keptExerciseIds.has(workoutExercise.id))
    .map((workoutExercise) => workoutExercise.id);

  if (exerciseIdsToRemove.length > 0) {
    await db
      .delete(workoutExercises)
      .where(inArray(workoutExercises.id, exerciseIdsToRemove));
  }

  for (const exerciseInput of input.exercises) {
    const originalExercise = existing.workoutExercises.find(
      (workoutExercise) => workoutExercise.id === exerciseInput.id
    );

    if (!originalExercise) {
      continue;
    }

    const originalSetIds = new Set(
      originalExercise.sets.map((set) => set.id)
    );
    const keptSetIds = new Set(
      exerciseInput.sets
        .filter((set) => set.id && originalSetIds.has(set.id))
        .map((set) => set.id as string)
    );
    const setIdsToRemove = originalExercise.sets
      .filter((set) => !keptSetIds.has(set.id))
      .map((set) => set.id);

    if (setIdsToRemove.length > 0) {
      await db.delete(sets).where(inArray(sets.id, setIdsToRemove));
    }

    for (const setInput of exerciseInput.sets) {
      if (setInput.id && originalSetIds.has(setInput.id)) {
        await db
          .update(sets)
          .set({
            setNumber: setInput.setNumber,
            weight: setInput.weight,
            reps: setInput.reps,
          })
          .where(eq(sets.id, setInput.id));
      } else {
        await db.insert(sets).values({
          workoutExerciseId: exerciseInput.id,
          setNumber: setInput.setNumber,
          weight: setInput.weight,
          reps: setInput.reps,
        });
      }
    }
  }
}
