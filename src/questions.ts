import type { } from './types'

export type QuestionStatus = 'unasked' | 'asked' | 'answered'
export type QuestionType = 'consultant' | 'gp' | 'hospital' | 'other'

export type Question = {
  id: string
  text: string
  type: QuestionType
  status: QuestionStatus
  createdAt: string
  updatedAt: string
}

export const QUESTIONS_KEY = 'willow.v1.questions'

export function loadQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitize)
  } catch {
    return []
  }
}

export function saveQuestions(qs: Question[]) {
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(qs))
}

export function addQuestion(qs: Question[], input: { text: string; type: QuestionType }): Question[] {
  const now = new Date().toISOString()
  const q: Question = {
    id: `q-${now}-${Math.random().toString(36).slice(2,8)}`,
    text: input.text.trim(),
    type: input.type,
    status: 'unasked',
    createdAt: now,
    updatedAt: now,
  }
  return [q, ...qs]
}

export function updateQuestion(qs: Question[], id: string, patch: Partial<Pick<Question,'text'|'type'|'status'>>): Question[] {
  const now = new Date().toISOString()
  return qs.map(q => q.id === id ? { ...q, ...patch, updatedAt: now } : q)
}

export function deleteQuestion(qs: Question[], id: string): Question[] {
  return qs.filter(q => q.id !== id)
}

function sanitize(x: any): Question {
  const now = new Date().toISOString()
  const text = typeof x?.text === 'string' ? x.text : ''
  const type: QuestionType = ['consultant','gp','hospital','other'].includes(x?.type) ? x.type : 'other'
  const status: QuestionStatus = ['unasked','asked','answered'].includes(x?.status) ? x.status : 'unasked'
  const id = typeof x?.id === 'string' && x.id ? x.id : `q-${now}-${Math.random().toString(36).slice(2,8)}`
  const createdAt = typeof x?.createdAt === 'string' && x.createdAt ? x.createdAt : now
  const updatedAt = typeof x?.updatedAt === 'string' && x.updatedAt ? x.updatedAt : now
  return { id, text, type, status, createdAt, updatedAt }
}

