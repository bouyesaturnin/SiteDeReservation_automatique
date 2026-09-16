from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, BookingViewSet, profile, CustomTokenObtainPairView, site_settings, stats, staff_bookings, favorites_list, favorite_toggle
from hotel_api import views
from hotel_api.voice_views import voice_incoming, voice_respond
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', views.signup, name='signup'),
    path('profile/', profile, name='profile'),
    path('settings/', site_settings, name='site_settings'),
    path('stats/', stats, name='stats'),
    path('favorites/', favorites_list, name='favorites_list'),
    path('favorites/<int:pk>/toggle/', favorite_toggle, name='favorite_toggle'),
    path('staff/bookings/', staff_bookings, name='staff_bookings'),
    path('staff/bookings/<int:pk>/', staff_bookings, name='staff_booking_detail'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')), # Pour l'authentification dans l'admin
    
    # C'est cette ligne qui gère le LOGIN
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Pour rafraîchir le token plus tard
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Agent vocal Twilio
    path('voice/', voice_incoming, name='voice_incoming'),
    path('voice/respond/', voice_respond, name='voice_respond'),
]