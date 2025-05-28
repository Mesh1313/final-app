import { type LngLatLike } from 'mapbox-gl'

export enum DriverLocationStatus {
  IDLE = 'idle',
  EN_ROUTE = 'en_route',
  DELIVERING = 'delivering',
  RETURNING = 'returning',
  OFFLINE = 'offline',
}

export type DriverLocation = {
  driverId: string
  latitude: number
  longitude: number
  status: DriverLocationStatus
  eta?: string
  timestamp?: number
}

export type Driver = {
  id: string
  name: string
  isActive: boolean
  currentLocation?: DriverLocation
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type Delivery = {
  id: string
  driverId: string
  customerName: string
  customerAddress: string
  customerLocation: LngLatLike
  status: DeliveryStatus
  createdAt: number
  startedAt?: number
  pausedAt?: number
  completedAt?: number
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  route?: [number, number][]
}

export enum DeliveryAction {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
}

export type MarkerCoordinates = { longitude: number, latitude: number }
