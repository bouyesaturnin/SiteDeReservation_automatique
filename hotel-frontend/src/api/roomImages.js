const ROOM_IMAGES = [
  'https://imgs.search.brave.com/NsTk3yUepEm3FGya6OuoAIDzlfccy6zj7ck6971MwTQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdC5kZXBvc2l0cGhvdG9zLmNvbS90aHVtYnMvMzM4NjAzMy9pbWFnZS81MDQ0LzUwNDQ3NzExL2FwaV90aHVtYl80NTAuanBnP2ZvcmNlanBlZz10cnVl',
  'https://imgs.search.brave.com/LuUDLewcBLnZprYaHvbzc9EwvCb8emxUpUP-amfxa8I/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWM2LmRlcG9zaXRwaG90b3MuY29tL3RodW1icy8xMTEyNjA3L2ltYWdlLzYxMy82MTMzNDc5L2FwaV90aHVtYl80NTAuanBnP2ZvcmNlanBlZz10cnVl',
  'https://imgs.search.brave.com/ZPvAzZt6NHHDu9lJOJ_H-16sKBXFZSzVjUmUoVtSR_M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdDIuZGVwb3NpdHBob3Rvcy5jb20vdGh1bWJzLzQxNDI2MjEvaW1hZ2UvNzEzOS83MTM5MzkzNy9hcGlfdGh1bWJfNDUwLmpwZz9mb3JjZWpwZWc9dHJ1ZQ',
  'https://imgs.search.brave.com/nwdhSBH6gtJN3MdnWrSs77ficO4AIyVjGV39Fdy8D_I/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWM1LmRlcG9zaXRwaG90b3MuY29tL3RodW1icy8xMDAxNTQwL2ltYWdlLzUwNC81MDQ1NTA1L2FwaV90aHVtYl80NTAuanBnP2ZvcmNlanBlZz10cnVl',
  'https://imgs.search.brave.com/DZXKITT6lo3cbCv17jTQH3S0bVyPrL1Aj6Rzwcdakqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9mb3RvLmhyc3N0YXRpYy5jb20vZm90b3MvMC8yLzgwMC80NTgvODAvMDAwMDAwL2h0dHA6Ly9mb3RvLW9yaWdpbi5ocnNzdGF0aWMuY29tL2ZvdG8vZG1zLzQwOTg1OS9FQU4vMmEyNzUyZDRfei5qcGcvODA0NjAxMzU4NzhmZGU3MGY5YjhhMmJkODkwYjdiZGYvNTAwLDUwMC82L0xpYnJlX0hvdGVsLUxhX1Zlc3BpZXJlLVN0YW5kYXJkX3Jvb20tNy00MDk4NTkuanBn',
  'https://imgs.search.brave.com/Gdde6BEoQxSkgD6DHio1zJGBEPbhO1BL4r3V8ZbMgqA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdC5kZXBvc2l0cGhvdG9zLmNvbS90aHVtYnMvMzAwNDU0NS9pbWFnZS80MjE1LzQyMTUxNTgzL2FwaV90aHVtYl80NTAuanBnP2ZvcmNlanBlZz10cnVl',
  'https://imgs.search.brave.com/qlbcOYGBk6yK-aW-MlBiBfdifTwchLynWlHPn2vnDBk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWMudmVjdGVlenku Y29tL3RpL3Bob3Rvcy1ncmF0dWl0ZS90Mi82MjA0NzU5LXBpc2NpbmUtZXQtcGxhZ2UtZGUtbC1ob3RlbC1kZS1sdXhlLWV0LXBpc2NpbmVzLWV4dGVyaWV1cmVzLWV0LXVuLXNwYS1hbWFyYS1kb2xjZS12aXRhLWx1eHVyeS1ob3RlbC1yZXNvcnQtdGVraXJvdmEta2VtZXItdHVycXVpZS1waG90by5qcGc'.replace(/ /g, ''),
  'https://imgs.search.brave.com/O-JXq4BLV3VYt0ID8YcWnOfPrVnPpNrdXkjrbqSrq8A/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWMudmVjdGVlenku Y29tL3RpL3Bob3Rvcy1ncmF0dWl0ZS90Mi82MjAwNjk1LXBpc2NpbmUtZXQtcGxhZ2UtZHUtY29tcGxleGUtZGUtZGl2ZXJ0aXNzZW1lbnQtZGUtdHlwZS1ob3RlbC1kZS1sdXhlLWFtYXJhLWRvbGNlLXZpdGEtbHV4dXJ5LWhvdGVsLXJlc29ydC10ZWtpcm92YS1rZW1lci1waG90by5qcGc'.replace(/ /g, ''),
];

// Retourne une image du pool selon l'id de la chambre, ou l'image_url si définie
export const getRoomImage = (room) => {
  if (room.image_url) return room.image_url;
  return ROOM_IMAGES[room.id % ROOM_IMAGES.length];
};
