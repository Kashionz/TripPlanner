import { useAddPlaceModal } from '@/hooks/useAddPlaceModal'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ArrowLeft, X } from 'lucide-react'
import { useEffect } from 'react'
import DetailForm from './DetailForm'
import SearchSection from './SearchSection'
import type { AddPlaceModalProps } from './types'

export default function AddPlaceModal({
  isOpen,
  onClose,
  onPlaceAdd,
  previousPlace
}: AddPlaceModalProps) {
  const isMobile = useIsMobile()
  
  const {
    mode,
    step,
    formData,
    selectedPlace,
    errors,
    reset,
    fillFromGooglePlace,
    fillFromQuickAccess,
    switchToManual,
    switchToSearch,
    updateField,
    getFormData,
    saveHistory,
    setStep
  } = useAddPlaceModal({ previousPlace })

  // 重置表單當彈窗開啟時
  useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // 處理表單提交
  const handleSubmit = async () => {
    const data = getFormData()
    if (!data) return

    try {
      // 如果有 Google Place ID，使用 Google Place
      if (selectedPlace) {
        await onPlaceAdd(selectedPlace, data.category)
      } else {
        // 手動輸入的景點，需要從地址轉換座標
        let lat = data.lat
        let lng = data.lng
        
        // 如果是手動模式且沒有座標，使用 Geocoding API
        if (mode === 'manual' && (!lat || !lng) && data.address) {
          try {
            const geocoder = new google.maps.Geocoder()
            const response = await geocoder.geocode({ address: data.address })
            
            if (response.results && response.results.length > 0) {
              const location = response.results[0].geometry.location
              lat = location.lat()
              lng = location.lng()
            } else {
              alert('無法找到該地址的座標，請確認地址是否正確')
              return
            }
          } catch (geocodeError) {
            console.error('地址轉座標失敗:', geocodeError)
            alert('地址轉座標失敗，請重試或使用搜尋功能')
            return
          }
        }
        
        // 建立 PlaceResult 格式
        const googlePlace: google.maps.places.PlaceResult = {
          place_id: data.placeId || `manual-${Date.now()}`,
          name: data.name,
          formatted_address: data.address,
          geometry: {
            location: new google.maps.LatLng(lat, lng)
          },
          photos: data.photos?.map(photo => ({
            getUrl: () => photo,
            photo_reference: '',
            width: 400,
            height: 300,
            html_attributions: []
          })),
          rating: data.rating,
          user_ratings_total: data.ratingTotal,
          types: [data.category]
        }
        
        await onPlaceAdd(googlePlace, data.category)
      }

      // 儲存到搜尋歷史
      saveHistory()
      
      // 關閉彈窗
      onClose()
    } catch (error) {
      console.error('新增景點失敗:', error)
      alert('新增景點失敗，請重試')
    }
  }

  // 處理快速景點選擇
  const handleQuickPlaceSelect = (place: any) => {
    fillFromQuickAccess(place)
  }

  // 處理 Google Place 選擇
  const handleGooglePlaceSelect = (place: google.maps.places.PlaceResult) => {
    fillFromGooglePlace(place)
  }

  // 處理返回按鈕
  const handleBack = () => {
    if (step === 'details') {
      setStep('place-info')
    } else if (mode === 'manual') {
      switchToSearch()
    }
  }

  if (!isOpen) return null

  // 手機版分步驟顯示
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-japanese-fade-in safe-bottom max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              {(step === 'details' || mode === 'manual') && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
              )}
              <h3 className="text-lg font-medium text-foreground">
                {step === 'place-info' ? '選擇景點' : '設定詳情'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {step === 'place-info' && mode === 'search' && (
              <SearchSection
                onPlaceSelect={handleGooglePlaceSelect}
                onQuickPlaceSelect={handleQuickPlaceSelect}
                onSwitchToManual={switchToManual}
              />
            )}


            {step === 'details' && (
              <DetailForm
                name={formData.name || ''}
                address={formData.address || ''}
                lat={formData.lat || 0}
                lng={formData.lng || 0}
                category={formData.category || 'attraction'}
                startTime={formData.startTime || null}
                duration={formData.duration || 60}
                note={formData.note || ''}
                photos={formData.photos}
                rating={formData.rating}
                ratingTotal={formData.ratingTotal}
                errors={errors}
                onFieldChange={(field, value) => updateField(field as any, value as any)}
                isManualMode={mode === 'manual'}
              />
            )}
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                  新增景點
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 桌面版完整顯示
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-japanese-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {mode === 'manual' && (
              <button
                onClick={switchToSearch}
                className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
              </button>
            )}
            <h3 className="text-xl font-medium text-foreground">
              新增景點
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {mode === 'search' && step === 'place-info' && (
            <SearchSection
              onPlaceSelect={handleGooglePlaceSelect}
              onQuickPlaceSelect={handleQuickPlaceSelect}
              onSwitchToManual={switchToManual}
            />
          )}


          {step === 'details' && (
            <DetailForm
              name={formData.name || ''}
              address={formData.address || ''}
              lat={formData.lat || 0}
              lng={formData.lng || 0}
              category={formData.category || 'attraction'}
              startTime={formData.startTime || null}
              duration={formData.duration || 60}
              note={formData.note || ''}
              photos={formData.photos}
              rating={formData.rating}
              ratingTotal={formData.ratingTotal}
              errors={errors}
              onFieldChange={(field, value) => updateField(field as any, value as any)}
              isManualMode={mode === 'manual'}
            />
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className="p-6 border-t border-border">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                新增景點
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}