export interface ApiResponse<T> {
  data: T
  status: number
  message: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}
