import type { DriverLocationStatus } from '@/types/delivery.types'

export function resolveDriverLocationStatus(status: DriverLocationStatus) {
  const statusStr = status?.split('_')

  return statusStr?.map(s => s.replace(/^\w/, c => c.toUpperCase())).join(' ')
}
