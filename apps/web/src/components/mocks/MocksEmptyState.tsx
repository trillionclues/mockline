import { Server } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'

export function MocksEmptyState({ onProvision }: { onProvision: () => void }) {
    return (
        <EmptyState
            icon={<Server size={24} />}
            title="No mock servers yet"
            description="Deploy a live mock API server from any of your OpenAPI specifications."
            action={{ label: 'New Mock', onClick: onProvision }}
        />
    )
}