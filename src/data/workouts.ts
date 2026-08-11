import "server-only";

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
