"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useState } from "react"
import { themeBgColor, themeViaColor } from "@windrun-huaiin/base-ui/lib"
import { cn } from "@windrun-huaiin/lib/utils"

interface DelayedImgProps extends ImageProps {
  wrapperClassName?: string
  placeholderClassName?: string
}

const ENV_DELAY_ENABLED =
  process.env.NEXT_PUBLIC_DELAYED_IMG_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_DELAY_REVEAL_ENABLED === "true"

const rawDelaySeconds =
  process.env.NEXT_PUBLIC_DELAYED_IMG_SECONDS ??
  process.env.NEXT_PUBLIC_DELAY_REVEAL_SECONDS ??
  "0"

const parsedDelaySeconds = Number(rawDelaySeconds)
const ENV_DELAY_MS = Number.isFinite(parsedDelaySeconds) && parsedDelaySeconds > 0
  ? parsedDelaySeconds * 1000
  : 0

export function DelayedImg({
  alt,
  wrapperClassName,
  placeholderClassName,
  className,
  onLoad,
  ...imageProps
}: DelayedImgProps) {
  const shouldDelay = ENV_DELAY_ENABLED && ENV_DELAY_MS > 0
  const [isMounted, setIsMounted] = useState(!shouldDelay)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!shouldDelay || isMounted) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsMounted(true)
    }, ENV_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [isMounted, shouldDelay])

  return (
    <div className={cn("relative", wrapperClassName)}>
      {(!isMounted || !isLoaded) && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-[inherit] border animate-pulse shadow-sm bg-white/70 dark:bg-white/5",
            themeBgColor,
            placeholderClassName,
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-28 rounded-[inherit] bg-linear-to-b from-white/80 to-transparent dark:from-white/14 dark:to-transparent",
              themeViaColor,
            )}
          />
          <div className="absolute inset-0 rounded-[inherit] bg-white/20 dark:bg-white/0" />
        </div>
      )}
      {isMounted && (
        <Image
          {...imageProps}
          alt={alt}
          onLoad={(event) => {
            setIsLoaded(true)
            onLoad?.(event)
          }}
          className={cn(
            "transition duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
    </div>
  )
}
