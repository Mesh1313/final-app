import { deliveryService } from '@/services/deliveryService'
import { useDeliveryStore } from '@/stores/deliveryStore'
import { DeliveryStatus, DriverAction, DriverLocationStatus, type DeliveryAction } from '@/types/delivery.types'
import { useCallback } from 'react'

export default function useDeliveryTracking() {
  const {
    drivers,
    deliveries,
    driverLocations,
    isConnected,
    activeDeliveries,
    getDriversByStatus,
    getDeliveriesByStatus,
    getAvailableDrivers
  } = useDeliveryStore()

  const handleDeliveryAction = async (deliveryId: string, action: DeliveryAction, newDriverId?: string) => {
    try {
      await deliveryService.performDeliveryAction(deliveryId, action, newDriverId)
    } catch (error) {
      console.error('Failed to perform delivery action:', error)
    }
  }

  const handleDriverAction = async (driverId: string, action: DriverAction) => {
    try {
      await deliveryService.performDriverAction(driverId, action)
    } catch (error) {
      console.error('Failed to perform driver action:', error)
    }
  }

  const reassignDelivery = async (deliveryId: string, newDriverId: string) => {
    try {
      await deliveryService.reassignDelivery(deliveryId, newDriverId)
    } catch (error) {
      console.error('Failed to reassign delivery:', error)
    }
  }

  const completeDelivery = async (deliveryId: string) => {
    try {
      await deliveryService.completeDelivery(deliveryId)
    } catch (error) {
      console.error('Failed to complete delivery:', error)
    }
  }

  const pauseDriver = async (driverId: string) => {
    try {
      await deliveryService.pauseDriver(driverId)
    } catch (error) {
      console.error('Failed to pause driver:', error)
    }
  }

  const resumeDriver = async (driverId: string) => {
    try {
      await deliveryService.resumeDriver(driverId)
    } catch (error) {
      console.error('Failed to resume driver:', error)
    }
  }

  const requestLocationUpdate = (driverId: string) => {
    deliveryService.requestDriverLocation(driverId)
  }

  const getDriverLocation = useCallback((id: string) => driverLocations[id], [driverLocations])

  return {
    // State
    drivers,
    deliveries,
    driverLocations,
    isConnected,
    activeDeliveries,
    
    // Actions
    handleDeliveryAction,
    handleDriverAction,
    reassignDelivery,
    completeDelivery,
    pauseDriver,
    resumeDriver,
    requestLocationUpdate,
    
    // Computed data
    activeDrivers: getDriversByStatus(DriverLocationStatus.EN_ROUTE) || getDriversByStatus(DriverLocationStatus.DELIVERING),
    onlineDrivers: Object.values(drivers).filter(d => d.isActive),
    availableDrivers: getAvailableDrivers(),
    pausedDrivers: Object.values(drivers).filter(d => d.isPaused),
    pendingDeliveries: getDeliveriesByStatus(DeliveryStatus.ASSIGNED),
    inProgressDeliveries: getDeliveriesByStatus(DeliveryStatus.IN_PROGRESS),
    pausedDeliveries: getDeliveriesByStatus(DeliveryStatus.PAUSED),
    completedDeliveries: getDeliveriesByStatus(DeliveryStatus.COMPLETED),
    getDriverLocation,
  }
}
