const FALLBACK_IMAGES = [
  'https://picsum.photos/seed/hotel-room-1/800/500',
  'https://picsum.photos/seed/hotel-room-2/800/500',
  'https://picsum.photos/seed/hotel-room-3/800/500',
  'https://picsum.photos/seed/hotel-room-4/800/500',
  'https://picsum.photos/seed/hotel-room-5/800/500',
  'https://picsum.photos/seed/hotel-room-6/800/500',
  'https://picsum.photos/seed/hotel-room-7/800/500',
  'https://picsum.photos/seed/hotel-room-8/800/500',
];

export const getRoomImage = (room) => {
  if (room.image_url) return room.image_url;
  if (room.images && room.images.length > 0) return room.images[0].url;
  return FALLBACK_IMAGES[room.id % FALLBACK_IMAGES.length];
};
