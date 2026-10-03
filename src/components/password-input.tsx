import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className="pr-10" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-subtle hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring"
      >
        {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
      </button>
    </div>
  )
}
