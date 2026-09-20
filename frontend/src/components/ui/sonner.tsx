import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/components/theme/ThemeProvider"

const Toaster = ({ ...props }) => {
  const { resolved } = useTheme()

  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border border-border bg-popover text-popover-foreground shadow-pop text-small",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-sm",
          cancelButton: "bg-muted text-muted-foreground rounded-sm",
        },
      }}
      style={{
        "--normal-bg": "var(--surface-raised)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  )
}

export { Toaster }
