'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDownIcon, Loader2Icon } from '@windrun-huaiin/base-ui/icons'
import { themeBgColor, themeBorderColor, themeIconColor, themeMainBgColor } from '@windrun-huaiin/base-ui/lib'
import { cn } from '@windrun-huaiin/lib/utils'

type XButtonVariant = 'default' | 'soft' | 'subtle'

// base button config
interface BaseButtonConfig {
  icon: ReactNode
  text: string
  onClick: () => void | Promise<void>
  disabled?: boolean
}

// menu item config
interface MenuItemConfig extends BaseButtonConfig {
  tag?: {
    text: string
    color?: string
  }
  splitTopBorder?: boolean
}

// single button config
interface SingleButtonProps {
  type: 'single'
  button: BaseButtonConfig
  loadingText?: string
  minWidth?: string
  className?: string
  iconClassName?: string
  variant?: XButtonVariant
}

// split button config
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
}

type xButtonProps = SingleButtonProps | SplitButtonProps

export function XButton(props: xButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // click outside to close menu
  useEffect(() => {
    if (props.type === 'split') {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // handle button click
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

  // base style class
  const baseButtonClass = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors"
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
  const disabledClass = "opacity-60 cursor-not-allowed"

  if (props.type === 'single') {
    const { button, loadingText, minWidth = 'min-w-[110px]', className = '' } = props
    const isDisabled = button.disabled || isLoading
    // loadingText: props.loadingText > button.text > 'Loading...'
    const actualLoadingText = loadingText || button.text?.trim() || 'Loading...'

    return (
      <button
        onClick={() => handleButtonClick(button.onClick)}
        disabled={isDisabled}
        className={cn(
          "w-full sm:w-auto",
          minWidth,
          baseButtonClass,
          singleButtonVariantClass,
          "rounded-full",
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

  // Split button
  const { mainButton, menuItems, loadingText, menuWidth = 'w-full sm:w-40', className = '', mainButtonClassName = '', dropdownButtonClassName = '' } = props
  const isMainDisabled = mainButton.disabled || isLoading
  // loadingText prioty：props.loadingText > mainButton.text > 'Loading...'
  const actualLoadingText = loadingText || mainButton.text?.trim() || 'Loading...'

  return (
    <div className={cn(
      "relative flex flex-row items-stretch w-full sm:w-auto rounded-full gap-0",
      menuOpen && "z-[90]",
      variant === 'soft'
        ? cn(themeBgColor, themeBorderColor, "border")
        : variant === 'subtle'
          ? cn(themeMainBgColor, "border border-neutral-200 dark:border-neutral-800")
          : "bg-neutral-200 dark:bg-neutral-800",
      className
    )}>
      {/* left main button */}
      <button
        onClick={() => handleButtonClick(mainButton.onClick)}
        disabled={isMainDisabled}
        className={cn(
          "min-w-0 flex-1",
          baseButtonClass,
          splitMainButtonVariantClass,
          "rounded-l-full rounded-r-none",
          isMainDisabled && disabledClass,
          mainButtonClassName
        )}
        onMouseDown={e => { if (e.button === 2) e.preventDefault() }}
      >
        {isLoading ? (
          <>
            <Loader2Icon className={loadingIconClass} />
            <span>{actualLoadingText}</span>
          </>
        ) : (
          <>
            {renderIcon(mainButton.icon)}
            <span className="min-w-0 truncate">{mainButton.text}</span>
          </>
        )}
      </button>

      {/* right dropdown button */}
      <button
        type="button"
        className={cn(
          "flex h-full w-9 shrink-0 items-center justify-center px-0 py-1.5 cursor-pointer transition rounded-r-full rounded-l-none border-l sm:w-10",
          splitDropdownVariantClass,
          dropdownButtonClassName
        )}
        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
        aria-label="More actions"
        aria-expanded={menuOpen}
      >
        <ChevronDownIcon className={chevronIconClass} />
      </button>

      {/* dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`absolute right-0 top-full ${menuWidth} bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white text-sm rounded-xl shadow-lg z-[100] border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-fade-in`}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleButtonClick(item.onClick)
                setMenuOpen(false)
              }}
              disabled={item.disabled}
              className={`flex items-center w-full px-4 py-3 transition hover:bg-neutral-300 dark:hover:bg-neutral-600 text-left relative ${item.disabled ? disabledClass : ''}`}
              style={item.splitTopBorder ? { borderTop: '1px solid #AC62FD' } : undefined}
            >
              <span className="flex items-center">
                {item.icon}
                <span>{item.text}</span>
              </span>
              {item.tag && (
                <span
                  className="absolute right-3 top-1 text-[10px] font-semibold"
                  style={{ color: item.tag.color || '#A855F7', pointerEvents: 'none' }}
                >
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
