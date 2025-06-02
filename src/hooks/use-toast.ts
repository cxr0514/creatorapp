import { toast } from 'sonner'

interface ToastOptions {
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  return {
    toast: (options: ToastOptions & { title?: string }) => {
      if (options.variant === 'destructive') {
        toast.error(options.title || 'Error', {
          description: options.description
        })
      } else {
        toast.success(options.title || 'Success', {
          description: options.description
        })
      }
    }
  }
}
