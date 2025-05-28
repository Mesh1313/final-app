import { deliveryService } from '@/services/deliveryService'
import { useDeliveryStore } from '@/stores/deliveryStore'
import { DeliveryStatus, DriverLocationStatus, type DeliveryAction } from '@/types/delivery.types'
import { useCallback } from 'react'

export default function useDeliveryTracking() {
  const {
    drivers,
    deliveries,
    driverLocations,
    isConnected,
    activeDeliveries,
    getDriversByStatus,
    getDeliveriesByStatus
  } = useDeliveryStore()

  const handleDeliveryAction = async (deliveryId: string, action: DeliveryAction) => {
    try {
      await deliveryService.performDeliveryAction(deliveryId, action)
    } catch (error) {
      console.error('Failed to perform delivery action:', error)
    }
  };

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
    requestLocationUpdate,
    
    // Computed data
    activeDrivers: getDriversByStatus(DriverLocationStatus.EN_ROUTE) || getDriversByStatus(DriverLocationStatus.DELIVERING),
    onlineDrivers: Object.values(drivers).filter(d => d.isActive),
    pendingDeliveries: getDeliveriesByStatus(DeliveryStatus.ASSIGNED),
    inProgressDeliveries: getDeliveriesByStatus(DeliveryStatus.IN_PROGRESS),
    pausedDeliveries: getDeliveriesByStatus(DeliveryStatus.PAUSED),
    getDriverLocation,
  }
}
