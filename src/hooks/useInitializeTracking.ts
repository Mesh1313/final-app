import { deliveryService } from '@/services/deliveryService'
import { useDeliveryStore } from '@/stores/deliveryStore'
import { useEffect } from 'react'

export default function useInitializeTracking() {
  const drivers = useDeliveryStore(store => store.drivers)

  useEffect(() => {
    const driversList = Object.values(drivers)

    if (driversList.length === 0) return
    // Initialize the delivery service
    deliveryService.initialize(driversList)
  }, [drivers])
}