import type { FavoriteInput } from "../@types/favorite.js";
import { prisma } from "../lib/prisma.js";



export async function createFavorite(data: FavoriteInput) {
  return prisma.favoritePlace.upsert({
    where: {
      userId_placeId: {
        userId: data.userId,
        placeId: data.placeId,
      },
    },
    update: {
      name: data.name,
      category: data.category,
      description: data.description,
      rating: data.rating,
      hours: data.hours,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    create: data,
  });
}

export async function getFavorites(userId: string) {
  return prisma.favoritePlace.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function deleteFavorite(userId: string, placeId: string) {
  return prisma.favoritePlace.delete({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
  });
}