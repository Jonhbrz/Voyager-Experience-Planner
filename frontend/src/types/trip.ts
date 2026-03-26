export interface Activity {
  id: number
  title: string
}

export interface Day {
  id: number
  title: string
  activities: Activity[]
}

export interface Trip {
  id: number
  name: string
  description?: string
  days: Day[]
}
