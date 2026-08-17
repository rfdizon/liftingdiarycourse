import "server-only";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
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
 * Fetches a single workout (with exercises and sets) belonging to the
 * currently authenticated user. Scoped to `userId` from the Clerk
 * session — never accepts the workout id as the sole filter — so a
 * user can never read another user's workout.
 */
export async function getWorkoutForCurrentUser(workoutId: string) {
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

type NewWorkoutSet = {
  weight: number | null;
  reps: number;
};

type NewWorkoutExercise = {
  exerciseId: string;
  sets: NewWorkoutSet[];
};

type NewWorkoutInput = {
  name: string | null;
  startedAt: Date;
  exercises: NewWorkoutExercise[];
};

/**
 * Creates a workout (with its exercises and sets) owned by the currently
 * authenticated user. Everything is written in a single transaction.
 */
export async function createWorkoutForCurrentUser(input: NewWorkoutInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return db.transaction(async (tx) => {
    const [workout] = await tx
      .insert(workouts)
      .values({
        userId,
        name: input.name,
        startedAt: input.startedAt,
      })
      .returning();

    for (const [index, exercise] of input.exercises.entries()) {
      const [workoutExercise] = await tx
        .insert(workoutExercises)
        .values({
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: index,
        })
        .returning();

      if (exercise.sets.length > 0) {
        await tx.insert(sets).values(
          exercise.sets.map((set, setIndex) => ({
            workoutExerciseId: workoutExercise.id,
            setNumber: setIndex + 1,
            weight: set.weight === null ? null : set.weight.toString(),
            reps: set.reps,
          }))
        );
      }
    }

    return workout;
  });
}

/**
 * Updates a workout (and replaces its exercises/sets) owned by the
 * currently authenticated user. Scoped to `userId` so a caller-supplied
 * `workoutId` can never target another user's workout. Everything is
 * written in a single transaction.
 */
export async function updateWorkoutForCurrentUser(
  workoutId: string,
  input: NewWorkoutInput
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return db.transaction(async (tx) => {
    const [workout] = await tx
      .update(workouts)
      .set({
        name: input.name,
        startedAt: input.startedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
      .returning();

    if (!workout) {
      throw new Error("Workout not found");
    }

    await tx
      .delete(workoutExercises)
      .where(eq(workoutExercises.workoutId, workout.id));

    for (const [index, exercise] of input.exercises.entries()) {
      const [workoutExercise] = await tx
        .insert(workoutExercises)
        .values({
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: index,
        })
        .returning();

      if (exercise.sets.length > 0) {
        await tx.insert(sets).values(
          exercise.sets.map((set, setIndex) => ({
            workoutExerciseId: workoutExercise.id,
            setNumber: setIndex + 1,
            weight: set.weight === null ? null : set.weight.toString(),
            reps: set.reps,
          }))
        );
      }
    }

    return workout;
  });
}
