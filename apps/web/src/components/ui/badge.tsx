import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge component with variants aligned to mobile app
 * See packages/shared/src/design-tokens.ts for color definitions
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Original variants
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",

        // Additional variants aligned with mobile app
        success:
          "border-transparent bg-green-100 text-green-700 hover:bg-green-100/80",
        warning:
          "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100/80",
        error:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-100/80",
        info:
          "border-transparent bg-blue-100 text-blue-600 hover:bg-blue-100/80",

        // Claim status variants using CSS variables
        draft:
          "border-[hsl(var(--status-draft-border))] bg-[hsl(var(--status-draft-bg))] text-[hsl(var(--status-draft-text))]",
        submitted:
          "border-[hsl(var(--status-submitted-border))] bg-[hsl(var(--status-submitted-bg))] text-[hsl(var(--status-submitted-text))]",
        approved:
          "border-[hsl(var(--status-approved-border))] bg-[hsl(var(--status-approved-bg))] text-[hsl(var(--status-approved-text))]",
        sent:
          "border-[hsl(var(--status-sent-border))] bg-[hsl(var(--status-sent-bg))] text-[hsl(var(--status-sent-text))]",
        acknowledged:
          "border-[hsl(var(--status-acknowledged-border))] bg-[hsl(var(--status-acknowledged-bg))] text-[hsl(var(--status-acknowledged-text))]",
        closed:
          "border-[hsl(var(--status-closed-border))] bg-[hsl(var(--status-closed-bg))] text-[hsl(var(--status-closed-text))]",
        rejected:
          "border-[hsl(var(--status-rejected-border))] bg-[hsl(var(--status-rejected-bg))] text-[hsl(var(--status-rejected-text))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
