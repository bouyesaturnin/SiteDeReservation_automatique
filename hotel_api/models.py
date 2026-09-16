from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    ROOM_TYPES = (
        ('SINGLE', 'Simple'),
        ('DOUBLE', 'Double'),
        ('SUITE', 'Suite'),
    )
    name = models.CharField(max_length=100)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField()
    is_available = models.BooleanField(default=True)
    image_url = models.URLField(blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.room_type})"

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    check_in = models.DateField()
    check_out = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Réservation de {self.user.username} - {self.room.name}"


class RoomImage(models.Model):
    room = models.ForeignKey(Room, related_name='images', on_delete=models.CASCADE)
    url = models.URLField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Image {self.order} — {self.room.name}"


class Favorite(models.Model):
    user = models.ForeignKey(User, related_name='favorites', on_delete=models.CASCADE)
    room = models.ForeignKey(Room, related_name='favorited_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'room')

    def __str__(self):
        return f"{self.user.username} ♥ {self.room.name}"


class Review(models.Model):
    room = models.ForeignKey(Room, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()  # 1–5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} — {self.room.name} ({self.rating}★)"


class SiteSettings(models.Model):
    site_name = models.CharField(max_length=100, default='ProRDV')
    tagline = models.CharField(max_length=200, default='Votre hôtel de luxe au cœur de la ville')
    primary_color = models.CharField(max_length=7, default='#2563eb')
    hero_title = models.CharField(max_length=200, default='Trouvez votre chambre idéale')
    hero_subtitle = models.CharField(max_length=300, default='Réservez en quelques clics, profitez sans attendre.')
    footer_description = models.TextField(default="Un hôtel d'exception au cœur de la ville, alliant luxe moderne et hospitalité authentique pour un séjour inoubliable.")
    footer_address = models.CharField(max_length=200, default='12 Avenue des Hôtels, 75008 Paris, France')
    footer_phone = models.CharField(max_length=30, default='+33 1 23 45 67 89')
    footer_email = models.CharField(max_length=100, default='contact@prordv.fr')
    weekend_surcharge = models.IntegerField(default=20)
    peak_surcharge = models.IntegerField(default=30)
    peak_months = models.CharField(max_length=50, default='7,8')

    class Meta:
        verbose_name = 'Paramètres du site'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
