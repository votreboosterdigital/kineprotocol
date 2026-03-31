import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// Schéma de validation du feedback entrant
const feedbackSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  message: z.string().min(5, { message: 'Message trop court (min 5 caractères)' }).max(2000),
  type: z.enum(['bug', 'suggestion', 'general'] as const, {
    error: 'Type invalide — valeurs acceptées : bug, suggestion, general',
  }),
})

export type FeedbackPayload = z.infer<typeof feedbackSchema>

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/feedback
 * Reçoit un retour utilisateur, valide les données, envoie un email de notification à l'admin.
 *
 * Body attendu : { email: string, message: string, type: 'bug' | 'suggestion' | 'general' }
 * Réponse : { success: true } ou { success: false, error: string }
 *
 * Expéditeur : onboarding@resend.dev (domaine partagé Resend — phase expérimentale)
 * Destinataire : ADMIN_EMAIL (défini dans .env.local)
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  // Validation Zod
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Données invalides'
    return NextResponse.json({ success: false, error: firstError }, { status: 400 })
  }

  const { email, message, type } = parsed.data
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('[feedback] ADMIN_EMAIL manquant dans les variables d\'environnement')
    return NextResponse.json({ success: false, error: 'Configuration serveur incomplète' }, { status: 500 })
  }

  // Labels lisibles pour les types de feedback
  const typeLabels: Record<FeedbackPayload['type'], string> = {
    bug: 'Bug',
    suggestion: 'Suggestion',
    general: 'Général',
  }

  try {
    const { error } = await resend.emails.send({
      // onboarding@resend.dev = adresse expéditeur du domaine partagé Resend (pas de domaine vérifié requis)
      from: 'KinéProtocol Feedback <onboarding@resend.dev>',
      to: adminEmail,
      replyTo: email,
      subject: `[KinéProtocol] Nouveau feedback — ${typeLabels[type]}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #00C896; margin-bottom: 8px;">Nouveau feedback KinéProtocol</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 8px; background: #f5f5f5; font-weight: bold; width: 120px;">Type</td>
              <td style="padding: 8px;">${typeLabels[type]}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #f5f5f5; font-weight: bold;">De</td>
              <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
          </table>
          <div style="background: #f9f9f9; border-left: 4px solid #00C896; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap; color: #333;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Ce message a été envoyé via le widget Feedback de kineprot.fr
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[feedback] Erreur Resend :', error)
      return NextResponse.json({ success: false, error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[feedback] Exception Resend :', err)
    return NextResponse.json({ success: false, error: 'Erreur interne serveur' }, { status: 500 })
  }
}
