import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../lib/utils'

type AssetImageProps = {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function AssetImage({ src, alt, className, fallbackClassName }: AssetImageProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div role="img" aria-label={`${alt} image unavailable`} className={cn('flex items-center justify-center rounded-lg bg-slate-100 text-slate-400', fallbackClassName ?? className)}><ImageOff size={18} /></div>
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
}
