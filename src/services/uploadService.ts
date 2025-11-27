import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './firebase'

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'completed' | 'error'
  downloadURL?: string
  error?: string
}

export type UploadProgressCallback = (progress: UploadProgress) => void

/**
 * 上傳圖片到 Firebase Storage
 * @param file 要上傳的檔案
 * @param path 儲存路徑（例如：'trips/cover-images'）
 * @param onProgress 上傳進度回調
 * @returns 下載 URL
 */
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 驗證檔案類型
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上傳圖片檔案')
  }

  // 驗證檔案大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('圖片大小不能超過 5MB')
  }

  // 生成唯一檔名
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${randomString}.${extension}`
  const fullPath = `${path}/${fileName}`

  // 建立 Storage 參考
  const storageRef = ref(storage, fullPath)

  // 上傳檔案
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.({
          progress,
          status: 'uploading',
        })
      },
      (error) => {
        console.error('上傳失敗:', error)
        onProgress?.({
          progress: 0,
          status: 'error',
          error: getErrorMessage(error.code),
        })
        reject(new Error(getErrorMessage(error.code)))
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          onProgress?.({
            progress: 100,
            status: 'completed',
            downloadURL,
          })
          resolve(downloadURL)
        } catch (error: any) {
          console.error('取得下載 URL 失敗:', error)
          reject(new Error('取得圖片連結失敗'))
        }
      }
    )
  })
}

/**
 * 上傳行程封面圖片
 * @param file 要上傳的檔案
 * @param tripId 行程 ID（可選，用於更具體的路徑）
 * @param onProgress 上傳進度回調
 * @returns 下載 URL
 */
export async function uploadTripCoverImage(
  file: File,
  tripId?: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const path = tripId ? `trips/${tripId}/cover` : 'trips/cover-images'
  return uploadImage(file, path, onProgress)
}

/**
 * 從 URL 刪除圖片
 * @param imageUrl 圖片的下載 URL
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // 從 URL 中提取 Storage 路徑
    const storageRef = ref(storage, imageUrl)
    await deleteObject(storageRef)
  } catch (error: any) {
    // 如果圖片不存在，不拋出錯誤
    if (error.code === 'storage/object-not-found') {
      console.warn('圖片不存在，無需刪除')
      return
    }
    throw error
  }
}

/**
 * 壓縮圖片
 * @param file 原始圖片檔案
 * @param maxWidth 最大寬度
 * @param quality 壓縮品質 (0-1)
 * @returns 壓縮後的檔案
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 計算新尺寸
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // 繪製壓縮後的圖片
      ctx?.drawImage(img, 0, 0, width, height)

      // 轉換為 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error('圖片壓縮失敗'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 取得錯誤訊息
 */
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'storage/unauthorized':
      return '沒有上傳權限，請先登入'
    case 'storage/canceled':
      return '上傳已取消'
    case 'storage/unknown':
      return '上傳時發生未知錯誤'
    case 'storage/retry-limit-exceeded':
      return '上傳超時，請檢查網路連線'
    case 'storage/quota-exceeded':
      return '儲存空間已滿'
    default:
      return '上傳失敗，請稍後再試'
  }
}

/**
 * 驗證圖片檔案
 * @param file 要驗證的檔案
 * @returns 驗證結果
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 檢查檔案類型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支援 JPG、PNG、GIF、WebP 格式的圖片',
    }
  }

  // 檢查檔案大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '圖片大小不能超過 5MB',
    }
  }

  return { valid: true }
}