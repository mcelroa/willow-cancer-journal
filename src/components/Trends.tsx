import { useMemo, useState } from 'react'
import type { Entry } from '../types'
import { normalize, formatDate } from '../types'

type RangeOpt = '7' | '30' | 'all'
type SmoothOpt = 'off' | 'avg7' | 'avg30'

export function Trends({ entries }: { entries: Entry[] }) {
  const sorted = useMemo(() => [...entries].sort((a,b) => a.date.localeCompare(b.date)), [entries])
  const [range, setRange] = useState<RangeOpt>('30')
  const [smooth, setSmooth] = useState<SmoothOpt>('off')

  if (sorted.length === 0) {
    return <div className="card">No data yet. Add an entry to see trends.</div>
  }

  const sliced = useMemo(() => selectRange(sorted, range), [sorted, range])
  const base = useMemo(() => ({
    mood: sliced.map(e => normalize(e.mood, 0, 10)),
    pain: sliced.map(e => normalize(e.pain, 0, 10)),
    fatigue: sliced.map(e => normalize(e.fatigue, 0, 10)),
    nausea: sliced.map(e => normalize(e.nausea, 0, 10)),
  }), [sliced])

  const labels = sliced.map(e => e.date)
  const series = useMemo(() => {
    if (smooth === 'avg7') return avgAll(base, 7)
    if (smooth === 'avg30') return avgAll(base, 30)
    return base
  }, [base, smooth])

  return (
    <div className="card">
      <div className="chart-legend">
        <Legend label="Mood" color="var(--c-mood)" />
        <Legend label="Pain" color="var(--c-pain)" />
        <Legend label="Fatigue" color="var(--c-fatigue)" />
        <Legend label="Nausea" color="var(--c-nausea)" />
      </div>
      <div className="chart-controls">
        <div className="group range">
          <span className="muted">Range:</span>
          <button className={'tab' + (range==='7'?' active':'')} onClick={()=>setRange('7')}>7</button>
          <button className={'tab' + (range==='30'?' active':'')} onClick={()=>setRange('30')}>30</button>
          <button className={'tab' + (range==='all'?' active':'')} onClick={()=>setRange('all')}>All</button>
        </div>
        <div className="group smooth">
          <span className="muted">Smoothing:</span>
          <span className="select-wrap">
            <select className="nice-select" value={smooth} onChange={e => setSmooth(e.target.value as SmoothOpt)}>
              <option value="off">Off</option>
              <option value="avg7">7‑day avg</option>
              <option value="avg30">30‑day avg</option>
            </select>
          </span>
        </div>
      </div>
      <LineChart labels={labels} series={series} height={260} />
      <small className="muted">Higher is more for all metrics; mood 1–10, others 0–10.</small>
    </div>
  )
}

function Legend({ label, color }: {label: string; color: string}) {
  return (
    <span className="legend"><span className="swatch" style={{backgroundColor: color}} /> {label}</span>
  )
}

function LineChart({ labels, series, height = 200 }: { labels: string[]; series: Record<string, number[]>; height?: number }) {
  const padding = { top: 16, right: 16, bottom: 28, left: 28 }
  const width = Math.max(360, labels.length * 40)
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const x = (i: number) => labels.length <= 1 ? padding.left + innerW/2 : padding.left + (i * innerW) / (labels.length - 1)
  const y = (v: number) => padding.top + innerH - v * innerH

  const gridY = [0, 0.25, 0.5, 0.75, 1]
  const colors: Record<string, string> = {
    mood: 'var(--c-mood)',
    pain: 'var(--c-pain)',
    fatigue: 'var(--c-fatigue)',
    nausea: 'var(--c-nausea)'
  }

  const pathFor = (values: number[]) => values.map((v, i) => `${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ')

  return (
    <div className="chart-wrap">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trends over time for mood, pain, fatigue, and nausea">
        <rect x={0} y={0} width={width} height={height} fill="var(--panel)" rx="8" />

        {gridY.map(g => (
          <g key={g}>
            <line x1={padding.left} y1={y(g)} x2={padding.left+innerW} y2={y(g)} stroke="var(--border)" strokeDasharray="4 4" />
            <text x={4} y={y(g)+4} fontSize="10" fill="var(--muted)">{Math.round(g*10)}</text>
          </g>
        ))}

        {labels.map((d, i) => (
          <text key={d} x={x(i)} y={height-8} fontSize="10" textAnchor="middle" fill="var(--muted)">{formatDate(d)}</text>
        ))}

        {Object.entries(series).map(([name, values]) => (
          <path key={name} d={pathFor(values)} fill="none" stroke={colors[name] ?? 'steelblue'} strokeWidth={2} />
        ))}
        {Object.entries(series).map(([name, values]) => (
          <g key={name+':pts'}>
            {values.map((v,i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={colors[name] ?? 'steelblue'} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}

function selectRange(entries: Entry[], range: RangeOpt) {
  if (range === 'all') return entries
  const n = range === '7' ? 7 : 30
  return entries.slice(-n)
}

function movingAverage(values: number[], window: number) {
  const out: number[] = []
  let sum = 0
  const q: number[] = []
  for (let i = 0; i < values.length; i++) {
    q.push(values[i])
    sum += values[i]
    if (q.length > window) sum -= q.shift()!
    out.push(sum / q.length)
  }
  return out
}

function avgAll(series: Record<string, number[]>, window: number) {
  const out: Record<string, number[]> = {}
  for (const [k, v] of Object.entries(series)) out[k] = movingAverage(v, window)
  return out
}
