import { useEffect, useState } from 'react'

type LocationStatus = 'loading' | 'success' | 'error' | 'denied'
type Coordinates = { latitude: number; longitude: number }

export default function useLocation() {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading')
  const [coordinates, setCoordinates] = useState<Coordinates>()

  useEffect(() => {
    const getCurrentLocation = () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser')
        setLocationStatus('error')
        return
      }

      // Get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('User location found:', longitude, latitude)
          setCoordinates({ longitude, latitude })
          setLocationStatus('success')
        },
        (error) => {
          console.warn('Error getting user location:', error.message)
          
          // Handle different error types
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.warn('User denied the request for Geolocation')
              setLocationStatus('denied')
              break
            case error.POSITION_UNAVAILABLE:
              console.warn('Location information is unavailable')
              setLocationStatus('error')
              break
            case error.TIMEOUT:
              console.warn('The request to get user location timed out')
              setLocationStatus('error')
              break
            default:
              console.warn('An unknown error occurred')
              setLocationStatus('error')
              break
          }
          
          // Fallback to default coordinates
          console.log('Using fallback coordinates: -52.9944466, 47.4827452')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds timeout
          maximumAge: 300000 // Cache position for 5 minutes
        }
      )
    }

    getCurrentLocation()
  }, [])

  return {
    locationStatus,
    coordinates,
  }
}
