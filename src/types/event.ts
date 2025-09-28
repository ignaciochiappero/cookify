import { MealType } from './meal-calendar';

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  mealType: MealType;
  location?: string;
  maxParticipants?: number;
  isActive: boolean;
  creatorId: string;
  recipeId?: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  participants?: EventParticipant[];
  recipe?: {
    id: string;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    cookingTime?: number;
    difficulty?: string;
    servings?: number;
    healthConditions?: string[];
    customHealthConditions?: string[];
  };
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: 'INVITED' | 'ACCEPTED' | 'DECLINED';
  joinedAt?: Date;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface CreateEventData {
  title: string;
  description?: string;
  date: Date;
  mealType: MealType;
  location?: string;
  maxParticipants?: number;
  participantIds: string[];
}

export interface EventWithCombinedData {
  event: Event;
  combinedIngredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    contributedBy: string[];
  }>;
  combinedHealthConditions: string[];
  combinedPersonalGoals: string[];
  totalServings: number;
}
