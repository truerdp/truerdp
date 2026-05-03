import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

export type PlanStatusFilter = "all" | "active" | "inactive"
export type PlanSort = "name" | "cpu" | "price"

type AdminPlansControlsProps = {
  searchValue: string
  statusFilter: PlanStatusFilter
  sortBy: PlanSort
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: PlanStatusFilter) => void
  onSortChange: (value: PlanSort) => void
}

export function AdminPlansHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Create, update, and manage plan availability with pricing durations.
        </p>
      </div>
      <Link href="/plans/create">
        <Button>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Create Plan
        </Button>
      </Link>
    </div>
  )
}

export function AdminPlansControls({
  searchValue,
  statusFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
}: AdminPlansControlsProps) {
  return (
    <div className="my-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="w-full md:max-w-xs">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by plan name or ID"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={[statusFilter]}
          onValueChange={(value) => {
            const next = value[0]
            if (next === "all" || next === "active" || next === "inactive") {
              onStatusFilterChange(next)
            }
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="active">Active</ToggleGroupItem>
          <ToggleGroupItem value="inactive">Inactive</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              if (value === "name" || value === "cpu" || value === "price") {
                onSortChange(value)
              }
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="cpu">CPU</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
