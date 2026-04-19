export interface Activity {
  id: number
  day_id?: number
  title: string
  order?: number
  start_time: string
  end_time?: string | null
  /** Completada por el usuario (omitida en APIs antiguas → false). */
  completed?: boolean
  /** Importe en EUR (API antigua → 0). */
  price?: number
}

export interface Transport {
  id: number
  day_id: number
  from: string
  to: string
  type: string
  /** Importe en EUR (API antigua → 0). */
  price?: number
  duration?: string | null
  notes?: string | null
}

export interface Stay {
  id: number
  day_id: number
  name: string
  location: string
  /** Importe en EUR (API antigua → 0). */
  price?: number
  check_in?: string | null
  check_out?: string | null
  notes?: string | null
}

export interface Day {
  id: number
  title: string
  order?: number
  activities: Activity[]
  transports: Transport[]
  stays: Stay[]
}

export interface Trip {
  id: number
  name: string
  description?: string
  /** ISO YYYY-MM-DD; opcional para viajes antiguos */
  start_date?: string | null
  end_date?: string | null
  days: Day[]
}
