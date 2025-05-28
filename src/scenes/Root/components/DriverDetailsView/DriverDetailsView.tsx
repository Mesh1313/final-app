import '@/components/DriverCard/DriverCard.css'
import DeliveryCard from '@/components/DeliveryCard'
import { TruckIcon } from '@/components/icons'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'
import { useDeliveryStore } from '@/stores/deliveryStore'
import type { Driver } from '@/types/delivery.types'
import { resolveDriverLocationStatus } from '@/util/resolveDriverLocationStatus'

interface DriverDetailsViewProps {
  driverId?: string
  onClose: () => void
}

function DriverDetailsView({ driverId, onClose }: DriverDetailsViewProps) {
  const getDriverById = useDeliveryStore(store => store.getDriverById)
  const getDeliveries = useDeliveryStore(store => store.getDriverDeliveries)
  const driver = (driverId ? getDriverById(driverId) : {}) as Driver
  const { getDriverLocation } = useDeliveryTracking()
  const driverLocation = getDriverLocation(driver.id)
  const deliveries = driverId ? getDeliveries(driverId) : []

  return (
    <div className='absolute bottom-[0px] left-[0px] right-[0px] p-[12px] m-[12px] mb-[40px] bg-[#fff] rounded-[8px] shadow-[0_5px_10px_rgba(0,0,0,0.25)] flex row'>
      <div className='mr-[40px] w-[30%]'>
        <p className='driver-id'>{driver.id}</p>
        <p className='driver-name'>{driver.name}</p>

        <div className='flex row items-center'>
          <TruckIcon color='black' size={20} />
          <p className='info-text ml-[10px]'>{resolveDriverLocationStatus(driverLocation?.status)}</p>
        </div>
        <p className='info-text'>{driverLocation?.eta}</p>
      </div>

      <div className='pl-[12px] border-l border-[#bbb] flex overflow-x-auto'>
        {
          deliveries.map(delivery => (
            <div key={delivery.id} className='mr-[20px]'>
              <DeliveryCard delivery={delivery} />
            </div>
          ))
        }
      </div>

      <span className='text-[#8c8c8c] text-[40px] absolute top-[-18px] right-[10px] cursor-pointer' onClick={onClose}>⨯</span>
    </div>
  )
}

export default DriverDetailsView
