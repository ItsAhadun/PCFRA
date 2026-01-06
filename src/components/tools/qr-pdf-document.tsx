import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

interface PrintQRDocumentProps {
  qrCodes: {
    id: string
    url: string
    label: string
    subLabel?: string
  }[]
  settings: {
    paperSize: 'A4' | 'LETTER'
    qrSize: number // in mm
    spacing: number // in mm
    showLabels: boolean
  }
}

// Convert mm to points (1 mm = 2.83465 points)
const mmToPt = (mm: number) => mm * 2.83465

export const PrintQRDocument = ({
  qrCodes,
  settings,
}: PrintQRDocumentProps) => {
  const {
    paperSize,
    qrSize: qrSizeMm,
    spacing: spacingMm,
    showLabels,
  } = settings

  const qrSize = mmToPt(qrSizeMm)
  const spacing = mmToPt(spacingMm)
  const margin = mmToPt(10) // 10mm page margin

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: margin,
      alignContent: 'flex-start',
    },
    itemContainer: {
      width: qrSize,
      marginRight: spacing,
      marginBottom: spacing,
      alignItems: 'center',
    },
    image: {
      width: qrSize,
      height: qrSize,
    },
    label: {
      fontSize: 10,
      textAlign: 'center',
      marginTop: 2,
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxLines: 1,
    },
    subLabel: {
      fontSize: 8,
      color: '#666',
      textAlign: 'center',
      width: '100%',
    },
  })

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
        {qrCodes.map((qr) => (
          <View key={qr.id} style={styles.itemContainer} wrap={false}>
            {/* 
                            Note: @react-pdf/renderer Image requires a valid source. 
                            If passing a base64 Data URI from standard qrcode lib, it works.
                        */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qr.url} style={styles.image} />

            {showLabels && (
              <>
                <Text style={styles.label}>{qr.label}</Text>
                {qr.subLabel && (
                  <Text style={styles.subLabel}>{qr.subLabel}</Text>
                )}
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}
