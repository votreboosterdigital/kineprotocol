import type { Metadata } from 'next'
import { DemoClient } from './DemoClient'

export const metadata: Metadata = {
  title: 'Démo — KinéProtocol AI',
  description: 'Découvrez des exemples de protocoles générés par KinéProtocol AI.',
}

export default function DemoPage() {
  return <DemoClient />
}
