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
  id: string
  name: string
  sets: EditableSet[]
}

export function WorkoutEditForm({
  workoutId,
  initialName,
  initialStartedAt,
  initialExercises,
}: {
  workoutId: string
  initialName: string | null
  initialStartedAt: Date
  initialExercises: EditableExercise[]
}) {
  const router = useRouter()
  const [name, setName] = React.useState(initialName ?? "")
  const [startedAt, setStartedAt] = React.useState(initialStartedAt)
  const [exercises, setExercises] = React.useState(initialExercises)
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function updateSet(
    exerciseId: string,
    setKey: string,
    changes: Partial<EditableSet>
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
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

  function addSet(exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: [
                ...exercise.sets,
                { key: `new-${crypto.randomUUID()}`, weight: "", reps: "" },
              ],
            }
      )
    )
  }

  function removeSet(exerciseId: string, setKey: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.filter((set) => set.key !== setKey),
            }
      )
    )
  }

  function removeExercise(exerciseId: string) {
    setExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId)
    )
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      await updateWorkoutAction(workoutId, {
        name: name.trim() === "" ? null : name.trim(),
        startedAt,
        exercises: exercises.map((exercise) => ({
          id: exercise.id,
          sets: exercise.sets.map((set, index) => ({
            id: set.id,
            setNumber: index + 1,
            weight: set.weight.trim() === "" ? null : set.weight.trim(),
            reps: Number.parseInt(set.reps, 10) || 0,
          })),
        })),
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

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
            <div key={exercise.id} className="flex flex-col gap-2">
              {index > 0 && <Separator className="mb-2" />}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{exercise.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${exercise.name}`}
                  onClick={() => removeExercise(exercise.id)}
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
                        updateSet(exercise.id, set.key, {
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
                        updateSet(exercise.id, set.key, {
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
                      onClick={() => removeSet(exercise.id, set.key)}
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
                  onClick={() => addSet(exercise.id)}
                >
                  <Plus />
                  Add set
                </Button>
              </div>
            </div>
          ))}
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
