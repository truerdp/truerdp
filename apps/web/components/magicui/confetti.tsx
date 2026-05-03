"use client"

import {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import confetti from "canvas-confetti"
import type {
  CreateTypes as ConfettiInstance,
  GlobalOptions as ConfettiGlobalOptions,
  Options as ConfettiOptions,
} from "canvas-confetti"

type ConfettiApi = {
  fire: (options?: ConfettiOptions) => void
}

type ConfettiProps = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
  children?: ReactNode
}

export type ConfettiRef = ConfettiApi | null

export const ConfettiContext = createContext<ConfettiApi>({} as ConfettiApi)

const ConfettiComponent = forwardRef<ConfettiRef, ConfettiProps>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    ...rest
  } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node) {
        if (instanceRef.current) {
          return
        }

        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        })
        return
      }

      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    },
    [globalOptions]
  )

  const fire = useCallback(
    async (opts: ConfettiOptions = {}) => {
      try {
        await instanceRef.current?.({ ...options, ...opts })
      } catch (error) {
        console.error("Confetti error:", error)
      }
    },
    [options]
  )

  const api = useMemo<ConfettiApi>(
    () => ({
      fire,
    }),
    [fire]
  )

  useImperativeHandle(ref, () => api, [api])

  useEffect(() => {
    if (manualstart) {
      return
    }

    ;(async () => {
      try {
        await fire()
      } catch (error) {
        console.error("Confetti effect error:", error)
      }
    })()
  }, [manualstart, fire])

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  )
})

ConfettiComponent.displayName = "Confetti"

export const Confetti = ConfettiComponent
