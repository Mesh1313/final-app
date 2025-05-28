import DriverCard from '@/components/DriverCard'
import useDeliveryTracking from '@/hooks/useDeliveryTracking'

interface DriversViewProps {
  onSelect: (id: string) => void
}

function DriversView({ onSelect }: DriversViewProps) {
  const { onlineDrivers } = useDeliveryTracking()

  return (
    <div className={`absolute top-[0px] bottom-[0px] left-[0px] overflow-y-auto backdrop-blur-[24px] p-[12px] w-[20%]`}>
      <div>
        {onlineDrivers?.map(driver => (
          <DriverCard key={driver.id} driver={driver} onSelect={onSelect} /> 
        ))}
      </div>
    </div>
  )
}

export default DriversView
