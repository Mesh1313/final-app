import DriverCard from '@/components/DriverCard'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'

interface DriversViewProps {
  onSelect: (id: string) => void
  onManagePress: () => void
}

function DriversView({ onSelect, onManagePress }: DriversViewProps) {
  const { onlineDrivers } = useDeliveryTracking()

  return (
    <div className='absolute top-0 bottom-0 left-0 overflow-y-auto backdrop-blur-[24px] p-[12px] w-[20%]'>
      <button
        className='px-3 py-1 text-white rounded text-sm w-full mb-5'
        onClick={onManagePress}
      >
        Manage
      </button>
      <div>
        {onlineDrivers?.map(driver => (
          <DriverCard key={driver.id} driver={driver} onSelect={onSelect} /> 
        ))}
      </div>
    </div>
  )
}

export default DriversView
