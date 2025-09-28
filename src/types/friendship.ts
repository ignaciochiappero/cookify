export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
  user1?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  user2?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface UserWithPreferences {
  id: string;
  name: string;
  email: string;
  image?: string;
  userPreferences?: {
    healthConditions: string[];
    customHealthConditions: string[];
    personalGoals: string[];
    customPersonalGoals: string[];
    cookingSkill: string;
    cookingTime: string;
    servings: number;
    country?: string;
    locationEnabled: boolean;
  };
  isFriend?: boolean;
  friendRequestStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'NONE';
}
