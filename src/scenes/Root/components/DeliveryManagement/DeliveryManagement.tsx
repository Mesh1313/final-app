import './DeliveryManagement.css'
import '@/components/DriverCard/DriverCard.css'
import { useState } from 'react'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'
import { DeliveryAction, type Delivery, type Driver } from '@/types/delivery.types'

interface DeliveryManagementProps {
  isOpen: boolean
  onClose: () => void
}

function DeliveryManagement ({ isOpen, onClose }: DeliveryManagementProps) {
  const {
    pendingDeliveries,
    inProgressDeliveries,
    completedDeliveries,
    onlineDrivers,
    availableDrivers,
    handleDeliveryAction,
    reassignDelivery,
    completeDelivery,
    pauseDriver,
    resumeDriver
  } = useDeliveryTracking()

  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null)
  const [selectedDriverForReassign, setSelectedDriverForReassign] = useState<string>('')

  const handleReassignDelivery = async () => {
    if (selectedDelivery && selectedDriverForReassign) {
      await reassignDelivery(selectedDelivery, selectedDriverForReassign)
      setSelectedDelivery(null)
      setSelectedDriverForReassign('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-[0px] bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50 p-[20px] delivery-management-view">
      <div className="bg-[#fff] rounded-[12px] shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-[12px] border-b">
          <h2 className="text-2xl font-bold">Delivery Management Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-[12px]">
          {/* Driver Management Section */}
          <div className="mb-[10px]">
            <h3 className="text-xl font-semibold mb-4">Driver Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[10px]">
              {onlineDrivers.map((driver: Driver) => (
                <div key={driver.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="driver-name">{driver.name}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      driver.isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {driver.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                  <p className="driver-id !mb-4">ID: {driver.id}</p>
                  <div className="flex gap-[10px]">
                    {driver.isPaused ? (
                      <button
                        onClick={() => resumeDriver(driver.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => pauseDriver(driver.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[12px]">
            
            {/* Pending Deliveries */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Pending Deliveries</h3>
              <div className="space-y-3">
                {pendingDeliveries.map((delivery: Delivery) => (
                  <div key={delivery.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{delivery.customerName}</h4>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{delivery.customerAddress}</p>
                    <p className="text-xs text-gray-500 !mb-5">
                      Assigned to: {onlineDrivers.find(d => d.id === delivery.driverId)?.name || 'Unknown'}
                    </p>
                    <div className="flex gap-[10px]">
                      <button
                        onClick={() => handleDeliveryAction(delivery.id, DeliveryAction.START)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => setSelectedDelivery(delivery.id)}
                        className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Deliveries */}
            <div>
              <h3 className="text-lg font-semibold mb-4">In Progress</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inProgressDeliveries.map((delivery: Delivery) => (
                  <div key={delivery.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{delivery.customerName}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-[4px]">{delivery.customerAddress}</p>
                    <p className="text-xs text-gray-500 mb-[8px]">
                      Driver: {onlineDrivers.find(d => d.id === delivery.driverId)?.name || 'Unknown'}
                    </p>
                    <div className="flex gap-[10px]">
                      <button
                        onClick={() => completeDelivery(delivery.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeliveryAction(delivery.id, DeliveryAction.PAUSE)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Deliveries */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Completed</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedDeliveries.slice(0, 10).map((delivery: Delivery) => (
                  <div key={delivery.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{delivery.customerName}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{delivery.customerAddress}</p>
                    <p className="text-xs text-gray-500">
                      Completed: {delivery.completedAt ? new Date(delivery.completedAt).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reassignment Modal */}
        {selectedDelivery && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Reassign Delivery</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select New Driver:</label>
                <select
                  value={selectedDriverForReassign}
                  onChange={(e) => setSelectedDriverForReassign(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Choose a driver...</option>
                  {availableDrivers.map((driver: Driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedDelivery(null)
                    setSelectedDriverForReassign('')
                  }}
                  className="px-4 py-2 text-white border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignDelivery}
                  disabled={!selectedDriverForReassign}
                  className="px-4 py-2 text-white rounded disabled:opacity-50"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryManagement
