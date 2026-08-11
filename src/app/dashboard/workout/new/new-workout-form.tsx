"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
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
  CardContent,
} from "@/components/ui/card"
import { createWorkout } from "./actions"

type Exercise = {
  id: string
  name: string
}

type DraftSet = {
  key: string
  weight: string
  reps: string
}

type DraftExercise = {
  key: string
  exerciseId: string
  sets: DraftSet[]
}

function makeKey() {
  return Math.random().toString(36).slice(2)
}

function emptySet(): DraftSet {
  return { key: makeKey(), weight: "", reps: "" }
}

function emptyExercise(): DraftExercise {
  return { key: makeKey(), exerciseId: "", sets: [emptySet()] }
}

export function NewWorkoutForm({ exercises }: { exercises: Exercise[] }) {
  const [name, setName] = React.useState("")
  const [date, setDate] = React.useState<Date>(new Date())
  const [datePopoverOpen, setDatePopoverOpen] = React.useState(false)
  const [draftExercises, setDraftExercises] = React.useState<
    DraftExercise[]
  >([emptyExercise()])
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function updateExercise(key: string, exerciseId: string) {
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.key === key ? { ...exercise, exerciseId } : exercise
      )
    )
  }

  function addExercise() {
    setDraftExercises((current) => [...current, emptyExercise()])
  }

  function removeExercise(key: string) {
    setDraftExercises((current) =>
      current.filter((exercise) => exercise.key !== key)
    )
  }

  function addSet(exerciseKey: string) {
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? { ...exercise, sets: [...exercise.sets, emptySet()] }
          : exercise
      )
    )
  }

  function removeSet(exerciseKey: string, setKey: string) {
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.key !== setKey),
            }
          : exercise
      )
    )
  }

  function updateSet(
    exerciseKey: string,
    setKey: string,
    field: "weight" | "reps",
    value: string
  ) {
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.key === setKey ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      )
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (draftExercises.length === 0) {
      setError("Add at least one exercise.")
      return
    }

    for (const exercise of draftExercises) {
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

    const payload = {
      name: name.trim().length > 0 ? name.trim() : null,
      startedAt: date,
      exercises: draftExercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets.map((set) => ({
          weight: set.weight.trim().length > 0 ? Number(set.weight) : null,
          reps: Number(set.reps),
        })),
      })),
    }

    startTransition(async () => {
      try {
        await createWorkout(payload)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create workout."
        )
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          New workout
        </h1>
        <p className="text-sm text-muted-foreground">
          Log a workout with its exercises and sets.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workout-name">Name</Label>
              <Input
                id="workout-name"
                placeholder="e.g. Push day"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon />
                      {format(date, "do MMM yyyy")}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selected) => {
                      if (selected) {
                        setDate(selected)
                        setDatePopoverOpen(false)
                      }
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {draftExercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.key}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Exercise {exerciseIndex + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeExercise(exercise.key)}
                  disabled={draftExercises.length === 1}
                >
                  <Trash2 />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Exercise</Label>
                  <Select
                    value={exercise.exerciseId}
                    onValueChange={(value) =>
                      updateExercise(exercise.key, value as string)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={set.key}
                      className="flex items-end gap-2"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${set.key}-weight`}>
                          Set {setIndex + 1} weight (kg)
                        </Label>
                        <Input
                          id={`${set.key}-weight`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.5"
                          value={set.weight}
                          onChange={(event) =>
                            updateSet(
                              exercise.key,
                              set.key,
                              "weight",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${set.key}-reps`}>Reps</Label>
                        <Input
                          id={`${set.key}-reps`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step="1"
                          value={set.reps}
                          onChange={(event) =>
                            updateSet(
                              exercise.key,
                              set.key,
                              "reps",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeSet(exercise.key, set.key)}
                        disabled={exercise.sets.length === 1}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSet(exercise.key)}
                  className="self-start"
                >
                  <Plus />
                  Add set
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addExercise}
            className="self-start"
          >
            <Plus />
            Add exercise
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save workout"}
          </Button>
          <Button type="button" variant="ghost" render={<Link href="/dashboard">Cancel</Link>} />
        </div>
      </form>
    </div>
  )
}
