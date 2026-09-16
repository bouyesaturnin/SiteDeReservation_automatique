from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from twilio.twiml.voice_response import VoiceResponse, Gather
from hotel_api.voice_agent import get_ai_response, end_conversation

VOICE = "Polly.Lea"  # Voix française AWS Polly via Twilio
LANGUAGE = "fr-FR"


def _twiml_response(twiml: VoiceResponse) -> HttpResponse:
    return HttpResponse(str(twiml), content_type="application/xml")


@csrf_exempt
@require_POST
def voice_incoming(request):
    """Premier webhook appelé quand un client appelle le numéro Twilio."""
    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/api/voice/respond/",
        method="POST",
        language=LANGUAGE,
        speech_timeout="auto",
        speech_model="phone_call",
    )
    gather.say(
        "Bonjour, bienvenue à l'hôtel. Je suis votre assistant virtuel. "
        "Comment puis-je vous aider aujourd'hui ?",
        voice=VOICE,
        language=LANGUAGE,
    )
    response.append(gather)

    # Si le client ne dit rien
    response.say(
        "Je n'ai pas entendu votre réponse. Au revoir et bonne journée.",
        voice=VOICE,
        language=LANGUAGE,
    )
    return _twiml_response(response)


@csrf_exempt
@require_POST
def voice_respond(request):
    """Webhook appelé à chaque fois que le client parle."""
    call_sid = request.POST.get("CallSid", "unknown")
    speech_result = request.POST.get("SpeechResult", "").strip()
    call_status = request.POST.get("CallStatus", "")

    if call_status in ("completed", "busy", "failed", "no-answer", "canceled"):
        end_conversation(call_sid)
        return HttpResponse("", status=204)

    response = VoiceResponse()

    if not speech_result:
        gather = Gather(
            input="speech",
            action="/api/voice/respond/",
            method="POST",
            language=LANGUAGE,
            speech_timeout="auto",
            speech_model="phone_call",
        )
        gather.say(
            "Je n'ai pas bien saisi. Pouvez-vous répéter s'il vous plaît ?",
            voice=VOICE,
            language=LANGUAGE,
        )
        response.append(gather)
        return _twiml_response(response)

    # Détection raccroché / au revoir
    farewell_keywords = ["au revoir", "merci au revoir", "bonne journée", "à bientôt", "raccrocher"]
    if any(kw in speech_result.lower() for kw in farewell_keywords):
        end_conversation(call_sid)
        response.say(
            "Merci pour votre appel. Au revoir et bonne journée !",
            voice=VOICE,
            language=LANGUAGE,
        )
        response.hangup()
        return _twiml_response(response)

    ai_reply = get_ai_response(call_sid, speech_result)

    gather = Gather(
        input="speech",
        action="/api/voice/respond/",
        method="POST",
        language=LANGUAGE,
        speech_timeout="auto",
        speech_model="phone_call",
    )
    gather.say(ai_reply, voice=VOICE, language=LANGUAGE)
    response.append(gather)

    # Si le client ne répond plus après la réponse de l'agent
    response.say(
        "Je ne vous entends plus. N'hésitez pas à rappeler. Au revoir !",
        voice=VOICE,
        language=LANGUAGE,
    )
    return _twiml_response(response)
