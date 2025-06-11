import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const toast = ({ title, description, action }: ToastProps) => {
  return sonnerToast(title || description, {
    description: title ? description : undefined,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  })
}

toast.success = (message: string) => sonnerToast.success(message)
toast.error = (message: string) => sonnerToast.error(message)
toast.info = (message: string) => sonnerToast.info(message)
toast.warning = (message: string) => sonnerToast.warning(message)

export { toast }
export const useToast = () => ({ toast })
