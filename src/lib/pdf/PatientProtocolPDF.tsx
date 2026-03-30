import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { PatientWriterOutput } from '@/types/agents'

let fontRegistered = false;
if (!fontRegistered) {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff' },
      { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff', fontWeight: 700 },
    ],
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Inter', padding: 40, fontSize: 11, color: '#1e293b', backgroundColor: '#ffffff' },
  header: { borderBottom: '2px solid #0ea5e9', paddingBottom: 16, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#0369a1', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#0369a1', marginBottom: 8, marginTop: 20 },
  text: { lineHeight: 1.6, marginBottom: 6 },
  exerciseBox: { backgroundColor: '#f0f9ff', borderRadius: 6, padding: 12, marginBottom: 10, borderLeft: '3px solid #0ea5e9' },
  exerciseName: { fontWeight: 700, marginBottom: 4, color: '#0369a1' },
  dosage: { color: '#64748b', fontSize: 10, marginBottom: 4 },
  tip: { fontStyle: 'italic', color: '#475569', fontSize: 10 },
  warningBox: { backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginTop: 20, borderLeft: '3px solid #ef4444' },
  warningTitle: { fontWeight: 700, color: '#dc2626', marginBottom: 6 },
  warningItem: { color: '#7f1d1d', fontSize: 10, marginBottom: 3 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: '#94a3b8' },
  bullet: { marginBottom: 4, flexDirection: 'row' },
  bulletDot: { width: 16, color: '#0ea5e9' },
  bulletText: { flex: 1 },
  close: { backgroundColor: '#0369a1', borderRadius: 8, padding: 16, marginTop: 24 },
  closeText: { color: '#ffffff', fontWeight: 700, textAlign: 'center' },
})

interface Props {
  data: PatientWriterOutput
  pathologyName: string
  phaseName: string
  generatedAt: Date
  cabinetName?: string
}

export function PatientProtocolPDF({ data, pathologyName, phaseName, generatedAt, cabinetName }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{pathologyName} · Phase {phaseName}</Text>
          {cabinetName && <Text style={styles.subtitle}>{cabinetName}</Text>}
        </View>

        {/* Introduction */}
        <Text style={styles.text}>{data.introduction}</Text>

        {/* Objectifs */}
        <Text style={styles.sectionTitle}>Vos objectifs pour cette phase</Text>
        {data.objectives.map((obj, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>→</Text>
            <Text style={styles.bulletText}>{obj}</Text>
          </View>
        ))}

        {/* Exercices */}
        <Text style={styles.sectionTitle}>Votre programme d&apos;exercices</Text>
        {data.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseBox}>
            <Text style={styles.exerciseName}>{i + 1}. {ex.name}</Text>
            <Text style={styles.dosage}>{ex.sets}</Text>
            <Text style={styles.text}>{ex.howTo}</Text>
            {ex.tip && <Text style={styles.tip}>💡 {ex.tip}</Text>}
          </View>
        ))}

        {/* Progression */}
        <Text style={styles.sectionTitle}>Votre progression</Text>
        <Text style={styles.text}>{data.progressionMessage}</Text>

        {/* Signes d'alarme */}
        {data.importantWarnings.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Contactez votre kiné si vous ressentez :</Text>
            {data.importantWarnings.map((w, i) => (
              <Text key={i} style={styles.warningItem}>• {w}</Text>
            ))}
          </View>
        )}

        {/* Message de clôture */}
        <View style={styles.close}>
          <Text style={styles.closeText}>{data.motivationalClose}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Document généré le {new Date(generatedAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.footerText}>KinéProtocol AI</Text>
        </View>
      </Page>
    </Document>
  )
}
