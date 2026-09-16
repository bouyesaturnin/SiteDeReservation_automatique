import anthropic
from hotel_api.models import Room, Booking, SiteSettings
from django.utils import timezone
from datetime import date

_conversations = {}

def get_hotel_context():
    settings = SiteSettings.get()
    rooms = Room.objects.filter(is_available=True)

    rooms_info = []
    for room in rooms:
        rooms_info.append(
            f"- {room.name} ({room.get_room_type_display()}): "
            f"{room.price_per_night}€/nuit, capacité {room.capacity} personne(s). {room.description}"
        )

    return f"""Tu es l'assistant vocal de l'hôtel {settings.site_name}.
Slogan : {settings.tagline}
Adresse : {settings.footer_address}
Téléphone : {settings.footer_phone}
Email : {settings.footer_email}

Chambres disponibles :
{chr(10).join(rooms_info) if rooms_info else "Aucune chambre disponible pour le moment."}

Informations tarifaires :
- Supplément week-end : +{settings.weekend_surcharge}%
- Supplément haute saison (mois {settings.peak_months}) : +{settings.peak_surcharge}%

Ton rôle :
- Répondre aux questions sur les chambres, tarifs et disponibilités
- Aider le client à choisir une chambre adaptée à ses besoins
- Informer sur les modalités de réservation (la réservation se fait sur le site web ou par email)
- Rester professionnel, chaleureux et concis (réponses courtes car c'est un appel vocal)
- Parler exclusivement en français
- Ne jamais inventer d'informations non fournies

Date du jour : {date.today().strftime('%d/%m/%Y')}"""


def get_ai_response(call_sid: str, user_message: str) -> str:
    if call_sid not in _conversations:
        _conversations[call_sid] = []

    history = _conversations[call_sid]
    history.append({"role": "user", "content": user_message})

    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=get_hotel_context(),
        messages=history,
    )

    assistant_message = response.content[0].text
    history.append({"role": "assistant", "content": assistant_message})

    # Limite l'historique à 20 messages pour éviter de dépasser les tokens
    if len(history) > 20:
        _conversations[call_sid] = history[-20:]

    return assistant_message


def end_conversation(call_sid: str):
    _conversations.pop(call_sid, None)
