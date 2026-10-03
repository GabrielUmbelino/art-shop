import { toast } from 'sonner'
import { cn } from 'cn'

/**
 * Stand-in for actions outside the demo's scope (editorial pages, support, social login...).
 * It stays focusable and says plainly that the feature is unavailable, instead of faking success.
 */
export function ComingSoon({ className, children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-disabled="true"
      className={cn('cursor-not-allowed', className)}
      onClick={() => toast.info('Em breve: este recurso não faz parte desta demonstração.')}
      {...props}
    >
      {children}
    </button>
  )
}
