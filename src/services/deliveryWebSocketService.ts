import { useDeliveryStore } from '@/stores/deliveryStore'
import type { DriverLocation } from '@/types/delivery.types'

const WS_URL = import.meta.env.VITE_DELIVERY_WS_URL

export class DeliveryWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private reconnectTimeoutId: number | null = null

  connect(url: string = WS_URL, onConnect?: () => void) {
    try {
      this.ws = new WebSocket(url)
      this.setupEventListeners(onConnect)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.handleReconnect(onConnect)
    }
  }

  setupEventListeners(onConnect?: () => void) {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('Delivery WebSocket Connected')
      this.reconnectAttempts = 0
      onConnect?.()
    }

    this.ws.onmessage = (event: MessageEvent<DriverLocation>) => {
      try {
        this.handleLocationUpdate(event.data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = (event: CloseEvent) => {
      console.log('Delivery WebSocket disconnected:', event.code, event.reason)
      useDeliveryStore.getState().setConnectionStatus(false)
      
      if (!event.wasClean) {
        this.handleReconnect()
      }
    }

    this.ws.onerror = (error: Event) => {
      console.error('Delivery WebSocket error:', error)
      useDeliveryStore.getState().setConnectionStatus(false)
    }
  }

  handleLocationUpdate(driverLocation: DriverLocation) {
    useDeliveryStore.getState().updateDriverLocation(driverLocation)
  }

  handleReconnect(onConnect?: () => void) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect(undefined, onConnect)
    }, this.reconnectInterval)
  }

   
  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  // Send delivery action commands
  sendDeliveryAction(driverId: string, deliveryId: string, action: string) {
    this.sendMessage({
      type: 'delivery_action',
      driverId,
      deliveryId,
      action,
      timestamp: Date.now()
    })
  }

  // Request driver location
  requestDriverLocation(driverId: string) {
    this.sendMessage({
      type: 'request_location',
      driverId,
      timestamp: Date.now()
    })
  }

  disconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    
    useDeliveryStore.getState().setConnectionStatus(false)
  }
}

export const deliveryWebSocketService = new DeliveryWebSocketService()
