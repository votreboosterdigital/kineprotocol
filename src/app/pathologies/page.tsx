export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function PathologiesPage() {
  const pathologies = await prisma.pathology.findMany({ orderBy: { region: 'asc' } })

  const byRegion = pathologies.reduce<Record<string, typeof pathologies>>((acc, p) => {
    if (!acc[p.region]) acc[p.region] = []
    acc[p.region].push(p)
    return acc
  }, {})

  return (
    <div>
      <Header title="Pathologies" description={`${pathologies.length} pathologies disponibles`} />
      {Object.entries(byRegion).map(([region, paths]) => (
        <div key={region} className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 capitalize">{region}</h2>
          <div className="grid grid-cols-3 gap-4">
            {paths.map(p => (
              <Link key={p.id} href={`/pathologies/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                    </div>
                    {p.sport && <p className="text-xs text-slate-400 mt-2">Sport: {p.sport}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
