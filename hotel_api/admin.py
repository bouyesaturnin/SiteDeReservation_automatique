from django.contrib import admin
from .models import Room, Booking, RoomImage, Review

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_type', 'price_per_night', 'capacity', 'is_available')
    list_filter = ('room_type', 'is_available')
    search_fields = ('name',)
    inlines = [RoomImageInline]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'check_in', 'check_out', 'total_price', 'created_at')
    list_filter = ('check_in', 'check_out')
    search_fields = ('user__username', 'room__name')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'rating', 'created_at')
    list_filter = ('rating', 'room')
    search_fields = ('user__username', 'room__name', 'comment')