import Map from '@/components/Map'
import useLocation from '@/hooks/useLocation'
import { deliveryService } from '@/services/deliveryService'
import { useCallback, useEffect, useMemo, useState } from 'react'
import DriversView from './components/DriversView'
import DriverDetailsView from './components/DriverDetailsView'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'
import type { DriverLocation, MarkerCoordinates } from '@/types/delivery.types'
import { useDeliveryStore } from '@/stores/deliveryStore'

function Root() {
  const location = useLocation()
  const [mapCenter, setMapCenter] = useState<[number, number]>([Number(import.meta.env.VITE_MAP_DEFAULT_LON), Number(import.meta.env.VITE_MAP_DEFAULT_LAT)])
  const [currentDriverId, setCurrentDriverId] = useState<string>()

  useEffect(() => {
    deliveryService.loadDrivers()
    deliveryService.loadDeliveries()
  }, [])

  useEffect(() => {
    if (location.coordinates?.latitude && location.coordinates.longitude) {
      setMapCenter([location.coordinates.longitude, location.coordinates?.latitude])
    }
  }, [location.coordinates])

  const selectDriver = useCallback((id: string) => setCurrentDriverId(id), [])
  const closeDetailsView = useCallback(() => setCurrentDriverId(undefined), [])

  return (
    <div className='h-full w-full bg-gray-100 flex items-center justify-center'>
      <MapWrapper center={mapCenter} currentDriverId={currentDriverId} />

      <DriversView onSelect={selectDriver} />

      {currentDriverId && <DriverDetailsView driverId={currentDriverId} onClose={closeDetailsView} />}
    </div>
  )
}

export default Root

interface MapWrapperProps {
  center: [number, number]
  currentDriverId?: string
}

function MapWrapper({ center, currentDriverId }: MapWrapperProps) {
  const { getDriverLocation } = useDeliveryTracking()
  const getDriverById = useDeliveryStore(store => store.getDriverById)
  const driverLocation = useMemo(() => (currentDriverId ? getDriverLocation(currentDriverId) : {}) as DriverLocation, [currentDriverId, getDriverLocation])
  const locationCoordinates = useMemo(() => (driverLocation ? { longitude: driverLocation.longitude, latitude: driverLocation.latitude } : {}) as MarkerCoordinates, [driverLocation])
  const driverName = useMemo(() => currentDriverId ? getDriverById(currentDriverId)?.name : '', [currentDriverId, getDriverById])

  return (
    <Map center={center} markerName={driverName} markerCoordinates={locationCoordinates} />
  )
}
