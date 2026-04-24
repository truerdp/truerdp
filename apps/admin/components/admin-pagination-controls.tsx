"use client"

import { Fragment } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

type AdminPaginationControlsProps = {
  page: number
  totalPages: number
  pageSize: number
  totalCount: number
  pageStart: number
  pageEnd: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
    if (i >= 1 && i <= totalPages) {
      pages.add(i)
    }
  }

  return Array.from(pages).sort((a, b) => a - b)
}

export function AdminPaginationControls({
  page,
  totalPages,
  pageSize,
  totalCount,
  pageStart,
  pageEnd,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationControlsProps) {
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Showing {pageStart}-{pageEnd} of {totalCount}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-22">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {totalPages > 1 ? (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (page > 1) {
                      onPageChange(page - 1)
                    }
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {visiblePages.map((pageNumber, index) => {
                const previousPage = visiblePages[index - 1]
                const showEllipsis =
                  previousPage !== undefined && pageNumber - previousPage > 1

                return (
                  <Fragment key={pageNumber}>
                    {showEllipsis ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === page}
                        onClick={(event) => {
                          event.preventDefault()
                          onPageChange(pageNumber)
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (page < totalPages) {
                      onPageChange(page + 1)
                    }
                  }}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  )
}
