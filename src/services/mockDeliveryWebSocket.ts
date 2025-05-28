import { DeliveryAction, type Driver, type DriverLocation, DriverLocationStatus } from '@/types/delivery.types'

interface MockDriver {
  id: string
  name: string
  startLocation: [number, number]
  route: [number, number][]
  currentIndex: number
  status: DriverLocation['status']
  speed: number
  interpolationStep: number
}

type Callback = (...args: any[]) => void

const START_LOCATION: [number, number] = [-52.832299, 47.521486]

class MockDeliveryWebSocket {
  private listeners: { [key: string]: Callback[] } = {}
  private intervalId: number | null = null
  private isRunning: boolean = false
  private mockDrivers: Map<string, MockDriver> = new Map()
  private updateInterval = 5000 // 2 seconds
  private interpolationSteps = 2 // Smooth movement steps
  
  constructor(drivers: Driver[], startLocation: [number, number] = START_LOCATION) {
    drivers.forEach(driver => {
      const route = this.generateDeliveryRoute(startLocation)
      this.mockDrivers.set(
        driver.id,
        {
          ...driver,
          startLocation: startLocation,
          speed: 0,
          currentIndex: 0,
          interpolationStep: 0,
          status: DriverLocationStatus.EN_ROUTE,
          route
        } as MockDriver
      )
    })
  }

  private generateDeliveryRoute(start: [number, number]): [number, number][] {
    const [startLng, startLat] = start
    
    // Random route size between 0.01 and 0.05
    const routeSize = Math.random() * (0.05 - 0.01) + 0.01
    const route: [number, number][] = []

    // Generate random number of delivery stops (2-5)
    const numDeliveryStops = Math.floor(Math.random() * 4) + 2 // 2 to 5
    
    const stops = []
    
    // Always start with pickup
    stops.push({ 
      angle: 0, 
      radius: Math.random() * (1 - 0.1) + 0.1, // 0.1 to 1
      name: 'pickup' 
    })
    
    // Generate random delivery stops
    for (let i = 1;  i <= numDeliveryStops; i++) {
      stops.push({
        angle: Math.random() * 10, // 0 to 10 radians
        radius: Math.random() * (1 - 0.1) + 0.1, // 0.1 to 1
        name: `delivery${i}`
      })
    }
    
    // Always end with return
    stops.push({ 
      angle: Math.random() * 10, // 0 to 10 radians
      radius: Math.random() * (1 - 0.1) + 0.1, // 0.1 to 1
      name: 'return' 
    })

    stops.forEach(stop => {
      const lng = startLng + Math.cos(stop.angle) * routeSize * stop.radius
      const lat = startLat + Math.sin(stop.angle) * routeSize * stop.radius * 0.8
      route.push([lng, lat])
    })

    // Add some intermediate points for smoother movement
    const smoothRoute: [number, number][] = []
    for (let i = 0; i < route.length; i++) {
      smoothRoute.push(route[i])
      
      // Add intermediate point between current and next
      if (i < route.length - 1) {
        const current = route[i]
        const next = route[i + 1]
        const midPoint: [number, number] = [
          (current[0] + next[0]) / 2,
          (current[1] + next[1]) / 2
        ]
        smoothRoute.push(midPoint)
      }
    }

    return smoothRoute
  }

  private interpolate(from: [number, number], to: [number, number], factor: number): [number, number] {
    return [
      from[0] + (to[0] - from[0]) * factor,
      from[1] + (to[1] - from[1]) * factor
    ]
  }

  private getDriverStatus(routeProgress: number): DriverLocationStatus {
    if (routeProgress < 0.2) return DriverLocationStatus.EN_ROUTE
    if (routeProgress < 0.8) return DriverLocationStatus.DELIVERING
    return DriverLocationStatus.RETURNING
  }

  private getETA(routeProgress: number): string {
    const remainingProgress = 1 - routeProgress
    const estimatedMinutes = Math.ceil(remainingProgress * 30) // Max 30 minutes
    return `${estimatedMinutes} min`
  }

  addEventListener(event: string, callback: Callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event: string, callback: Callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  private emitMessage(data: DriverLocation) {
    const message = { data: JSON.stringify(data) }
    this.listeners['message']?.forEach(callback => {
      callback(message)
    })
  }

  startSimulation() {
    if (this.isRunning) return
    
    console.log('Starting delivery tracking simulation...')
    this.isRunning = true
    
    // Emit connection open event
    this.listeners['open']?.forEach(callback => callback())
    
    this.intervalId = setInterval(() => {
      this.mockDrivers.forEach((driver, driverId) => {
        const currentPoint = driver.route[driver.currentIndex]
        const nextIndex = (driver.currentIndex + 1) % driver.route.length
        const nextPoint = driver.route[nextIndex]
        
        // Calculate interpolation factor
        const factor = driver.interpolationStep / this.interpolationSteps
        const interpolatedCoords = this.interpolate(currentPoint, nextPoint, factor)
        
        // Add realistic GPS noise
        const noiseLng = interpolatedCoords[0] + (Math.random() - 0.5) * 0.0001
        const noiseLat = interpolatedCoords[1] + (Math.random() - 0.5) * 0.0001
        
        // Calculate route progress
        const totalPoints = driver.route.length
        const progressIndex = driver.currentIndex + factor
        const routeProgress = progressIndex / totalPoints
        
        // Generate location data
        const locationData: DriverLocation = {
          driverId,
          latitude: noiseLat,
          longitude: noiseLng,
          status: this.getDriverStatus(routeProgress),
          eta: this.getETA(routeProgress),
          timestamp: Date.now()
        }
        
        // Emit the location update
        this.emitMessage(locationData)
        
        // Update driver state
        driver.interpolationStep++
        if (driver.interpolationStep >= this.interpolationSteps) {
          driver.interpolationStep = 0
          driver.currentIndex = nextIndex
        }
      })
    }, this.updateInterval / this.interpolationSteps)
  }

  stopSimulation() {
    if (!this.isRunning) return
    
    console.log('Stopping delivery tracking simulation...')
    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    // Emit close event
    this.listeners['close']?.forEach(callback => callback({ wasClean: true }))
  }

  // Mock WebSocket methods
  send(data: string) {
    try {
      const message = JSON.parse(data)
      console.log('Mock WebSocket received message:', message)
      
      // Handle different message types
      switch (message.type) {
        case 'delivery_action':
          this.handleDeliveryAction(message)
          break
        case 'request_location':
          this.handleLocationRequest(message)
          break
        default:
          console.log('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleDeliveryAction(message: any) {
    const { driverId, action } = message
    const driver = this.mockDrivers.get(driverId)
    
    if (!driver) return
    
    console.log(`Driver ${driverId} performing action: ${action}`)
    
    // Update driver status based on action
    switch (action) {
      case DeliveryAction.START:
        driver.status = DriverLocationStatus.EN_ROUTE
        break
      case DeliveryAction.PAUSE:
        driver.status = DriverLocationStatus.IDLE
        break
      case DeliveryAction.RESUME:
        driver.status = DriverLocationStatus.EN_ROUTE
        break
      case DeliveryAction.COMPLETE:
        driver.status = DriverLocationStatus.RETURNING
        break
    }
  }

  private handleLocationRequest(message: any) {
    const { driverId } = message
    const driver = this.mockDrivers.get(driverId)
    
    if (!driver) return
    
    // Send immediate location update
    const currentPoint = driver.route[driver.currentIndex] 
    const locationData: DriverLocation = {
      driverId,
      latitude: currentPoint[1],
      longitude: currentPoint[0],
      status: driver.status,
      eta: this.getETA(driver.currentIndex / driver.route.length),
      timestamp: Date.now()
    } 
    
    this.emitMessage(locationData) 
  }

  // Add/remove drivers dynamically
  addMockDriver(driverId: string, name: string, startLocation: [number, number]) {
    const route = this.generateDeliveryRoute(startLocation) 
    this.mockDrivers.set(driverId, {
      id: driverId,
      name,
      startLocation,
      route,
      currentIndex: 0,
      status: DriverLocationStatus.IDLE,
      speed: 40 + Math.random() * 20, // 40-60 km/h
      interpolationStep: 0
    }) 
    
    console.log(`Added mock driver: ${name} (${driverId})`) 
  }

  removeMockDriver(driverId: string) {
    this.mockDrivers.delete(driverId) 
    console.log(`Removed mock driver: ${driverId}`) 
  }

  // Get current state for debugging
  getDriverStates() {
    const states: Record<string, any> = {} 
    this.mockDrivers.forEach((driver, id) => {
      states[id] = {
        name: driver.name,
        currentIndex: driver.currentIndex,
        totalPoints: driver.route.length,
        status: driver.status,
        progress: `${((driver.currentIndex / driver.route.length) * 100).toFixed(1)}%`
      } 
    }) 
    return states 
  }

  close() {
    this.stopSimulation() 
    this.listeners = {} 
    this.mockDrivers.clear() 
  }

  // Properties to mimic real WebSocket
  get readyState() {
    return this.isRunning ? 1 : 3  // OPEN : CLOSED
  }

  static get CONNECTING() { return 0  }
  static get OPEN() { return 1  }
  static get CLOSING() { return 2  }
  static get CLOSED() { return 3  }
}

export default MockDeliveryWebSocket 
