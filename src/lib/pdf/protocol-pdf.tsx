// src/lib/pdf/protocol-pdf.tsx
// Note: utiliser avec dynamic(() => import('@/lib/pdf/protocol-pdf'), { ssr: false }) côté client
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#1e40af' },
  text: { fontSize: 11, lineHeight: 1.5 },
  exerciseCard: { marginBottom: 8, padding: 8, backgroundColor: '#f8fafc' },
  exerciseName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  bullet: { fontSize: 10, marginLeft: 8, marginBottom: 2 },
  warning: { fontSize: 10, color: '#dc2626', marginBottom: 2 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
})

interface ProtocolPDFProps {
  protocol: ProtocolWithRelations
  patientVersion: PatientWriterOutput
}

export function ProtocolPDF({ protocol, patientVersion }: ProtocolPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{patientVersion.title}</Text>
        <Text style={[styles.text, { marginBottom: 16, color: '#64748b' }]}>
          {protocol.pathology.name} — Phase {protocol.phase.name}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.text}>{patientVersion.introduction}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos objectifs</Text>
          {patientVersion.objectives.map((obj, i) => (
            <Text key={i} style={styles.bullet}>• {obj}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos exercices</Text>
          {patientVersion.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{i + 1}. {ex.name}</Text>
              <Text style={styles.text}>{ex.sets}</Text>
              <Text style={styles.text}>{ex.howTo}</Text>
              <Text style={[styles.text, { color: '#0369a1', marginTop: 4 }]}>💡 {ex.tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signes d'alarme</Text>
          {patientVersion.importantWarnings.map((w, i) => (
            <Text key={i} style={styles.warning}>⚠️ {w}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>{patientVersion.progressionMessage}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: '#eff6ff', padding: 12 }]}>
          <Text style={styles.text}>{patientVersion.motivationalClose}</Text>
        </View>

        <Text style={styles.footer}>
          Généré par KinéProtocol AI — {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  )
}
