'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@windrun-huaiin/lib/utils'

interface AIPromptTextareaProps {
  /**
   * Textarea value reference
   */
  value: string
  /**
   * Textarea value change handler
   */
  onChange: (value: string) => void
  /**
   * Word limit value reference
   */
  isWordLimit: boolean
  /**
   * Word limit value change handler
   */
  onWordLimitChange: (isLimit: boolean) => void
  /**
   * Placeholder
   */
  placeholder?: string
  /**
   * Disabled switch condition, default is false
   */
  disabled?: boolean
  /**
   * Maximum words
   */
  maxWords?: number
  /**
   * Word count unit title
   */
  wordUnitTitle?: string
  /**
   * Minimum height, px
   */
  minHeight?: number
  /**
   * Maximum height, px
   */
  maxHeight?: number
  /**
   * Word count switch, default is true
   */
  showWordCount?: boolean
  /**
   * Auto scroll switch, default is true
   */
  autoScroll?: boolean
  /**
   * Extra scroll space, px
   */
  extraScrollSpace?: number
  /**
   * Custome tailwindcss style
   */
  className?: string
  /**
   * Title text, if not provided, no title will be rendered
   */
  title?: string
  /**
   * Description text
   */
  description?: string
  /**
   * Embed title inside textarea, default is false
   */
  embed?: boolean
}

export function AIPromptTextarea({
  value,
  onChange,
  placeholder = "Enter your prompt...",
  disabled = false,
  maxWords = 400,
  wordUnitTitle = "words",
  minHeight = 150,
  maxHeight = 300,
  className = "",
  showWordCount = true,
  autoScroll = true,
  extraScrollSpace = 100,
  isWordLimit,
  onWordLimitChange,
  title,
  description,
  embed = false
}: AIPromptTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // count words
  const wordArray = value.trim().split(/\s+/).filter(Boolean)
  const wordCount = wordArray.length

  // auto adjust textarea height
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const oldHeight = textarea.style.height
      
      // reset height
      textarea.style.height = 'auto'
      
      // calculate content height
      const contentHeight = textarea.scrollHeight
      
      // auto adjust height between min and max height
      let newHeight = Math.max(contentHeight, minHeight)
      newHeight = Math.min(newHeight, maxHeight)
      
      textarea.style.height = `${newHeight}px`
      
      // if content height is greater than max height, show scrollbar
      if (contentHeight > maxHeight) {
        textarea.style.overflowY = 'auto'
      } else {
        textarea.style.overflowY = 'hidden'
      }
      
      // if height increased and auto scroll is enabled, scroll to appropriate position
      if (autoScroll && (newHeight > parseInt(oldHeight) || !oldHeight)) {
        setTimeout(() => {
          const rect = textarea.getBoundingClientRect()
          window.scrollTo({
            top: window.pageYOffset + rect.bottom + extraScrollSpace - window.innerHeight,
            behavior: 'smooth'
          })
        }, 0)
      }
    }
  }

  // when value changes, adjust height
  useEffect(() => {
    const timer = setTimeout(() => {
      adjustTextareaHeight()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minHeight, maxHeight, autoScroll, extraScrollSpace])

  // handle input, limit max words
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value
    const words = inputValue.trim().split(/\s+/).filter(Boolean)
    
    // if already reached max words, and this input will exceed limit, do not update
    if (wordCount >= maxWords && words.length > maxWords) {
      onWordLimitChange(true)
      return
    }
    
    if (words.length > maxWords) {
      onChange(words.slice(0, maxWords).join(' '))
      onWordLimitChange(true)
    } else {
      onChange(inputValue)
      onWordLimitChange(false)
    }
  }

  // when paste, also check word count
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData.getData('text')
    const currentWords = value.trim().split(/\s+/).filter(Boolean)
    const pasteWords = paste.trim().split(/\s+/).filter(Boolean)
    
    if (currentWords.length >= maxWords) {
      e.preventDefault()
      onWordLimitChange(true)
      return
    }
    
    // only allow paste remaining words
    const allowed = maxWords - currentWords.length
    if (pasteWords.length > allowed) {
      e.preventDefault()
      const newWords = currentWords.concat(pasteWords.slice(0, allowed))
      onChange(newWords.join(' '))
      onWordLimitChange(true)
    }
  }

  // 渲染标题组件
  const renderTitle = () => {
    if (!title?.trim()) return null
    
    return (
      <div className="space-y-1">
        {title && <span className="text-xl font-semibold text-foreground">{title}</span>}
        {description?.trim() && <span className="text-sm text-gray-400 ml-2">{description}</span>}
      </div>
    )
  }

  // 渲染textarea组件
  const renderTextarea = (isEmbedded = false) => (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleInputChange}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full p-4 bg-transparent transition-colors text-foreground placeholder-muted-foreground placeholder:text-base disabled:bg-muted disabled:cursor-not-allowed resize-none',
        isEmbedded 
          ? 'border-0 hover:border-2 hover:border-purple-500 focus:outline-none focus:border-2 focus:border-purple-500' 
          : 'border-2 border-border rounded-lg hover:border-purple-500 focus:outline-none focus:border-purple-500',
        className
      )}
      style={{ minHeight: `${minHeight}px` }}
    />
  )

  // 渲染单词计数
  const renderWordCount = () => {
    if (!showWordCount) return null
    
    return (
      <div className="flex justify-end">
        <span
          className={`text-sm ${
            wordCount >= maxWords ? 'text-red-500' : wordCount > maxWords * 0.75 ? 'text-orange-500' : 'text-muted-foreground'
          } ${isWordLimit ? 'animate-bounce' : ''}`}
          onAnimationEnd={() => onWordLimitChange(false)}
        >
          {wordCount}/{maxWords} {wordUnitTitle}
        </span>
      </div>
    )
  }

  // 如果有标题且需要嵌入，则渲染内部标题布局
  if (embed && (title)) {
    return (
      <div className="space-y-2">
        <div className="border-2 border-border rounded-lg bg-transparent">
          <div className="p-4 pb-2">
            {renderTitle()}
          </div>
          <hr className="border-t border-border" />
          <div className="p-1">
            {renderTextarea(true)}
          </div>
        </div>
        {renderWordCount()}
      </div>
    )
  }

  // 默认布局：外部标题或无标题
  return (
    <div className="space-y-2">
      {renderTitle()}
      {renderTextarea()}
      {renderWordCount()}
    </div>
  )
} 