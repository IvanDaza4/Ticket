import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'hace unos segundos'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `hace ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`
}
