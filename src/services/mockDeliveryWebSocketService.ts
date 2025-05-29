import type { Driver, DriverLocation } from '@/types/delivery.types'
import MockDeliveryWebSocket from './mockDeliveryWebSocket'

export type OnConnect = () => void
export type OnClose = () => void
export type OnUpdate = (data: DriverLocation) => void

class MockDeliveryWebSocketService {
  private mockWS: MockDeliveryWebSocket | null = null
  private reconnectTimeoutId: number | null = null

  private onConnect: OnConnect | null = null
  private onClose: OnClose | null = null
  private onUpdate: OnUpdate | null = null

  connect(drivers: Driver[], onConnect?: OnConnect, onClose?: OnClose, onUpdate?: OnUpdate) {
    if (this.mockWS) return

    this.onConnect = onConnect || null
    this.onClose = onClose || null
    this.onUpdate = onUpdate || null

    console.log('Connecting to mock delivery WebSocket...')
    
    this.mockWS = new MockDeliveryWebSocket(drivers)
    this.setupEventListeners()
    
    // Start simulation after a short delay
    setTimeout(() => {
      if (this.mockWS) {
        this.mockWS.startSimulation()
      }
    }, 1000)
  }

  private setupEventListeners() {
    if (!this.mockWS) return

    this.mockWS.addEventListener('open', () => {
      console.log('Mock delivery WebSocket connected')
      this.onConnect?.()
    });

    this.mockWS.addEventListener('message', (event: any) => {
      try {
        const data: DriverLocation = JSON.parse(event.data)
        this.handleLocationUpdate(data)
      } catch (error) {
        console.error('Error parsing mock WebSocket message:', error)
      }
    });

    this.mockWS.addEventListener('close', () => {
      console.log('Mock delivery WebSocket disconnected')
      this.onClose?.()
    })
  }

  private handleLocationUpdate(data: DriverLocation) {
    // Validate the data
    if (!data.driverId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      console.warn('Invalid location data received:', data)
      return
    }

    this.onUpdate?.(data)
  }

  sendMessage(message: any) {
    if (this.mockWS && this.mockWS.readyState === MockDeliveryWebSocket.OPEN) {
      this.mockWS.send(JSON.stringify(message))
    } else {
      console.warn('Mock WebSocket is not connected')
    }
  }

  sendDeliveryAction(driverId: string, deliveryId: string, action: string) {
    this.sendMessage({
      type: 'delivery_action',
      driverId,
      deliveryId,
      action,
      timestamp: Date.now()
    })
  }

  requestDriverLocation(driverId: string) {
    this.sendMessage({
      type: 'request_location',
      driverId,
      timestamp: Date.now()
    })
  }

  // Mock-specific methods
  addDriver(driverId: string, name: string, startLocation: [number, number]) {
    this.mockWS?.addMockDriver(driverId, name, startLocation)
  }

  removeDriver(driverId: string) {
    this.mockWS?.removeMockDriver(driverId)
  }

  disconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
    }
    
    if (this.mockWS) {
      this.mockWS.close()
      this.mockWS = null
    }
    
    this.onClose?.()
  }
}

export const mockDeliveryWebSocketService = new MockDeliveryWebSocketService()