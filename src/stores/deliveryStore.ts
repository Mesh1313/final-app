import { DeliveryAction, DriverAction, type Delivery, type Driver, type DriverLocation, type DriverLocationStatus } from '@/types/delivery.types'
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
  getAvailableDrivers: () => Driver[]
}

interface DeliveryStoreActions {
  // Drivers
  addDriver: (driver: Driver) => void
  updateDriver: (driverId: string, updates: Partial<Driver>) => void
  removeDriver: (driverId: string) => void
  pauseDriver: (driverId: string) => void
  resumeDriver: (driverId: string) => void
  // Deliveries
  addDelivery: (delivery: Delivery) => void
  updateDelivery: (deliveryId: string, updates: Partial<Delivery>) => void
  reassignDelivery: (deliveryId: string, newDriverId: string) => void
  completeDelivery: (deliveryId: string) => void
  // Locations
  updateDriverLocation: (location: DriverLocation) => void
  // Delivery Actions
  performDeliveryAction: (deliveryId: string, action: DeliveryAction, newDriverId?: string) => void
  // Driver Actions
  performDriverAction: (driverId: string, action: DriverAction) => void
  
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

  pauseDriver: (driverId) =>
    set((state) => ({
      drivers: {
        ...state.drivers,
        [driverId]: { ...state.drivers[driverId], isPaused: true }
      }
    })),

  resumeDriver: (driverId) =>
    set((state) => ({
      drivers: {
        ...state.drivers,
        [driverId]: { ...state.drivers[driverId], isPaused: false }
      }
    })),

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

  reassignDelivery: (deliveryId, newDriverId) =>
    set((state) => {
      const delivery = state.deliveries[deliveryId]
      if (!delivery) return state

      return {
        deliveries: {
          ...state.deliveries,
          [deliveryId]: {
            ...delivery,
            driverId: newDriverId,
            status: DeliveryStatus.ASSIGNED,
          }
        }
      }
    }),

  completeDelivery: (deliveryId) =>
    set((state) => {
      const delivery = state.deliveries[deliveryId]
      if (!delivery) return state

      const now = Date.now()
      const updatedDelivery = {
        ...delivery,
        status: DeliveryStatus.COMPLETED,
        completedAt: now,
        actualDeliveryTime: new Date(now).toISOString()
      }

      return {
        deliveries: {
          ...state.deliveries,
          [deliveryId]: updatedDelivery
        },
        activeDeliveries: state.activeDeliveries.filter(id => id !== deliveryId)
      }
    }),

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
  performDeliveryAction: (deliveryId, action, newDriverId) =>
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
        case DeliveryAction.REASSIGN:
          if (!newDriverId) return state
          updates = {
            driverId: newDriverId,
            status: DeliveryStatus.ASSIGNED,
            startedAt: undefined,
            pausedAt: undefined,
            completedAt: undefined
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

  performDriverAction: (driverId, action) =>
    set((state) => {
      const driver = state.drivers[driverId]
      if (!driver) return state

      switch (action) {
        case DriverAction.PAUSE:
          return {
            drivers: {
              ...state.drivers,
              [driverId]: { ...driver, isPaused: true }
            }
          }
        case DriverAction.RESUME:
          return {
            drivers: {
              ...state.drivers,
              [driverId]: { ...driver, isPaused: false }
            }
          }
        default:
          return state
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

  getAvailableDrivers: () => {
    const state = get()
    return Object.values(state.drivers).filter(
      driver => driver.isActive && !driver.isPaused
    )
  },

}))
