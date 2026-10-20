import * as XLSX from 'xlsx-js-style'
import { unzipSync, zipSync } from 'fflate'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SavedQuotation, CustomerFacingQuotation } from '../data/quotation-service'

const moneyFormat = '"₦"#,##0.00;[Red]("₦"#,##0.00)'
const safeFilename = (value: string) => value.replace(/[^a-z0-9-]/gi, '-')

export function downloadInternalCostingWorkbook(quotation: SavedQuotation): void {
  const { costingSnapshot: snapshot } = quotation
  const workbook = XLSX.utils.book_new()
  const groupSubtotals = new Map(quotation.quanSubtotals.map((group) => [group.group, group.subtotalNgn]))
  const groupNames = [...new Set(snapshot.lines.map((line) => line.quanGroup))]
  const additionalPerMeterNgn = snapshot.productionCostPerMeterNgn - snapshot.componentCostPerMeterNgn
  const batchOnlyCostsNgn = snapshot.additionalCosts.filter((cost) => cost.basis === 'batch').reduce((sum, cost) => sum + cost.amountNgn, 0)
  const summaryRows: (string | number)[][] = [
    ['INTERNAL COSTING DOCUMENT'], ['DEMO DATA · Fictional sample values · NGN'], [],
    ['Meter configuration', snapshot.configurationName, 'Configuration code', snapshot.configurationCode],
    ['Meter type', snapshot.meterType], ['Export date', new Date().toISOString().slice(0, 10)],
    ['Production quantity', snapshot.productionQuantity], [], ['QUAN SUBTOTALS'],
    ...groupNames.map((group) => [group, 'Subtotal per meter', groupSubtotals.get(group) ?? 0]),
    ['Total component cost per meter', snapshot.componentCostPerMeterNgn], [], ['ADDITIONAL PRODUCTION COSTS'],
    ...snapshot.additionalCosts.map((cost) => [cost.name, cost.amountNgn, cost.basis === 'per-unit' ? 'Per meter' : 'One time per batch']),
    ['Total additional production cost per meter', additionalPerMeterNgn],
    ['Total production cost per meter', snapshot.productionCostPerMeterNgn],
    ['Total batch production cost', snapshot.batchProductionCostNgn],
  ]
  const summary = XLSX.utils.aoa_to_sheet(summaryRows)
  summary['!cols'] = [{ wch: 39 }, { wch: 37 }, { wch: 24 }, { wch: 28 }]
  summary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }]
  summary['!rows'] = summaryRows.map((row, index) => ({ hpt: index < 2 ? 24 : row[0] === 'QUAN SUBTOTALS' || row[0] === 'ADDITIONAL PRODUCTION COSTS' ? 22 : 27 }))
  const styleCell = (sheet: XLSX.WorkSheet, row: number, col: number, style: object) => {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })]
    if (cell) cell.s = style
  }
  const titleStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, fill: { fgColor: { rgb: '17335C' } }, alignment: { vertical: 'center' } }
  const demoStyle = { font: { bold: true, color: { rgb: '8A4B08' } }, fill: { fgColor: { rgb: 'FFF3D6' } } }
  const sectionStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '36577D' } } }
  const subtotalStyle = { font: { bold: true, color: { rgb: '17335C' } }, fill: { fgColor: { rgb: 'EEF4FC' } }, border: { top: { style: 'thin', color: { rgb: 'C9D8EA' } } } }
  const totalStyle = { font: { bold: true, color: { rgb: '17335C' } }, fill: { fgColor: { rgb: 'DCEBFF' } }, border: { top: { style: 'thin', color: { rgb: '9CB7D8' } } } }
  for (let col = 0; col < 4; col++) { styleCell(summary, 0, col, titleStyle); styleCell(summary, 1, col, demoStyle) }
  summaryRows.forEach((row, index) => {
    const name = String(row[0] ?? '')
    if (name === 'QUAN SUBTOTALS' || name === 'ADDITIONAL PRODUCTION COSTS') for (let col = 0; col < 4; col++) styleCell(summary, index, col, sectionStyle)
    if (name.includes('Total component') || name.includes('Total additional') || name.includes('Total production') || name.includes('Total batch')) for (let col = 0; col < 4; col++) styleCell(summary, index, col, totalStyle)
    if (row[1] === 'Subtotal per meter') for (let col = 0; col < 4; col++) styleCell(summary, index, col, subtotalStyle)
    for (let col = 1; col < row.length; col++) {
      const cell = summary[XLSX.utils.encode_cell({ r: index, c: col })]
      if (cell && typeof cell.v === 'number' && name !== 'Production quantity') cell.z = moneyFormat
    }
  })
  for (let row = 0; row < summaryRows.length; row++) {
    const label = String(summaryRows[row]?.[0] ?? '')
    if (label === 'Production quantity') { const cell = summary[XLSX.utils.encode_cell({ r: row, c: 1 })]; if (cell) cell.z = '#,##0' }
  }
  XLSX.utils.book_append_sheet(workbook, summary, 'Cost Summary')

  const breakdown: (string | number)[][] = [
    ['INTERNAL COMPONENT BREAKDOWN · DEMO DATA'], [],
    ['Quan group', 'Component code', 'Component name', 'Exact specification / variant', 'Quantity / meter', 'Unit', 'Unit cost (NGN)', 'Line total / meter (NGN)'],
  ]
  for (const group of groupNames) {
    for (const line of snapshot.lines.filter((item) => item.quanGroup === group)) breakdown.push([group, line.componentCode, line.componentName, line.specification, line.quantity, line.unitOfMeasure, line.unitCostNgn, line.lineTotalNgn])
    breakdown.push([group, `${group} subtotal`, '', '', '', '', '', groupSubtotals.get(group) ?? 0])
  }
  breakdown.push(['', 'TOTAL COMPONENT COST PER METER', '', '', '', '', '', snapshot.componentCostPerMeterNgn])
  const components = XLSX.utils.aoa_to_sheet(breakdown)
  components['!cols'] = [{ wch: 15 }, { wch: 21 }, { wch: 33 }, { wch: 52 }, { wch: 19 }, { wch: 12 }, { wch: 21 }, { wch: 27 }]
  components['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
  components['!autofilter'] = { ref: `A3:H${breakdown.length}` }
  components['!rows'] = breakdown.map((row, index) => ({ hpt: index === 0 ? 25 : index === 1 ? 6 : index === 2 ? 31 : String(row[1] ?? '').toLowerCase().includes('subtotal') || String(row[1] ?? '').includes('TOTAL') ? 22 : 34 }))
  const headerIndex = 2
  const rowIndex = (row: number, column: number) => XLSX.utils.encode_cell({ r: row, c: column })
  for (let r = 0; r < breakdown.length; r++) {
    const rowName = String(breakdown[r]?.[1] ?? breakdown[r]?.[0] ?? '')
    for (const c of [6, 7]) {
      const cell = components[rowIndex(r, c)]
      if (cell && typeof cell.v === 'number') cell.z = moneyFormat
    }
    const qtyCell = components[rowIndex(r, 4)]
    if (qtyCell && typeof qtyCell.v === 'number') qtyCell.z = '#,##0.####'
    for (const c of [0, 1, 2, 3, 5]) {
      const cell = components[rowIndex(r, c)]
      if (cell && typeof cell.v === 'string') cell.s = { alignment: { vertical: 'top', wrapText: true } }
    }
    if (rowName.includes('subtotal') || rowName.includes('TOTAL')) for (let c = 0; c < 8; c++) styleCell(components, r, c, rowName.includes('TOTAL') ? totalStyle : subtotalStyle)
  }
  for (let c = 0; c < 8; c++) styleCell(components, headerIndex, c, { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '17335C' } }, alignment: { vertical: 'center', wrapText: true } })
  XLSX.utils.book_append_sheet(workbook, components, 'Component Breakdown')

  const productionRows: (string | number)[][] = [
    ['PRODUCTION COST DETAIL · DEMO DATA'], [],
    ['Cost item', 'Calculation basis', 'Amount (NGN)', 'Cost per meter (NGN)'],
    ...snapshot.additionalCosts.map((cost) => [cost.name, cost.basis === 'per-unit' ? 'Per meter' : 'One time per batch', cost.amountNgn, cost.basis === 'per-unit' ? cost.amountNgn : '']),
    ['Total additional production cost per meter', 'Per-meter additional items', additionalPerMeterNgn, additionalPerMeterNgn],
    [], ['BATCH PRODUCTION CALCULATION'],
    ['Production cost per meter (NGN)', snapshot.productionCostPerMeterNgn],
    ['Production quantity (meters)', snapshot.productionQuantity],
    ['Batch-only additional costs (NGN)', batchOnlyCostsNgn],
    ['Calculation', `${snapshot.productionCostPerMeterNgn.toLocaleString('en-NG')} × ${snapshot.productionQuantity.toLocaleString('en-NG')} meters + ${batchOnlyCostsNgn.toLocaleString('en-NG')} batch-only costs`],
    ['Total production cost per meter (NGN)', snapshot.productionCostPerMeterNgn],
    ['Total batch production cost (NGN)', snapshot.batchProductionCostNgn],
  ]
  const production = XLSX.utils.aoa_to_sheet(productionRows)
  production['!cols'] = [{ wch: 40 }, { wch: 33 }, { wch: 23 }, { wch: 24 }]
  production['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  production['!rows'] = productionRows.map((_, index) => ({ hpt: index === 0 ? 25 : index === 1 ? 6 : index === 2 ? 30 : 27 }))
  production['!autofilter'] = { ref: `A3:D${snapshot.additionalCosts.length + 3}` }
  for (let col = 0; col < 4; col++) { styleCell(production, 0, col, titleStyle); styleCell(production, 2, col, { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '17335C' } }, alignment: { vertical: 'center', wrapText: true } }) }
  for (let row = 0; row < productionRows.length; row++) {
    const label = String(productionRows[row]?.[0] ?? '')
    if (label === 'BATCH PRODUCTION CALCULATION') for (let col = 0; col < 4; col++) styleCell(production, row, col, sectionStyle)
    if (label.includes('Total')) for (let col = 0; col < 4; col++) styleCell(production, row, col, totalStyle)
    for (const col of [2, 3]) { const cell = production[rowIndex(row, col)]; if (cell && typeof cell.v === 'number') cell.z = moneyFormat }
    const qty = production[rowIndex(row, 1)]
    if (label === 'Production quantity (meters)' && qty) qty.z = '#,##0'
  }
  XLSX.utils.book_append_sheet(workbook, production, 'Production Costs')
  const workbookBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true }) as ArrayBuffer | Uint8Array
  const archive = unzipSync(workbookBytes instanceof Uint8Array ? workbookBytes : new Uint8Array(workbookBytes))
  const freezeRows = [2, 3, 3]
  freezeRows.forEach((rows, index) => {
    const path = `xl/worksheets/sheet${index + 1}.xml`
    const xml = archive[path]
    if (!xml) throw new Error(`Workbook worksheet ${path} is missing.`)
    const text = new TextDecoder().decode(xml)
    const topCell = `A${rows + 1}`
    const view = `<sheetView workbookViewId="0"><pane ySplit="${rows}" topLeftCell="${topCell}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${topCell}" sqref="${topCell}"/></sheetView>`
    archive[path] = new TextEncoder().encode(text.replace(/<sheetView([^>]*)\/>/, (_match, attributes: string) => `<sheetView${attributes}>${view.slice(view.indexOf('>') + 1)}`))
  })
  const output = zipSync(archive, { level: 6 })
  const blob = new Blob([output as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeFilename(quotation.quotationNumber)}-Internal-Costing.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadCustomerQuotationPdf(quote: CustomerFacingQuotation, quotationNumber: string): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 17
  const formatMoney = (amount: number) => `NGN ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.setFillColor(23, 51, 92)
  doc.rect(0, 0, pageWidth, 37, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(quote.companyName, margin, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('DEMO PLACEHOLDER COMPANY · SAMPLE QUOTATION', margin, 22)
  doc.text(`${quote.companyEmail}  |  ${quote.companyPhone}`, margin, 29)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('QUOTATION', margin, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`Quotation no.  ${quote.quotationNumber}`, pageWidth - margin, 47, { align: 'right' })
  doc.text(`Date  ${formatDate(quote.quotationDate)}`, pageWidth - margin, 54, { align: 'right' })
  doc.text(`Valid until  ${formatDate(quote.validUntil)}`, pageWidth - margin, 61, { align: 'right' })
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, 68, pageWidth - margin, 68)

  let y = 78
  const pageHeight = doc.internal.pageSize.getHeight()
  const drawWrappedLines = (text: string, x: number, width: number, startY: number, leading = 4.5) => {
    const lines = doc.splitTextToSize(text, width) as string[]
    let offset = 0
    let cursor = startY
    while (offset < lines.length) {
      const capacity = Math.max(1, Math.floor((pageHeight - 18 - cursor) / leading))
      const chunk = lines.slice(offset, offset + capacity)
      doc.text(chunk, x, cursor)
      cursor += chunk.length * leading
      offset += chunk.length
      if (offset < lines.length) { doc.addPage(); cursor = 20 }
    }
    return cursor
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('PREPARED FOR', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  y += 6
  const customerLines = [quote.customerName, quote.contactPerson, quote.customerAddress, quote.customerContact].filter(Boolean)
  for (const line of customerLines) {
    y = drawWrappedLines(line, margin, 88, y)
  }
  y += 7
  if (y + 45 > pageHeight - 18) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  y = drawWrappedLines(quote.meterName, margin, pageWidth - margin * 2 - 46, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  y += 5
  const descriptionLines = doc.splitTextToSize(`${quote.meterCode} · ${quote.meterDescription}`, pageWidth - margin * 2) as string[]
  doc.setFontSize(9)
  y = drawWrappedLines(`${quote.meterCode} · ${quote.meterDescription}`, margin, pageWidth - margin * 2, y)
  y += descriptionLines.length * 4.5 + 4

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description', 'Quantity', 'Unit price', 'Amount']],
    body: [[quote.meterName, String(quote.quantity), formatMoney(quote.unitSellingPriceNgn), formatMoney(quote.subtotalNgn)]],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak', textColor: [51, 65, 85] },
    headStyles: { fillColor: [23, 51, 92], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 83 }, 1: { halign: 'right', cellWidth: 22 }, 2: { halign: 'right', cellWidth: 35 }, 3: { halign: 'right', cellWidth: 35 } },
  })
  const afterTableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 24
  let totalY = afterTableY + 8
  const totalRows: string[][] = [['Quotation subtotal', formatMoney(quote.subtotalNgn)]]
  if (quote.discountPercent > 0) totalRows.push([`Discount (${quote.discountPercent}%)`, `− ${formatMoney(quote.discountAmountNgn)}`])
  totalRows.push(['Quotation total', formatMoney(quote.totalNgn)])
  autoTable(doc, {
    startY: totalY,
    margin: { left: pageWidth - margin - 88, right: margin },
    body: totalRows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
    columnStyles: { 0: { cellWidth: 48 }, 1: { cellWidth: 40, halign: 'right' } },
    didParseCell: (data) => { if (data.row.index === totalRows.length - 1) data.cell.styles.fontStyle = 'bold' },
  })
  totalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? totalY + 20
  let detailY = totalY + 10
  const addSection = (title: string, content: string) => {
    if (!content.trim()) return
    if (detailY + 10 > pageHeight - 18) { doc.addPage(); detailY = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(title, margin, detailY)
    detailY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    detailY = drawWrappedLines(content, margin, pageWidth - margin * 2, detailY)
    detailY += 5
  }
  addSection('Payment terms', quote.paymentTerms)
  addSection('Delivery terms', quote.deliveryTerms)
  addSection('Additional notes', quote.notes)
  if (detailY + 12 > doc.internal.pageSize.getHeight() - 10) { doc.addPage(); detailY = 20 }
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('DEMO SAMPLE DOCUMENT · Fictional company and customer details · No tax applied', margin, detailY + 3)
  doc.save(`${safeFilename(quotationNumber)}-Quotation.pdf`)
}
