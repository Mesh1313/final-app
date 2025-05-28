import type { Driver } from '@/types/delivery.types'
import { TruckIcon } from '@/components/icons'
import './DriverCard.css'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'
import { resolveDriverLocationStatus } from '@/util/resolveDriverLocationStatus'

interface DriverCardProps {
  driver: Driver
  onSelect: (id: string) => void
}

function DriverCard({ driver, onSelect }: DriverCardProps) {
  const { getDriverLocation } = useDeliveryTracking()
  const driverLocation = getDriverLocation(driver.id)

  return (
    <div className='p-[12px] bg-[#fff] rounded-[8px] mb-[20px] shadow-[0_2px_6px_rgba(0,0,0,0.16)] cursor-pointer' onClick={() => onSelect(driver.id)}>
      <div className='flex row items-center'>
        <p className='driver-id mr-[10px]'>{driver.id}</p>
        <p className='driver-name'>{driver.name}</p>
      </div>
      {driverLocation ? (
        <div>
          <div className='flex row items-center'>
            <TruckIcon color='black' size={20} />
            <p className='info-text ml-[10px]'>{resolveDriverLocationStatus(driverLocation?.status)}</p>
          </div>
          <p className='info-text'>{driverLocation?.eta}</p>
        </div>
      ) : (
        <div className="flex items-center h-[36px]">
          <div className="h-[4px] w-[4px] mr-[6px] bg-[#000] rounded-full dot-1"></div>
          <div className="h-[4px] w-[4px] mr-[6px] bg-[#000] rounded-full dot-2"></div>
          <div className="h-[4px] w-[4px] bg-[#000] rounded-full dot-3"></div>
        </div>
      )}
    </div>
  )
}

export default DriverCard

