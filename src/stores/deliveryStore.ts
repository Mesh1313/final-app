import { DeliveryAction, type Delivery, type Driver, type DriverLocation, type DriverLocationStatus } from '@/types/delivery.types'
import { DeliveryStatus } from '@/types/delivery.types'
import { create } from 'zustand'

interface DeliveryStoreState {
  // Drivers
  drivers: Record<string, Driver>
  activeDrivers: string[]

  // Deliveries
  deliveries: Record<string, Delivery>
  activeDeliveries: string[]

  // Real-Time Locations
  driverLocations: Record<string, DriverLocation>

  // Connection Status
  isConnected: boolean
  lastUpdate: number

  // Selectors
  getDriversByStatus: (status: DriverLocationStatus) => Driver[]
  getDeliveriesByStatus: (status: DeliveryStatus) => Delivery[]
  getDriverDeliveries: (driverId: string) => Delivery[]
  getDriverById: (id: string) => Driver | undefined
}

interface DeliveryStoreActions {
  // Drivers
  addDriver: (driver: Driver) => void
  updateDriver: (driverId: string, updates: Partial<Driver>) => void
  removeDriver: (driverId: string) => void
  // Deliveries
  addDelivery: (delivery: Delivery) => void
  updateDelivery: (deliveryId: string, updates: Partial<Delivery>) => void
  // Locations
  updateDriverLocation: (location: DriverLocation) => void
  // Delivery Actions
  performDeliveryAction: (deliveryId: string, action: DeliveryAction) => void
  
  setConnectionStatus: (isConnected: boolean) => void
}

const INITIAL_STATE = {
  drivers: {},
  activeDrivers: [],
  deliveries: {},
  activeDeliveries: [],
  driverLocations: {},
  isConnected: false,
  lastUpdate: 0,
}

export const useDeliveryStore = create<DeliveryStoreState & DeliveryStoreActions>()((set, get) => ({
  ...INITIAL_STATE,

  // Driver actions
  addDriver: (driver) => 
    set((state) => ({
      drivers: { ...state.drivers, [driver.id]: driver },
      activeDrivers: driver.isActive 
        ? [...state.activeDrivers, driver.id]
        : state.activeDrivers
    })),

  updateDriver: (driverId, updates) =>
    set((state) => ({
      drivers: {
        ...state.drivers,
        [driverId]: { ...state.drivers[driverId], ...updates }
      }
    })),

  removeDriver: (driverId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [driverId]: removed, ...restDrivers } = state.drivers
      return {
        drivers: restDrivers,
        activeDrivers: state.activeDrivers.filter(id => id !== driverId)
      }
    }),

  // Delivery actions
  addDelivery: (delivery) =>
    set((state) => ({
      deliveries: { ...state.deliveries, [delivery.id]: delivery },
      activeDeliveries: [DeliveryStatus.ASSIGNED, DeliveryStatus.IN_PROGRESS, DeliveryStatus.PAUSED].includes(delivery.status)
        ? [...state.activeDeliveries, delivery.id]
        : state.activeDeliveries
    })),

  updateDelivery: (deliveryId, updates) =>
    set((state) => ({
      deliveries: {
        ...state.deliveries,
        [deliveryId]: { ...state.deliveries[deliveryId], ...updates }
      }
    })),

  // Location updates
  updateDriverLocation: (location) =>
    set((state) => {
      const updatedLocation = {
        ...location,
        timestamp: Date.now()
      }

      // Update driver's current location
      const driver = state.drivers[location.driverId]
      const updatedDriver = driver ? {
        ...driver,
        currentLocation: updatedLocation
      } : null

      return {
        driverLocations: {
          ...state.driverLocations,
          [location.driverId]: updatedLocation
        },
        drivers: updatedDriver ? {
          ...state.drivers,
          [location.driverId]: updatedDriver
        } : state.drivers,
        lastUpdate: Date.now()
      }
    }),

  // Delivery actions
  performDeliveryAction: (deliveryId, action) =>
    set((state) => {
      const delivery = state.deliveries[deliveryId]
      if (!delivery) return state

      const now = Date.now()
      let updates: Partial<Delivery> = {}

      switch (action) {
        case DeliveryAction.START:
          updates = {
            status: DeliveryStatus.IN_PROGRESS,
            startedAt: now,
            pausedAt: undefined
          }
          break
        case DeliveryAction.PAUSE:
          updates = {
            status: DeliveryStatus.PAUSED,
            pausedAt: now
          }
          break
        case DeliveryAction.RESUME:
          updates = {
            status: DeliveryStatus.IN_PROGRESS,
            pausedAt: undefined
          }
          break
        case DeliveryAction.COMPLETE:
          updates = {
            status: DeliveryStatus.COMPLETED,
            completedAt: now,
            actualDeliveryTime: new Date(now).toISOString()
          }
          break
        case DeliveryAction.CANCEL:
          updates = {
            status: DeliveryStatus.CANCELLED,
            completedAt: now
          }
          break
      }

      const updatedDelivery = { ...delivery, ...updates }
      const isActive = [DeliveryStatus.ASSIGNED, DeliveryStatus.IN_PROGRESS, DeliveryStatus.PAUSED].includes(updatedDelivery.status)

      return {
        deliveries: {
          ...state.deliveries,
          [deliveryId]: updatedDelivery
        },
        activeDeliveries: isActive
          ? state.activeDeliveries.includes(deliveryId)
            ? state.activeDeliveries
            : [...state.activeDeliveries, deliveryId]
          : state.activeDeliveries.filter(id => id !== deliveryId)
      }
    }),

  setConnectionStatus: (isConnected) =>
    set({ isConnected, lastUpdate: Date.now() }),

  // Selectors
  getDriversByStatus: (status) => {
    const state = get()
    return Object.values(state.drivers).filter(
      driver => driver.currentLocation?.status === status
    )
  },

  getDeliveriesByStatus: (status) => {
    const state = get()
    return Object.values(state.deliveries).filter(
      delivery => delivery.status === status
    )
  },

  getDriverDeliveries: (driverId) => {
    const state = get()
    return Object.values(state.deliveries).filter(
      delivery => delivery.driverId === driverId
    )
  },

  getDriverById: (id: string): Driver | undefined => {
    const state = get()
    return state.drivers[id]
  },

}))
