import { track } from '@vercel/analytics'

export const trackEvent = {
  protocolGenerated: (pathologie: string) =>
    track('protocol_generated', { pathologie }),

  pdfExported: (protocolId: string) =>
    track('pdf_exported', { protocolId }),

  upgradeClicked: (fromPlan: string, targetPlan: string) =>
    track('upgrade_clicked', { fromPlan, targetPlan }),

  demoViewed: () =>
    track('demo_viewed'),

  loginAttempted: () =>
    track('login_attempted'),
}
