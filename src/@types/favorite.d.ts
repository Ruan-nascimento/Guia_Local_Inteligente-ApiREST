export type FavoriteInput = {
  userId: string;
  placeId: string;
  name: string;
  category: string;
  description: string | null;
  rating?: number | null;
  hours: string | null;
  latitude?: number | null;
  longitude?: number | null;
};