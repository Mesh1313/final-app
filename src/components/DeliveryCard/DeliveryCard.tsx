import '@/components/DriverCard/DriverCard.css'
import type { Delivery } from '@/types/delivery.types'

interface DeliveryCardProps {
  delivery: Delivery
}

function DeliveryCard({ delivery }: DeliveryCardProps) {
  return (
    <div>
      <p className='driver-id'>{delivery.id}</p>
      <p className='info-text'>{delivery.customerName}</p>
      <p className='info-text'>{delivery.customerAddress}</p>
    </div>
  )
}

export default DeliveryCard
