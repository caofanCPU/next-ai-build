"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useState } from "react"
import { themeBgColor, themeSvgIconColor} from "@windrun-huaiin/base-ui/lib"
import { cn } from "@windrun-huaiin/lib/utils"
import { SnakeLoadingFrame } from "./snake-loading-frame"

interface DelayedImgProps extends ImageProps {
  wrapperClassName?: string
  placeholderClassName?: string
}

const ENV_DELAY_ENABLED = process.env.NEXT_PUBLIC_DELAYED_IMG_ENABLED === "true"

const rawDelaySeconds = process.env.NEXT_PUBLIC_DELAYED_IMG_SECONDS ?? "0"

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
        <SnakeLoadingFrame
          shape="rounded-rect"
          loading
          themeColor={themeSvgIconColor}
          className={cn(
            "absolute inset-0 rounded-[inherit] border shadow-sm bg-white/70 dark:bg-white/5",
            themeBgColor,
            placeholderClassName,
          )}
          contentClassName="h-full w-full"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit] bg-white/20 dark:bg-white/0"
          />
        </SnakeLoadingFrame>
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
