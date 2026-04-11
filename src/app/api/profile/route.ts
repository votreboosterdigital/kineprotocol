import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  title: z.string().max(30).optional(),
  cabinetName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    })

    return NextResponse.json({ ...profile, email: user.email })
  } catch (error) {
    console.error('[profile GET]', error)
    return NextResponse.json({ error: 'Erreur lors du chargement du profil' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...parsed.data },
      update: parsed.data,
    })

    return NextResponse.json({ ...profile, email: user.email })
  } catch (error) {
    console.error('[profile PATCH]', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
  }
}
