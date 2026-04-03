import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Switch } from "@workspace/ui/components/switch"
import { Slider } from "@workspace/ui/components/slider"
import { ChartBarDefault } from "@/components/chart"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Tooltip>
            <TooltipTrigger render={<Button className="mt-2">Button</Button>} />
            <TooltipContent>Click to get started</TooltipContent>
          </Tooltip>
          <Switch />
        </div>
        <div>
          <ChartBarDefault />
        </div>
        <div>
          {/* example of range slider component from shadcn: */}

          <Slider
            defaultValue={[75]}
            max={100}
            step={1}
            className="mx-auto w-full max-w-xs"
          />
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
