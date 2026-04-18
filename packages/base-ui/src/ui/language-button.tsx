/**
 * @license
 * MIT License
 * Copyright (c) 2026 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use client";
import * as React from "react"
import { cn } from "@windrun-huaiin/lib/utils"

export interface LanguageButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
}

const LanguageButton = React.forwardRef<HTMLButtonElement, LanguageButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
                    {
                        "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
                        "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
                        "h-10 px-4 py-2": size === "default",
                        "h-9 px-3": size === "sm",
                        "h-11 px-8": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
LanguageButton.displayName = "Button"

export { LanguageButton }