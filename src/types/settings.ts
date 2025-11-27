export type ProfileVisibility = 'public' | 'friends' | 'private'
export type DateFormat = 'YYYY/MM/DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'

export interface NotificationSettings {
  email: boolean
  push: boolean
  comments: boolean
  invitations: boolean
  tripUpdates: boolean
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility
  showEmail: boolean
  showTrips: boolean
}

export interface UserSettings {
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    comments: true,
    invitations: true,
    tripUpdates: true,
  },
  privacy: {
    profileVisibility: 'friends',
    showEmail: false,
    showTrips: true,
  },
}