import { finiteNumber, formatChartValue } from '../cartesian/cartesian-layout.js'

function accessorValue(accessor, fallback, ...arguments_) {
  if (typeof accessor === 'function') return accessor(...arguments_)
  return accessor ?? fallback
}

function normalizeDomain(minimum, maximum, requestedDomain) {
  const requestedMinimum = finiteNumber(requestedDomain?.[0])
  const requestedMaximum = finiteNumber(requestedDomain?.[1])

  if (requestedMinimum !== undefined && requestedMaximum !== undefined) {
    return [
      Math.min(requestedMinimum, requestedMaximum),
      Math.max(requestedMinimum, requestedMaximum),
    ]
  }

  if (minimum === undefined || maximum === undefined) return [0, 1]
  return [minimum, maximum]
}

function normalizeQuantiles(quantiles) {
  if (!Array.isArray(quantiles)) return []

  return [
    ...new Set(quantiles.map(finiteNumber).filter((value) => value >= 0 && value <= 1)),
  ].toSorted((a, b) => a - b)
}

function quantileForSorted(sorted, quantile) {
  const position = (sorted.length - 1) * quantile
  const lowerIndex = Math.floor(position)
  const interpolation = position - lowerIndex
  const lowerValue = sorted[lowerIndex]
  const upperValue = sorted[lowerIndex + 1]

  return upperValue === undefined
    ? lowerValue
    : lowerValue + interpolation * (upperValue - lowerValue)
}

function createQuantileThresholds(values, quantiles) {
  if (!values.length || !quantiles.length) return []

  const sorted = values.toSorted((a, b) => a - b)
  return quantiles.map((quantile) => quantileForSorted(sorted, quantile))
}

function colorLevel(value, domain, levelCount, quantileThresholds) {
  if (value === undefined) return undefined

  if (quantileThresholds.length) {
    const thresholdIndex = quantileThresholds.findIndex((threshold) => value <= threshold)
    const level = thresholdIndex === -1 ? quantileThresholds.length : thresholdIndex
    return Math.min(level, levelCount - 1)
  }

  const [minimum, maximum] = domain
  if (minimum === maximum) return levelCount - 1

  const ratio = Math.min(Math.max((value - minimum) / (maximum - minimum), 0), 1)
  return Math.min(Math.floor(ratio * levelCount), levelCount - 1)
}

function normalizeLevelCount(levelCount) {
  return Math.max(Math.floor(finiteNumber(levelCount) ?? 5), 1)
}

function numericCellValue(value) {
  return value === null || value === undefined ? undefined : finiteNumber(value)
}

export function createHeatmapLayout({
  cellColor,
  cellValue,
  columnId,
  columnLabel,
  data,
  domain,
  excludeZeroFromQuantiles = false,
  formatValue,
  levelCount,
  quantiles,
  rowDescription,
  rowId,
  rowLabel,
  rowValues,
}) {
  const sourceColumns = Array.isArray(data?.columns) ? data.columns : []
  const sourceRows = Array.isArray(data?.rows) ? data.rows : []
  const normalizedLevelCount = normalizeLevelCount(levelCount)
  const normalizedQuantiles = normalizeQuantiles(quantiles)

  const columns = sourceColumns.map((column, index) => ({
    datum: column,
    id: String(accessorValue(columnId, column?.id ?? index, column, index)),
    index,
    label: String(accessorValue(columnLabel, column?.label ?? column, column, index) ?? ''),
  }))

  const normalizedRows = sourceRows.map((row, rowIndex) => {
    const values = accessorValue(rowValues, row?.data ?? row?.values ?? [], row, rowIndex)

    return {
      datum: row,
      description: String(
        accessorValue(rowDescription, row?.description ?? row?.sublabel ?? '', row, rowIndex) ?? '',
      ),
      id: String(accessorValue(rowId, row?.id ?? rowIndex, row, rowIndex)),
      index: rowIndex,
      label: String(
        accessorValue(rowLabel, row?.label ?? row?.id ?? rowIndex, row, rowIndex) ?? '',
      ),
      values: Array.isArray(values) ? values : [],
    }
  })

  let minimum
  let maximum
  const numericValues = []
  const rows = normalizedRows.map((row) => {
    row.cells = columns.map((column) => {
      const datum = row.values[column.index]
      const value = numericCellValue(
        accessorValue(
          cellValue,
          datum?.value ?? datum?.count ?? datum,
          datum,
          row.datum,
          column.datum,
        ),
      )
      const color = accessorValue(
        cellColor,
        typeof datum === 'object' ? datum?.color : undefined,
        datum,
        row.datum,
        column.datum,
      )

      if (value !== undefined) {
        minimum = minimum === undefined ? value : Math.min(minimum, value)
        maximum = maximum === undefined ? value : Math.max(maximum, value)
        if (normalizedQuantiles.length && (!excludeZeroFromQuantiles || value !== 0)) {
          numericValues.push(value)
        }
      }

      return {
        color,
        column,
        datum,
        formattedValue:
          value === undefined ? '' : formatChartValue(formatValue, value, datum, row.datum),
        id: `${row.id}:${column.id}`,
        value,
      }
    })

    return row
  })
  const normalizedDomain = normalizeDomain(minimum, maximum, domain)
  const quantileThresholds = createQuantileThresholds(numericValues, normalizedQuantiles)

  for (const row of rows) {
    for (const cell of row.cells) {
      cell.level = colorLevel(
        cell.value,
        normalizedDomain,
        normalizedLevelCount,
        quantileThresholds,
      )
    }
  }

  return {
    columns,
    domain: normalizedDomain,
    error:
      !columns.length || !rows.length ? 'Heatmap data requires at least one column and row.' : '',
    levelCount: normalizedLevelCount,
    quantileThresholds,
    quantiles: normalizedQuantiles,
    rows,
  }
}
