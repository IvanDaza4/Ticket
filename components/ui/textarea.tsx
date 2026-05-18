import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/40 aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive bg-input/60 dark:bg-input/50 flex field-sizing-content min-h-16 w-full rounded-md border-2 border-input px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] hover:border-border/80 hover:bg-input/70 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
