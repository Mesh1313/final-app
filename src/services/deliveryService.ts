import { useDeliveryStore } from '@/stores/deliveryStore'
// import { deliveryWebSocketService, } from './deliveryWebSocketService'
import { mockDeliveryWebSocketService } from './mockDeliveryWebSocketService'
import { type Delivery, DeliveryAction, type Driver, DeliveryStatus, DriverAction } from '@/types/delivery.types'

class DeliveryService {
  private initialized: boolean = false

  initialize(drivers: Driver[]) {
    if (this.initialized) return

    this.initialized = true

    mockDeliveryWebSocketService.connect(
      drivers,
      () => useDeliveryStore.getState().setConnectionStatus(true),
      () => useDeliveryStore.getState().setConnectionStatus(false),
      (data) => useDeliveryStore.getState().updateDriverLocation(data)
    )
  }

  async loadDrivers() {
    try {
      const mockDrivers: Driver[] = [
        {
          id: '123',
          name: 'John Doe',
          isActive: true,
          isPaused: false,
        },
        {
          id: '456',
          name: 'Jane Smith',
          isActive: true,
          isPaused: false,
        },
        {
          id: '789',
          name: 'Ashley Coleman',
          isActive: true,
          isPaused: false,
        },
        {
          id: '010',
          name: 'Wallace Smith',
          isActive: true,
          isPaused: false,
        }
      ]

      mockDrivers.forEach(driver => useDeliveryStore.getState().addDriver(driver))
    } catch (error) {
      console.error('Failed to load drivers:', error)
    }
  }

  async loadDeliveries() {
    try {
      const mockDeliveries: Delivery[] = [
        {
          id: 'del-001',
          driverId: '123',
          customerName: 'Alice Johnson',
          customerAddress: '123 Main St, City',
          customerLocation: [-74.0060, 40.7128],
          status: DeliveryStatus.ASSIGNED,
          createdAt: Date.now() - 300000, // 5 minutes ago
          estimatedDeliveryTime: '20 min'
        },
        {
          id: 'del-002',
          driverId: '456',
          customerName: 'Steve Martin',
          customerAddress: '356 Second St, City',
          customerLocation: [-74.1280, 40.3456],
          status: DeliveryStatus.ASSIGNED,
          createdAt: Date.now() - 300000, // 5 minutes ago
          estimatedDeliveryTime: '45 min'
        },
        {
          id: 'del-003',
          driverId: '456',
          customerName: 'Sarah Johnson',
          customerAddress: '789 Oak Ave, Midtown',
          customerLocation: [-74.0200, 40.7589],
          status: DeliveryStatus.ASSIGNED,
          createdAt: Date.now() - 600000, // 10 minutes ago
          estimatedDeliveryTime: '25 min'
        },
      ]

      mockDeliveries.forEach(delivery => useDeliveryStore.getState().addDelivery(delivery))
    } catch (error) {
      console.error('Failed to load deliveries:', error)
    }
  }

  async performDeliveryAction(deliveryId: string, action: DeliveryAction, newDriverId?: string) {
    try {
      const delivery = useDeliveryStore.getState().deliveries[deliveryId]

      if (!delivery) {
        throw new Error('Delivery not found')
      }

      // Send message to websocket with the action
      if (action === DeliveryAction.REASSIGN && newDriverId) {
        mockDeliveryWebSocketService.sendMessage({
          type: 'reassign_delivery',
          deliveryId,
          oldDriverId: delivery.driverId,
          newDriverId,
          timestamp: Date.now()
        })
        
        // Update the store
        useDeliveryStore.getState().performDeliveryAction(deliveryId, action, newDriverId)
      } else {
        mockDeliveryWebSocketService.sendDeliveryAction(delivery.driverId, deliveryId, action)
        
        // Update the store
        useDeliveryStore.getState().performDeliveryAction(deliveryId, action)
      }

    } catch (error) {
      console.error('Failed to perform delivery action:', error)
      throw error
    }
  }

  async performDriverAction(driverId: string, action: DriverAction) {
    try {
      const driver = useDeliveryStore.getState().getDriverById(driverId)

      if (!driver) {
        throw new Error('Driver not found')
      }

      // Send message to websocket
      mockDeliveryWebSocketService.sendMessage({
        type: 'driver_action',
        driverId,
        action,
        timestamp: Date.now()
      })

      // Update the store
      useDeliveryStore.getState().performDriverAction(driverId, action)

    } catch (error) {
      console.error('Failed to perform driver action:', error)
      throw error
    }
  }

  async reassignDelivery(deliveryId: string, newDriverId: string) {
    return this.performDeliveryAction(deliveryId, DeliveryAction.REASSIGN, newDriverId)
  }

  async completeDelivery(deliveryId: string) {
    return this.performDeliveryAction(deliveryId, DeliveryAction.COMPLETE)
  }

  async pauseDriver(driverId: string) {
    return this.performDriverAction(driverId, DriverAction.PAUSE)
  }

  async resumeDriver(driverId: string) {
    return this.performDriverAction(driverId, DriverAction.RESUME)
  }


  async createDelivery(deliveryData: Partial<Omit<Delivery, 'id' | 'createdAt' | 'status'>>) {
    try {
      const newDelivery = {
        ...deliveryData,
        id: `delivery-${Date.now()}`,
        status: DeliveryStatus.ASSIGNED,
        createdAt: Date.now(),
      } as Delivery

      useDeliveryStore.getState().addDelivery(newDelivery)

      return newDelivery
    } catch (error) {
      console.error('Failed to create delivery:', error)
      throw error
    }
  }

  requestDriverLocation(driverId: string) {
    mockDeliveryWebSocketService.requestDriverLocation(driverId)
  }

  cleanup() {
    mockDeliveryWebSocketService.disconnect()
  }
}

export const deliveryService = new DeliveryService()
