export interface Notification {
  id: string;
  userId: string;
  type: 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'EVENT_INVITATION' | 'EVENT_CANCELLED' | 'EVENT_RECIPE_GENERATED';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

export interface NotificationCount {
  total: number;
  unread: number;
  byType: {
    friendRequests: number;
    eventInvitations: number;
    other: number;
  };
}
