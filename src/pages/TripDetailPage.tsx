import { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Map as MapIcon,
  List,
  MessageSquare,
  UserPlus,
  DollarSign,
  Download,
  Share2,
} from 'lucide-react'
import { useTrip, useTripActions, useDateFormatter, useTripStats } from '@/hooks/useTrip'
import { useTripPlaces, usePlaceActions, useSelectedPlace } from '@/hooks/usePlace'
import { useTripComments } from '@/hooks/useCollaboration'
import { useTripExpenses, useExpenseSummary } from '@/hooks/useExpense'
import { useAuthStore } from '@/stores/authStore'
import DayCard from '@/components/itinerary/DayCard'
import DraggableList from '@/components/itinerary/DraggableList'
import { PlaceSearchModal } from '@/components/itinerary/PlaceSearch'
import PlaceEditModal, { DeleteConfirmModal } from '@/components/itinerary/PlaceEditModal'
import TripMap from '@/components/map/TripMap'
import InviteModal from '@/components/collaboration/InviteModal'
import MemberList from '@/components/collaboration/MemberList'
import Comments from '@/components/collaboration/Comments'
import { ExportModal } from '@/components/export'
import type { Day, MemberRole } from '@/types/trip'
import type { Place, PlaceCategory } from '@/types/place'

type ViewMode = 'list' | 'map' | 'split'

export default function TripDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { trip, loading, error } = useTrip(id)
  const { deleteTrip, updateDayNote } = useTripActions()
  const { formatDateRange } = useDateFormatter()
  const stats = useTripStats(id)

  // 景點相關狀態
  const dayIds = useMemo(() => trip?.days?.map(d => d.id) || [], [trip?.days])
  const { allPlaces, getPlacesByDay } = useTripPlaces(id, dayIds)
  const { addPlace, editPlace, removePlace, reorder } = usePlaceActions()
  const { selectedPlaceId, selectPlace } = useSelectedPlace()

  // 留言
  const { comments } = useTripComments(id)

  // 費用 (用於匯出)
  const { expenses } = useTripExpenses(id)
  const { summary: expenseSummary } = useExpenseSummary(expenses, trip?.members || [])

  // 列印參考
  const contentRef = useRef<HTMLDivElement>(null)

  // UI 狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Modal 狀態
  const [showPlaceSearch, setShowPlaceSearch] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [deletingPlace, setDeletingPlace] = useState<{ dayId: string; place: Place } | null>(null)

  const handleDelete = async () => {
    if (!id) return
    
    setIsDeleting(true)
    try {
      await deleteTrip(id)
    } catch (error) {
      console.error('刪除失敗:', error)
      setIsDeleting(false)
    }
  }

  const handleUpdateDayNote = async (dayId: string, note: string) => {
    if (!id) return
    await updateDayNote(id, dayId, note)
  }

  // 景點操作
  const handleAddPlace = (dayId: string) => {
    setSelectedDayId(dayId)
    setShowPlaceSearch(true)
  }

  const handlePlaceAdd = async (place: google.maps.places.PlaceResult, category: PlaceCategory) => {
    if (!id || !selectedDayId) return
    await addPlace(id, selectedDayId, place, category)
    setShowPlaceSearch(false)
    setSelectedDayId(null)
  }

  const handlePlaceEdit = (place: Place) => {
    setEditingPlace(place)
  }

  const handlePlaceSave = async (data: {
    startTime: string | null
    endTime: string | null
    duration: number
    note: string
    category: PlaceCategory
  }) => {
    if (!id || !editingPlace) return
    await editPlace(id, editingPlace.dayId, editingPlace.id, data)
    setEditingPlace(null)
  }

  const handlePlaceDelete = (dayId: string, place: Place) => {
    setDeletingPlace({ dayId, place })
  }

  const handleConfirmDelete = async () => {
    if (!id || !deletingPlace) return
    await removePlace(id, deletingPlace.dayId, deletingPlace.place.id)
    setDeletingPlace(null)
  }

  const handleReorder = async (dayId: string, newOrder: string[]) => {
    if (!id) return
    await reorder(id, dayId, newOrder)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">載入中...</p>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '行程不存在'}</p>
          <Link
            to="/dashboard"
            className="text-primary hover:underline"
          >
            返回儀表板
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = trip.ownerId === user?.id
  // 檢查使用者角色
  const currentUserMember = trip.members?.find(m => m.userId === user?.id)
  const currentUserRole: MemberRole | undefined = currentUserMember?.role
  const canEdit = isOwner || currentUserRole === 'editor'

  return (
    <div className="space-y-6 animate-japanese-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-light text-foreground">
              {trip.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-foreground-muted mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {stats.totalDays} 天 · {allPlaces.length} 景點
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 檢視模式切換 */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-background-tertiary'
              }`}
              title="列表檢視"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-white shadow-sm' : 'hover:bg-background-tertiary'
              }`}
              title="分割檢視"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-background-tertiary'
              }`}
              title="地圖檢視"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          {/* 留言按鈕 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`p-2 rounded-lg transition-colors relative ${
              showComments ? 'bg-primary/10 text-primary' : 'hover:bg-background-secondary text-foreground-secondary'
            }`}
            title="討論"
          >
            <MessageSquare className="w-5 h-5" />
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                {comments.length > 99 ? '99+' : comments.length}
              </span>
            )}
          </button>

          {/* 邀請按鈕 */}
          {canEdit && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              title="邀請成員"
            >
              <UserPlus className="w-5 h-5 text-foreground-secondary" />
            </button>
          )}
          
          {/* 費用按鈕 */}
          <Link
            to={`/trip/${id}/expense`}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            title="費用管理"
          >
            <DollarSign className="w-5 h-5 text-foreground-secondary" />
          </Link>

          {canEdit && (
            <Link
              to={`/trip/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              <Edit className="w-4 h-4" />
              編輯
            </Link>
          )}

          {/* 匯出按鈕 */}
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            title="匯出行程"
          >
            <Download className="w-5 h-5 text-foreground-secondary" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-foreground-secondary" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-border py-2 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowExportModal(true)
                    }}
                    className="w-full px-4 py-2 text-left text-foreground-secondary hover:bg-background-secondary flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    匯出 / 分享
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowDeleteConfirm(true)
                      }}
                      className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      刪除行程
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <p className="text-foreground-secondary">{trip.description}</p>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`grid gap-6 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Days & Places */}
        {viewMode !== 'map' && (
          <div className="space-y-4">
            {trip.days && trip.days.length > 0 ? (
              trip.days.map((day: Day) => {
                const dayPlaces = getPlacesByDay(day.id)
                return (
                  <DayCard
                    key={day.id}
                    day={day}
                    onUpdateNote={canEdit ? handleUpdateDayNote : undefined}
                    onAddPlace={canEdit ? () => handleAddPlace(day.id) : undefined}
                    isEditing={canEdit}
                  >
                    {dayPlaces.length > 0 && (
                      <DraggableList
                        places={dayPlaces}
                        isEditing={canEdit}
                        selectedPlaceId={selectedPlaceId}
                        onReorder={(newOrder) => handleReorder(day.id, newOrder)}
                        onPlaceSelect={selectPlace}
                        onPlaceEdit={handlePlaceEdit}
                        onPlaceDelete={(placeId) => {
                          const place = dayPlaces.find(p => p.id === placeId)
                          if (place) handlePlaceDelete(day.id, place)
                        }}
                      />
                    )}
                  </DayCard>
                )
              })
            ) : (
              <div className="bg-white rounded-2xl border border-border p-12 text-center">
                <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">尚無行程天數</p>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        {viewMode !== 'list' && (
          <div className={`${viewMode === 'map' ? 'col-span-full' : ''}`}>
            <div className={`bg-white rounded-2xl border border-border overflow-hidden sticky top-4 ${
              viewMode === 'map' ? 'h-[calc(100vh-200px)]' : 'h-[500px] lg:h-[calc(100vh-200px)]'
            }`}>
              <TripMap
                places={allPlaces}
                selectedPlaceId={selectedPlaceId}
                onPlaceSelect={selectPlace}
                showRoutes={true}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Sidebar (only in list mode) */}
        {viewMode === 'list' && (
          <div className="lg:col-span-1 space-y-6">
            {/* Members */}
            <MemberList
              tripId={id!}
              members={trip.members || []}
              currentUserRole={currentUserRole}
              onInvite={canEdit ? () => setShowInviteModal(true) : undefined}
            />

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-medium text-foreground mb-4">
                統計
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-light text-foreground">
                    {stats.totalDays}
                  </div>
                  <div className="text-xs text-foreground-muted">天數</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-foreground">
                    {allPlaces.length}
                  </div>
                  <div className="text-xs text-foreground-muted">景點</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-foreground">
                    {stats.totalMembers}
                  </div>
                  <div className="text-xs text-foreground-muted">成員</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-foreground">
                    {comments.length}
                  </div>
                  <div className="text-xs text-foreground-muted">留言</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-foreground mb-2">
              確定要刪除此行程？
            </h3>
            <p className="text-foreground-secondary mb-6">
              此操作無法復原，所有行程資料將永久刪除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground-secondary hover:bg-background-secondary transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    刪除中...
                  </>
                ) : (
                  '確定刪除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place Search Modal */}
      <PlaceSearchModal
        isOpen={showPlaceSearch}
        onClose={() => {
          setShowPlaceSearch(false)
          setSelectedDayId(null)
        }}
        onPlaceAdd={handlePlaceAdd}
      />

      {/* Place Edit Modal */}
      {editingPlace && (
        <PlaceEditModal
          place={editingPlace}
          isOpen={true}
          onClose={() => setEditingPlace(null)}
          onSave={handlePlaceSave}
        />
      )}

      {/* Delete Place Confirm Modal */}
      {deletingPlace && (
        <DeleteConfirmModal
          placeName={deletingPlace.place.name}
          isOpen={true}
          onClose={() => setDeletingPlace(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Invite Modal */}
      <InviteModal
        tripId={id!}
        tripTitle={trip.title}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        trip={trip}
        places={allPlaces}
        expenses={expenses}
        expenseSummary={expenseSummary}
        printRef={contentRef}
      />

      {/* Comments Sidebar */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background shadow-lg z-40 animate-slide-in-right">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">討論</h2>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Comments tripId={id!} members={trip.members} />
            </div>
          </div>
        </div>
      )}

      {/* Comments backdrop */}
      {showComments && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setShowComments(false)}
        />
      )}
    </div>
  )
}