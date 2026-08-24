"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"

import { updateWorkoutAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export type EditableSet = {
  id?: string
  key: string
  weight: string
  reps: string
}

export type EditableExercise = {
  key: string
  id?: string
  exerciseId: string
  name?: string
  sets: EditableSet[]
}

type AvailableExercise = {
  id: string
  name: string
}

function makeKey() {
  return Math.random().toString(36).slice(2)
}

function emptySet(): EditableSet {
  return { key: makeKey(), weight: "", reps: "" }
}

function emptyExercise(): EditableExercise {
  return { key: makeKey(), exerciseId: "", sets: [emptySet()] }
}

export function WorkoutEditForm({
  workoutId,
  initialName,
  initialStartedAt,
  initialExercises,
  availableExercises,
}: {
  workoutId: string
  initialName: string | null
  initialStartedAt: Date
  initialExercises: EditableExercise[]
  availableExercises: AvailableExercise[]
}) {
  const router = useRouter()
  const [name, setName] = React.useState(initialName ?? "")
  const [startedAt, setStartedAt] = React.useState(initialStartedAt)
  const [exercises, setExercises] = React.useState(initialExercises)
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function updateSet(
    exerciseKey: string,
    setKey: string,
    changes: Partial<EditableSet>
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key !== exerciseKey
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.key === setKey ? { ...set, ...changes } : set
              ),
            }
      )
    )
  }

  function addSet(exerciseKey: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key !== exerciseKey
          ? exercise
          : { ...exercise, sets: [...exercise.sets, emptySet()] }
      )
    )
  }

  function removeSet(exerciseKey: string, setKey: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key !== exerciseKey
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.filter((set) => set.key !== setKey),
            }
      )
    )
  }

  function removeExercise(exerciseKey: string) {
    setExercises((current) =>
      current.filter((exercise) => exercise.key !== exerciseKey)
    )
  }

  function addExercise() {
    setExercises((current) => [...current, emptyExercise()])
  }

  function updateExerciseSelection(exerciseKey: string, exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey ? { ...exercise, exerciseId } : exercise
      )
    )
  }

  async function handleSave() {
    setError(null)

    for (const exercise of exercises) {
      if (!exercise.exerciseId) {
        setError("Choose an exercise for every row, or remove it.")
        return
      }
      for (const set of exercise.sets) {
        if (!set.reps || Number.isNaN(Number(set.reps))) {
          setError("Every set needs a rep count.")
          return
        }
      }
    }

    setIsSaving(true)
    try {
      await updateWorkoutAction(workoutId, {
        name: name.trim() === "" ? null : name.trim(),
        startedAt,
        exercises: exercises.map((exercise) =>
          exercise.id
            ? {
                id: exercise.id,
                sets: exercise.sets.map((set, index) => ({
                  id: set.id,
                  setNumber: index + 1,
                  weight: set.weight.trim() === "" ? null : set.weight.trim(),
                  reps: Number.parseInt(set.reps, 10) || 0,
                })),
              }
            : {
                exerciseId: exercise.exerciseId,
                sets: exercise.sets.map((set, index) => ({
                  setNumber: index + 1,
                  weight: set.weight.trim() === "" ? null : set.weight.trim(),
                  reps: Number.parseInt(set.reps, 10) || 0,
                })),
              }
        ),
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

  const usedExerciseIds = new Set(
    exercises.map((exercise) => exercise.exerciseId).filter(Boolean)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit workout</CardTitle>
        <CardDescription>Update the details of this workout.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="workout-name">Name</Label>
            <Input
              id="workout-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Workout"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {format(startedAt, "do MMM yyyy")}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startedAt}
                  onSelect={(selected) => {
                    if (selected) {
                      const updated = new Date(selected)
                      updated.setHours(
                        startedAt.getHours(),
                        startedAt.getMinutes(),
                        startedAt.getSeconds()
                      )
                      setStartedAt(updated)
                      setDatePickerOpen(false)
                    }
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {exercises.map((exercise, index) => (
            <div key={exercise.key} className="flex flex-col gap-2">
              {index > 0 && <Separator className="mb-2" />}
              <div className="flex items-center justify-between gap-4">
                {exercise.id ? (
                  <span className="text-sm font-medium">{exercise.name}</span>
                ) : (
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Select
                      value={exercise.exerciseId}
                      onValueChange={(value) =>
                        updateExerciseSelection(exercise.key, value as string)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableExercises
                          .filter(
                            (option) =>
                              !usedExerciseIds.has(option.id) ||
                              option.id === exercise.exerciseId
                          )
                          .map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${exercise.name ?? "exercise"}`}
                  onClick={() => removeExercise(exercise.key)}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.key} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-sm text-muted-foreground">
                      Set {setIndex + 1}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      className="w-24"
                      value={set.weight}
                      onChange={(event) =>
                        updateSet(exercise.key, set.key, {
                          weight: event.target.value,
                        })
                      }
                      placeholder="kg"
                      aria-label={`Set ${setIndex + 1} weight`}
                    />
                    <span className="text-sm text-muted-foreground">
                      kg ×
                    </span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      className="w-20"
                      value={set.reps}
                      onChange={(event) =>
                        updateSet(exercise.key, set.key, {
                          reps: event.target.value,
                        })
                      }
                      placeholder="reps"
                      aria-label={`Set ${setIndex + 1} reps`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove set ${setIndex + 1}`}
                      onClick={() => removeSet(exercise.key, set.key)}
                      disabled={exercise.sets.length === 1}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => addSet(exercise.key)}
                >
                  <Plus />
                  Add set
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={addExercise}
          >
            <Plus />
            Add exercise
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
