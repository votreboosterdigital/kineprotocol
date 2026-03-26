import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dns from 'dns'
import 'dotenv/config'

// Forcer la résolution DNS vers Google (contourne le problème de DNS local sur cette machine)
dns.setDefaultResultOrder('ipv4first')
dns.setServers(['8.8.8.8', '8.8.4.4'])

const connectionString = process.env['DATABASE_URL']!
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  const phases = await Promise.all([
    prisma.phase.upsert({
      where: { id: 'phase-aigu' },
      create: {
        id: 'phase-aigu',
        name: 'Aigu',
        order: 1,
        description: 'Phase inflammatoire initiale',
        criteria: ['douleur ≤ 6/10 au repos', 'œdème modéré'],
      },
      update: {},
    }),
    prisma.phase.upsert({
      where: { id: 'phase-subaigu' },
      create: {
        id: 'phase-subaigu',
        name: 'Subaigu',
        order: 2,
        description: 'Phase de réparation tissulaire',
        criteria: ['douleur ≤ 4/10 à la mobilisation', 'mobilité > 50% du côté sain'],
      },
      update: {},
    }),
    prisma.phase.upsert({
      where: { id: 'phase-renfo' },
      create: {
        id: 'phase-renfo',
        name: 'Renforcement',
        order: 3,
        description: 'Renforcement progressif et proprioception',
        criteria: ["douleur ≤ 2/10 à l'effort", 'mobilité > 80% du côté sain'],
      },
      update: {},
    }),
    prisma.phase.upsert({
      where: { id: 'phase-rts' },
      create: {
        id: 'phase-rts',
        name: 'Retour au Sport',
        order: 4,
        description: 'Reprise progressive des activités sportives',
        criteria: ['test de force > 90% côté sain', 'absence de douleur aux tests fonctionnels'],
      },
      update: {},
    }),
  ])

  const pathologies = [
    { name: 'Entorse latérale de cheville', region: 'cheville', tags: ['ligamentaire', 'traumatique'] },
    { name: 'Tendinopathie rotulienne', region: 'genou', sport: 'volleyball', tags: ['tendinopathie', 'surmenage'] },
    { name: 'Rupture LCA post-op', region: 'genou', tags: ['post-op', 'ligamentaire'] },
    { name: 'Tendinopathie de coiffe des rotateurs', region: 'epaule', tags: ['tendinopathie', 'surmenage'] },
    { name: 'Lombalgie commune', region: 'rachis lombaire', tags: ['douleur chronique', 'non-spécifique'] },
    { name: 'Epicondylalgie latérale', region: 'coude', sport: 'tennis', tags: ['tendinopathie', 'surmenage'] },
  ]

  for (const p of pathologies) {
    await prisma.pathology.upsert({
      where: { name: p.name },
      create: p,
      update: {},
    })
  }

  console.log('✅ Seed terminé :', phases.length, 'phases,', pathologies.length, 'pathologies')
}

main().catch(console.error).finally(() => prisma.$disconnect())
