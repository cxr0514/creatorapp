import * as React from "react"

function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const defaultClasses = "animate-pulse rounded-md bg-gray-300 dark:bg-gray-700";
  const combinedClassName = `${defaultClasses} ${className}`.trim();
  
  return (
    <div
      className={combinedClassName}
      {...props}
    />
  )
}

export { Skeleton }
