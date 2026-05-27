import { apiClient } from '@/api/axios'
import { API_ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse } from '@/types/api.types'
import type { UploadPayload } from '@/types/camera.types'

export interface UploadedFileDto {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

export const uploadService = {
  async uploadImage(payload: UploadPayload): Promise<UploadedFileDto> {
    const formData = new FormData()
    formData.append(payload.fieldName, payload.file, payload.file.name)

    if (payload.extraData) {
      Object.entries(payload.extraData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const { data } = await apiClient.post<ApiResponse<UploadedFileDto>>(
      API_ENDPOINTS.UPLOAD.IMAGE,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data.data
  },

  async uploadMultiple(files: File[], fieldName = 'files'): Promise<UploadedFileDto[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append(fieldName, file, file.name))

    const { data } = await apiClient.post<ApiResponse<UploadedFileDto[]>>(
      API_ENDPOINTS.UPLOAD.MULTIPART,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data.data
  },
}
