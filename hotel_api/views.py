import os
import stripe
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Sum, Count, Avg as models_Avg
from django.db import models
from django.utils import timezone
from datetime import timedelta, date as date_type
from .models import Room, Booking, RoomImage, Review, Favorite
from .serializers import RoomSerializer, BookingSerializer, StaffBookingSerializer, CustomTokenObtainPairSerializer, RoomImageSerializer, ReviewSerializer


class IsStaffOrReadOnly(BasePermission):
    """Lecture publique, écriture réservée aux staff."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.prefetch_related('images', 'reviews').all()
    serializer_class = RoomSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        qs = Room.objects.prefetch_related('images', 'reviews').all()
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')
        if check_in and check_out:
            unavailable_ids = Booking.objects.filter(
                check_in__lt=check_out,
                check_out__gt=check_in,
            ).values_list('room_id', flat=True)
            qs = qs.exclude(id__in=unavailable_ids)
        return qs

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsStaffOrReadOnly])
    def images(self, request, pk=None):
        room = self.get_object()
        if request.method == 'GET':
            return Response(RoomImageSerializer(room.images.all(), many=True).data)
        # POST — ajouter une image (staff only)
        url = request.data.get('url', '').strip()
        order = request.data.get('order', room.images.count())
        if not url:
            return Response({'error': 'URL requise.'}, status=400)
        img = RoomImage.objects.create(room=room, url=url, order=order)
        return Response(RoomImageSerializer(img).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[IsStaffOrReadOnly],
            url_path='images/(?P<img_id>[^/.]+)')
    def delete_image(self, request, pk=None, img_id=None):
        try:
            img = RoomImage.objects.get(pk=img_id, room_id=pk)
            img.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RoomImage.DoesNotExist:
            return Response({'error': 'Image introuvable.'}, status=404)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def unavailable_dates(self, request, pk=None):
        bookings = Booking.objects.filter(room_id=pk).values('check_in', 'check_out')
        return Response(list(bookings))

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        room = self.get_object()

        if request.method == 'GET':
            qs = Review.objects.filter(room=room).select_related('user')
            avg = qs.aggregate(avg=models_Avg('rating'))['avg']
            today = timezone.now().date()
            user = request.user
            can_review = False
            user_review = None
            if user.is_authenticated:
                existing = Review.objects.filter(room=room, user=user).first()
                if existing:
                    user_review = ReviewSerializer(existing).data
                else:
                    can_review = Booking.objects.filter(
                        user=user, room=room, check_out__lte=today
                    ).exists()
            return Response({
                'reviews': ReviewSerializer(qs, many=True).data,
                'count': qs.count(),
                'average': round(avg, 1) if avg else None,
                'can_review': can_review,
                'user_review': user_review,
            })

        if not request.user.is_authenticated:
            return Response({'error': 'Connexion requise.'}, status=401)

        today = timezone.now().date()
        has_past_stay = Booking.objects.filter(
            user=request.user, room=room, check_out__lte=today
        ).exists()
        if not has_past_stay:
            return Response({'error': 'Vous devez avoir séjourné dans cette chambre pour laisser un avis.'}, status=403)

        if Review.objects.filter(room=room, user=request.user).exists():
            return Response({'error': 'Vous avez déjà laissé un avis pour cette chambre.'}, status=409)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '').strip()
        if not rating or not (1 <= int(rating) <= 5):
            return Response({'error': 'Note entre 1 et 5 requise.'}, status=400)

        review = Review.objects.create(room=room, user=request.user, rating=int(rating), comment=comment)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def dynamic_price(self, request, pk=None):
        from .models import SiteSettings
        room = self.get_object()
        check_in_str = request.query_params.get('check_in')
        check_out_str = request.query_params.get('check_out')

        if not check_in_str or not check_out_str:
            return Response({'error': 'check_in et check_out requis.'}, status=400)

        try:
            ci = date_type.fromisoformat(check_in_str)
            co = date_type.fromisoformat(check_out_str)
        except ValueError:
            return Response({'error': 'Format de date invalide.'}, status=400)

        if co <= ci:
            return Response({'error': 'check_out doit être après check_in.'}, status=400)

        settings_obj = SiteSettings.get()
        peak_months = [int(m.strip()) for m in settings_obj.peak_months.split(',') if m.strip().isdigit()]

        nights = []
        total = 0
        base_total = 0
        current = ci

        while current < co:
            base = float(room.price_per_night)
            surcharge = 0
            reasons = []

            if current.weekday() in [4, 5]:  # Vendredi, Samedi
                surcharge += settings_obj.weekend_surcharge
                reasons.append(f'Weekend +{settings_obj.weekend_surcharge}%')

            if current.month in peak_months:
                surcharge += settings_obj.peak_surcharge
                reasons.append(f'Haute saison +{settings_obj.peak_surcharge}%')

            final = round(base * (1 + surcharge / 100), 2)
            nights.append({
                'date': current.isoformat(),
                'base': base,
                'price': final,
                'surcharge': surcharge,
                'reasons': reasons,
            })
            total += final
            base_total += base
            current += timedelta(days=1)

        return Response({
            'nights': nights,
            'total': round(total, 2),
            'base_total': round(base_total, 2),
            'extra': round(total - base_total, 2),
        })


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        check_in = request.data.get('check_in')
        check_out = request.data.get('check_out')
        room_id = request.data.get('room')
        payment_intent_id = request.data.get('payment_intent_id')

        if not payment_intent_id:
            return Response({'error': 'Paiement requis.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status != 'succeeded':
                return Response({'error': 'Paiement non complété.'}, status=status.HTTP_402_PAYMENT_REQUIRED)
        except stripe.StripeError:
            return Response({'error': 'Impossible de vérifier le paiement.'}, status=status.HTTP_400_BAD_REQUEST)

        overlap = Booking.objects.filter(
            room_id=room_id,
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()

        if overlap:
            return Response(
                {'error': 'Cette chambre est déjà réservée pour les dates sélectionnées.'},
                status=status.HTTP_409_CONFLICT
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined,
        })

    # PATCH — mise à jour partielle
    data = request.data

    new_username = data.get('username', '').strip()
    new_email = data.get('email', '').strip()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if new_username and new_username != user.username:
        if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
            return Response({'error': "Ce nom d'utilisateur est déjà pris."}, status=400)
        user.username = new_username

    if new_email:
        user.email = new_email

    if new_password:
        if not current_password:
            return Response({'error': 'Mot de passe actuel requis pour en choisir un nouveau.'}, status=400)
        if not check_password(current_password, user.password):
            return Response({'error': 'Mot de passe actuel incorrect.'}, status=400)
        user.password = make_password(new_password)

    user.save()
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def site_settings(request):
    from .models import SiteSettings
    from .serializers import SiteSettingsSerializer
    settings_obj = SiteSettings.get()
    if request.method == 'GET':
        return Response(SiteSettingsSerializer(settings_obj).data)
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Accès refusé.'}, status=403)
    serializer = SiteSettingsSerializer(settings_obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé.'}, status=403)

    today = timezone.now().date()

    # Revenus et réservations des 6 derniers mois
    MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    monthly = []
    for i in range(5, -1, -1):
        first_day = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)

        qs = Booking.objects.filter(check_in__gte=first_day, check_in__lte=last_day)
        revenue = qs.aggregate(total=Sum('total_price'))['total'] or 0
        count = qs.count()
        monthly.append({
            'mois': MONTHS_FR[first_day.month - 1],
            'revenus': float(revenue),
            'reservations': count,
        })

    # Répartition par type de chambre
    by_type = []
    for rt, label in [('SINGLE', 'Simple'), ('DOUBLE', 'Double'), ('SUITE', 'Suite')]:
        count = Booking.objects.filter(room__room_type=rt).count()
        revenue = Booking.objects.filter(room__room_type=rt).aggregate(t=Sum('total_price'))['t'] or 0
        by_type.append({'type': label, 'reservations': count, 'revenus': float(revenue)})

    # Top 5 chambres par revenu
    top_rooms = (
        Booking.objects.values('room__name')
        .annotate(total=Sum('total_price'), nb=Count('id'))
        .order_by('-total')[:5]
    )

    # KPIs globaux
    total_revenue = Booking.objects.aggregate(t=Sum('total_price'))['t'] or 0
    total_bookings = Booking.objects.count()
    total_rooms = Room.objects.count()
    active_bookings = Booking.objects.filter(check_out__gte=today).count()

    # Taux d'occupation — 30 derniers jours
    period_start = today - timedelta(days=30)
    period_days = 30
    rooms = Room.objects.all()

    occupation_by_room = []
    total_booked_nights = 0

    for room in rooms:
        bookings = Booking.objects.filter(
            room=room,
            check_in__lt=today,
            check_out__gt=period_start,
        )
        booked_nights = 0
        for b in bookings:
            overlap_start = max(b.check_in, period_start)
            overlap_end = min(b.check_out, today)
            booked_nights += max(0, (overlap_end - overlap_start).days)

        rate = round((booked_nights / period_days) * 100)
        total_booked_nights += booked_nights
        occupation_by_room.append({
            'room': room.name,
            'room_type': room.room_type,
            'taux': rate,
            'nuits': booked_nights,
        })

    occupation_by_room.sort(key=lambda x: x['taux'], reverse=True)

    # Taux global = total nuits réservées / (nb chambres × 30 jours)
    global_rate = round((total_booked_nights / (total_rooms * period_days)) * 100) if total_rooms else 0

    # Taux d'occupation par mois (sur les 6 derniers mois)
    monthly_occupation = []
    for entry in monthly:
        idx = monthly.index(entry)
        first_day = (today.replace(day=1) - timedelta(days=(5 - idx) * 28)).replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)
        nb_days = (last_day - first_day).days + 1
        booked = 0
        for b in Booking.objects.filter(check_in__lte=last_day, check_out__gte=first_day):
            s = max(b.check_in, first_day)
            e = min(b.check_out, last_day)
            booked += max(0, (e - s).days)
        rate_m = round((booked / (total_rooms * nb_days)) * 100) if total_rooms else 0
        monthly_occupation.append({**entry, 'occupation': rate_m})

    return Response({
        'monthly': monthly_occupation,
        'by_type': by_type,
        'top_rooms': list(top_rooms),
        'kpis': {
            'total_revenue': float(total_revenue),
            'total_bookings': total_bookings,
            'total_rooms': total_rooms,
            'active_bookings': active_bookings,
            'occupation_rate': global_rate,
        },
        'occupation_by_room': occupation_by_room[:8],
    })


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def staff_bookings(request, pk=None):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé.'}, status=403)

    if request.method == 'DELETE':
        try:
            booking = Booking.objects.get(pk=pk)
            booking.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Booking.DoesNotExist:
            return Response({'error': 'Réservation introuvable.'}, status=404)

    # GET — liste filtrée
    qs = Booking.objects.select_related('user', 'room').order_by('-check_in')

    search = request.query_params.get('search', '').strip()
    status_filter = request.query_params.get('status', '')
    room_id = request.query_params.get('room_id', '')

    if search:
        qs = qs.filter(user__username__icontains=search) | qs.filter(room__name__icontains=search)

    if room_id:
        qs = qs.filter(room_id=room_id)

    today = timezone.now().date()
    if status_filter == 'upcoming':
        qs = qs.filter(check_in__gt=today)
    elif status_filter == 'active':
        qs = qs.filter(check_in__lte=today, check_out__gt=today)
    elif status_filter == 'past':
        qs = qs.filter(check_out__lte=today)

    serializer = StaffBookingSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def favorites_list(request):
    ids = Favorite.objects.filter(user=request.user).values_list('room_id', flat=True)
    return Response(list(ids))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def favorite_toggle(request, pk):
    try:
        room = Room.objects.get(pk=pk)
    except Room.DoesNotExist:
        return Response({'error': 'Chambre introuvable.'}, status=404)
    fav, created = Favorite.objects.get_or_create(user=request.user, room=room)
    if not created:
        fav.delete()
        return Response({'is_favorited': False})
    return Response({'is_favorited': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    amount = request.data.get('amount')
    if not amount:
        return Response({'error': 'Montant requis.'}, status=400)
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),
            currency='eur',
            metadata={'user_id': request.user.id},
        )
        return Response({'client_secret': intent.client_secret})
    except stripe.StripeError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data
    try:
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Cet utilisateur existe déjà'}, status=status.HTTP_400_BAD_REQUEST)

        User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password'])
        )
        return Response({'message': 'Utilisateur créé !'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
