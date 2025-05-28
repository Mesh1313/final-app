import type { MarkerCoordinates } from '@/types/delivery.types'
import mapboxgl, { type MapOptions } from 'mapbox-gl'
import { memo, useEffect, useRef } from 'react'

export interface MapProps {
  center?: [number, number]
  markerName?: string
  markerCoordinates?: MarkerCoordinates
}

function Map({ center, markerName, markerCoordinates, ...mapProps }: MapProps & Partial<MapOptions>) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return
  
    mapboxgl.accessToken = import.meta.env.VITE_MABPOX_API_TOKEN
    mapRef.current = new mapboxgl.Map({
      zoom: 12,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      ...mapProps,
      container: mapContainerRef.current,
    });

    return () => {
      mapRef.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (center) {
      mapRef.current?.setCenter(center)
    }
  }, [center])

  useEffect(() => {
    if (!mapRef.current) return

    marker.current?.remove()

    if (mapRef.current && markerName && markerCoordinates?.latitude && markerCoordinates.longitude) {
      marker.current = createTruckMarker(markerCoordinates, markerName)
      marker.current.addTo(mapRef.current)
      mapRef.current?.flyTo({ center: [markerCoordinates.longitude, markerCoordinates.latitude] })
    }
  }, [markerName])

  useEffect(() => {
    if (marker.current && markerCoordinates?.latitude && markerCoordinates.longitude) {
      marker.current.setLngLat([markerCoordinates.longitude, markerCoordinates.latitude])
    }
  }, [markerCoordinates])

  return (
    <div id='map-container' ref={mapContainerRef}></div>
  )
}

export default memo(Map)

function createTruckMarker(coordinates: MarkerCoordinates, title: string) {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="width: 30px; height: 30px; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white; border-radius: 50%">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000" width="24" height="24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    </div>
  `
  el.style.cursor = 'pointer'

  return new mapboxgl.Marker(el)
    .setLngLat([coordinates.longitude, coordinates.latitude])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3 style="color:black">${title}</h3><p style="color:black">Current Location</p>`)
    )
}
