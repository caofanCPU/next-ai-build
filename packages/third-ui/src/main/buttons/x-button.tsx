'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDownIcon, Loader2Icon } from '@windrun-huaiin/base-ui/icons'
import { themeBgColor, themeBorderColor, themeIconColor, themeMainBgColor } from '@windrun-huaiin/base-ui/lib'
import { cn } from '@windrun-huaiin/lib/utils'
import { PressFeedback, resolvePressFeedbackMode, usePressFeedback } from './use-press-feedback'

type XButtonVariant = 'default' | 'soft' | 'subtle'
type XButtonPressKey = 'single' | 'main' | 'dropdown'

const PRESS_FEEDBACK_MS = 180
const xButtonPressSubtleClass = 'translate-y-px scale-[0.98] shadow-inner brightness-95'
const xButtonPressSolidClass = 'translate-y-[2px] scale-[0.95] shadow-[inset_0_2px_4px_rgba(15,23,42,0.18)] brightness-95'

interface BaseButtonConfig {
  icon: ReactNode
  text: string
  onClick: () => void | Promise<void>
  disabled?: boolean
}

interface MenuItemConfig extends BaseButtonConfig {
  tag?: {
    text: string
    color?: string
  }
  splitTopBorder?: boolean
}

interface SingleButtonProps {
  type: 'single'
  button: BaseButtonConfig
  loadingText?: string
  minWidth?: string
  className?: string
  iconClassName?: string
  variant?: XButtonVariant
  pressFeedback?: PressFeedback
}

interface SplitButtonProps {
  type: 'split'
  mainButton: BaseButtonConfig
  menuItems: MenuItemConfig[]
  loadingText?: string
  menuWidth?: string
  className?: string
  mainButtonClassName?: string
  dropdownButtonClassName?: string
  iconClassName?: string
  variant?: XButtonVariant
  pressFeedback?: PressFeedback
}

type xButtonProps = SingleButtonProps | SplitButtonProps

export function XButton(props: xButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const pressMode = resolvePressFeedbackMode(props.pressFeedback)
  const { pressedKey, flash, getPressProps } = usePressFeedback<XButtonPressKey>(PRESS_FEEDBACK_MS)

  const { iconClassName } = props
  const defaultIconClass = "w-5 h-5"
  const variant = props.variant ?? 'default'
  const finalIconClass = cn(
    variant === 'default' ? '' : themeIconColor,
    iconClassName || defaultIconClass
  )

  const loadingIconClass = cn(finalIconClass, "mr-1 animate-spin")

  const chevronIconClass = "w-6 h-6"

  const renderIcon = (icon: ReactNode) => {
    if (React.isValidElement<{ className?: string }>(icon)) {
      return React.cloneElement(icon, {
        className: cn(finalIconClass, icon.props.className),
      });
    }
    return icon;
  };

  useEffect(() => {
    if (props.type === 'split') {
      const handleClickOutside = (event: MouseEvent) => {
        if (splitRef.current && !splitRef.current.contains(event.target as Node)) {
          setMenuOpen(false)
        }
      }

      if (menuOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [menuOpen, props.type])

  const handleButtonClick = async (onClick: () => void | Promise<void>) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await onClick()
    } catch (error) {
      console.error('Button click error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonPressClass = () => pressMode === 'solid' ? xButtonPressSolidClass : xButtonPressSubtleClass
  const baseButtonClass = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-[transform,background-color,filter,box-shadow,border-color,color]"
  const singleButtonVariantClass = variant === 'soft'
    ? cn(
        themeBgColor,
        themeIconColor,
        themeBorderColor,
        "border hover:brightness-95"
      )
    : variant === 'subtle'
      ? cn(
          themeMainBgColor,
          themeIconColor,
          "border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
        )
      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700"
  const splitMainButtonVariantClass = variant === 'soft'
    ? cn(
        "bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
        themeIconColor
      )
    : variant === 'subtle'
      ? cn(
          "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800",
          themeIconColor
        )
      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700"
  const splitDropdownVariantClass = variant === 'soft'
    ? cn(
        "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 sm:border-l",
        themeIconColor,
        themeBorderColor
      )
    : variant === 'subtle'
      ? cn(
          "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 sm:border-l",
          themeIconColor,
          "border-neutral-200 dark:border-neutral-800"
      )
    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 sm:border-l sm:border-neutral-300 sm:dark:border-neutral-700"
  const splitContainerVariantClass = variant === 'soft'
    ? cn('border', themeBorderColor)
    : variant === 'subtle'
      ? 'border border-neutral-200 dark:border-neutral-800'
      : null
  const disabledClass = "opacity-60 cursor-not-allowed"

  if (props.type === 'single') {
    const { button, loadingText, minWidth = 'min-w-[110px]', className = '' } = props
    const isDisabled = button.disabled || isLoading
    const isPressed = pressMode !== 'none' && pressedKey === 'single' && !button.disabled
    const actualLoadingText = loadingText || button.text?.trim() || 'Loading...'

    return (
      <button
        onClick={() => {
          if (!isDisabled && pressMode !== 'none') {
            flash('single')
          }
          handleButtonClick(button.onClick)
        }}
        disabled={isDisabled}
        {...(pressMode !== 'none' && !isDisabled ? getPressProps('single') : {})}
        className={cn(
          "w-full sm:w-auto",
          minWidth,
          baseButtonClass,
          singleButtonVariantClass,
          "rounded-full",
          isPressed && getButtonPressClass(),
          isDisabled && disabledClass,
          className
        )}
        title={button.text}
      >
        {isLoading ? (
          <>
            <Loader2Icon className={loadingIconClass} />
            <span>{actualLoadingText}</span>
          </>
        ) : (
          <>
            {renderIcon(button.icon)}
            <span>{button.text}</span>
          </>
        )}
      </button>
    )
  }

  const { mainButton, menuItems, loadingText, menuWidth = 'w-full sm:w-40', className = '', mainButtonClassName = '', dropdownButtonClassName = '' } = props
  const isMainDisabled = mainButton.disabled || isLoading
  const isMainPressed = pressMode !== 'none' && pressedKey === 'main' && !mainButton.disabled
  const isDropdownPressed = pressMode !== 'none' && pressedKey === 'dropdown' && !isLoading
  const actualLoadingText = loadingText || mainButton.text?.trim() || 'Loading...'

  return (
    <div className={cn(
      "relative inline-flex flex-row items-stretch w-full sm:w-fit rounded-full gap-0",
      splitContainerVariantClass,
      menuOpen && "z-90",
      className
    )}
      ref={splitRef}
    >
      <button
        onClick={() => {
          if (!isMainDisabled && pressMode !== 'none') {
            flash('main')
          }
          handleButtonClick(mainButton.onClick)
        }}
        disabled={isMainDisabled}
        {...(pressMode !== 'none' && !isMainDisabled ? getPressProps('main') : {})}
        className={cn(
          "flex-1 min-w-0 sm:min-w-[100px] sm:flex-initial rounded-l-full",
          baseButtonClass,
          splitMainButtonVariantClass,
          isMainPressed && getButtonPressClass(),
          isMainDisabled && disabledClass,
          mainButtonClassName
        )}
        onMouseDown={e => { if (e.button === 2) e.preventDefault() }}
        title={mainButton.text}
      >
        {isLoading ? (
          <>
            <Loader2Icon className={loadingIconClass} />
            <span>{actualLoadingText}</span>
          </>
        ) : (
          <>
            {renderIcon(mainButton.icon)}
            <span>{mainButton.text}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          if (!isLoading && pressMode !== 'none') {
            flash('dropdown')
          }
          setMenuOpen(!menuOpen)
        }}
        disabled={isLoading}
        {...(pressMode !== 'none' && !isLoading ? getPressProps('dropdown') : {})}
        className={cn(
          "w-12 rounded-r-full",
          baseButtonClass,
          splitDropdownVariantClass,
          isDropdownPressed && getButtonPressClass(),
          isLoading && disabledClass,
          dropdownButtonClassName
        )}
        aria-label="Open menu"
      >
        <ChevronDownIcon className={cn(chevronIconClass, menuOpen && "rotate-180", "transition-transform")} />
      </button>

      {menuOpen && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 overflow-hidden",
            menuWidth
          )}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setMenuOpen(false)
                handleButtonClick(item.onClick)
              }}
              disabled={item.disabled || isLoading}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors",
                item.disabled && disabledClass,
                item.splitTopBorder && "border-t border-neutral-200 dark:border-neutral-700"
              )}
            >
              {renderIcon(item.icon)}
              <span className="flex-1">{item.text}</span>
              {item.tag && (
                <span className={cn("px-1.5 py-0.5 text-xs rounded", item.tag.color || "bg-blue-100 text-blue-800")}>
                  {item.tag.text}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
