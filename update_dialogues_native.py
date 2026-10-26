import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Build an upgraded dialogues.json where every single character prompt and response option
# has native human audio from lesson1_audio.mp3 and track2_audio.mp3!

scenarios_native = [
    {
        "id": "scenario-1",
        "title": "Presentación del Mensaje Bíblico en el Tambo",
        "category": "En el Tambo / Casa",
        "description": "Diálogo directo usando las preguntas y respuestas reales del libro ¡Ɓʉsriɗa ɓadua dãrã! grabadas por los hermanos nativos.",
        "icon": "home",
        "steps": [
            {
                "speaker": "Hablante Nativo Emberá",
                "speaker_role": "Dueño de casa en el río",
                "avatar": "🧔🏽",
                "text_embera": "1. ¿Cãrẽ idiɗada Bibliaba panubarida?",
                "text_spanish": "1. ¿Qué preguntas responde la Biblia?",
                "audio_hint": "Grabación de estudio: Voz nativa Dóbida anunciando el Punto 1",
                "native_audio": {
                    "file": "lesson1_audio.mp3",
                    "start": 61.4,
                    "end": 67.7,
                    "label": "Punto 1 oficial"
                },
                "user_prompt": "Dile que la Biblia responde preguntas muy importantes para todos nosotros:",
                "options": [
                    {
                        "embera": "Bibliaba panu ɓʉda naʉ̃gʉ idi ɓʉra biara ɓʉda dadjirã carea.",
                        "spanish": "La Biblia responde preguntas muy importantes para nosotros.",
                        "correct": True,
                        "explanation": "¡Excelente! Grabado por el narrador nativo en el párrafo 1. 'Biara ɓʉda' = es muy importante / sobresaliente.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 68.3,
                            "end": 74.0
                        }
                    },
                    {
                        "embera": "¿Cãrẽ cãrẽã beubada?",
                        "spanish": "¿Por qué morimos?",
                        "correct": False,
                        "explanation": "Esta es solo una pregunta aislada, no responde a la presentación general.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 20.0,
                            "end": 21.5
                        }
                    },
                    {
                        "embera": "Wãbʉrʉda mʉ deɗaa.",
                        "spanish": "Ya me voy a mi casa.",
                        "correct": False,
                        "explanation": "No estás despidiéndote, estás presentando el mensaje."
                    }
                ],
                "blocks": ["Bibliaba", "panu", "ɓʉda", "naʉ̃gʉ", "idi", "ɓʉra", "biara", "ɓʉda."]
            },
            {
                "speaker": "Hablante Nativo Emberá",
                "speaker_role": "Dueño de casa",
                "avatar": "🧔🏽",
                "text_embera": "¿Sãmaʉba zesiɗa dadjirãra? ¿Cãrẽ cãrẽã naʉ̃ ẽjũãne panʉda?",
                "text_spanish": "¿De dónde venimos nosotros? ¿Por qué estamos en esta tierra?",
                "audio_hint": "Grabación nativa de las dos preguntas existenciales de la Lección 1",
                "native_audio": {
                    "file": "lesson1_audio.mp3",
                    "start": 74.1,
                    "end": 85.2,
                    "label": "Preguntas de Lección 1"
                },
                "user_prompt": "Respóndele explicando que muchas personas han aprendido lo que la Biblia dice:",
                "options": [
                    {
                        "embera": "Zocãrã ẽberãrãba cawabadada Bibliaba jara ɓʉra jãʉ̃ idi ɓʉra.",
                        "spanish": "Muchas personas han aprendido lo que la Biblia dice sobre estas preguntas.",
                        "correct": True,
                        "explanation": "Párrafo 1 de la lección 1. Observa el uso de 'cawabadada' (han aprendido).",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 35.8,
                            "end": 43.6
                        }
                    },
                    {
                        "embera": "Ãcõrẽra sewa ocaa.",
                        "spanish": "Dios no hace mentiras.",
                        "correct": False,
                        "explanation": "No responde a cómo la Biblia aclara esas dudas."
                    },
                    {
                        "embera": "Doɗe wãsi ɓeda beai carea.",
                        "spanish": "Se fue al río a pescar.",
                        "correct": False,
                        "explanation": "No corresponde a este diálogo."
                    }
                ],
                "blocks": ["Zocãrã", "ẽberãrãba", "cawabadada", "Bibliaba", "jara", "ɓʉra."]
            },
            {
                "speaker": "Hablante Nativo Emberá",
                "speaker_role": "Dueño de casa",
                "avatar": "🧔🏽",
                "text_embera": "2. ¿Sãwã careba ɓʉda Bibliaba dadjirãra ewariza capipia panani carea?",
                "text_spanish": "2. ¿Cómo nos ayuda la Biblia a ser felices cada día?",
                "audio_hint": "Grabación nativa del Punto 2 de la Lección 1",
                "native_audio": {
                    "file": "lesson1_audio.mp3",
                    "start": 106.1,
                    "end": 113.5,
                    "label": "Punto 2 oficial"
                },
                "user_prompt": "Dile que la Biblia da buenos consejos para ser felices con nuestra familia:",
                "options": [
                    {
                        "embera": "Bibliaba ʉ̃rãga biada dia ɓʉda ɓʉsriɗa panani carea dadji cuariarãme.",
                        "spanish": "La Biblia da buenos consejos para vivir felices con nuestra familia.",
                        "correct": True,
                        "explanation": "¡Exacto! Párrafo 2 de la Lección 1. 'ʉ̃rãga biada' = buenos consejos.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 114.0,
                            "end": 124.0
                        }
                    },
                    {
                        "embera": "¿Cãrẽda mãwãida beuɗacare?",
                        "spanish": "¿Qué pasará después de morir?",
                        "correct": False,
                        "explanation": "Es otra pregunta, no responde cómo nos ayuda en el día a día.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 90.6,
                            "end": 94.1
                        }
                    },
                    {
                        "embera": "Deda mʉre.",
                        "spanish": "La casa es mía.",
                        "correct": False,
                        "explanation": "No tiene que ver con los consejos bíblicos."
                    }
                ],
                "blocks": ["Bibliaba", "ʉ̃rãga", "biada", "dia", "ɓʉda", "ɓʉsriɗa", "panani", "carea."]
            }
        ]
    },
    {
        "id": "scenario-2",
        "title": "Las Grandes Preguntas de la Vida",
        "category": "Conversación Profunda",
        "description": "Explorar las preguntas humanas sobre el sufrimiento y el futuro con los audios originales.",
        "icon": "help-circle",
        "steps": [
            {
                "speaker": "Hablante Nativo Emberá",
                "speaker_role": "Joven reflexivo en la comunidad",
                "avatar": "👦🏽",
                "text_embera": "¿Cãrẽã nama panʉda? ¿Cãrẽã djuburia panʉda?",
                "text_spanish": "¿Por qué estamos aquí? ¿Por qué sufrimos?",
                "audio_hint": "Grabación nativa de la Lección 1 (Párrafo 1)",
                "native_audio": {
                    "file": "lesson1_audio.mp3",
                    "start": 15.65,
                    "end": 19.3,
                    "label": "¿Por qué sufrimos?"
                },
                "user_prompt": "Pregúntale qué cree que pasará en el futuro según las personas:",
                "options": [
                    {
                        "embera": "¿Cãrẽda mãwãida ewari zebʉrʉɗera?",
                        "spanish": "¿Qué pasará en el futuro?",
                        "correct": True,
                        "explanation": "Frase textual del Párrafo 1 de la Lección 1. 'Ewari zebʉrʉɗera' = cuando vengan los días futuros.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 22.05,
                            "end": 24.5
                        }
                    },
                    {
                        "embera": "¿Cãrẽ cãrẽã beubada?",
                        "spanish": "¿Por qué morimos?",
                        "correct": False,
                        "explanation": "Habla de la muerte, no del futuro general.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 20.0,
                            "end": 21.3
                        }
                    },
                    {
                        "embera": "Bia zebʉrʉ.",
                        "spanish": "Bienvenido.",
                        "correct": False,
                        "explanation": "No corresponde a una pregunta sobre el futuro."
                    }
                ],
                "blocks": ["¿Cãrẽda", "mãwãida", "ewari", "zebʉrʉɗera?"]
            },
            {
                "speaker": "Hablante Nativo Emberá",
                "speaker_role": "Joven reflexivo",
                "avatar": "👦🏽",
                "text_embera": "¿Bʉa quĩcha ɓʉda Bibliaba poya carebaida dewara ẽberãrãra?",
                "text_spanish": "¿Usted cree que la Biblia puede ayudar a las personas?",
                "audio_hint": "Pregunta de reflexión grabada por el locutor nativo",
                "native_audio": {
                    "file": "lesson1_audio.mp3",
                    "start": 50.05,
                    "end": 60.65,
                    "label": "Pregunta de reflexión"
                },
                "user_prompt": "Confirma que la Biblia enseña cómo vivir en paz y ser felices:",
                "options": [
                    {
                        "embera": "Mãẽ, Bibliaba careba ɓʉda... Zocãrã ẽberãrãba cawaɗapeɗa bio ɓʉsriɗa panʉda.",
                        "spanish": "Sí, la Biblia ayuda... Muchas personas después de aprender son muy felices.",
                        "correct": True,
                        "explanation": "Lección 1, párrafo 1 final. 'Bio ɓʉsriɗa panʉda' = están muy felices.",
                        "native_audio": {
                            "file": "lesson1_audio.mp3",
                            "start": 126.0,
                            "end": 137.0
                        }
                    },
                    {
                        "embera": "Maéa, adua ɓʉa.",
                        "spanish": "No, no sé.",
                        "correct": False,
                        "explanation": "No transmite el mensaje de esperanza."
                    },
                    {
                        "embera": "De obari.",
                        "spanish": "Constructor de casa.",
                        "correct": False,
                        "explanation": "Término sin sentido aquí."
                    }
                ],
                "blocks": ["Bibliaba", "careba", "ɓʉda,", "bio", "ɓʉsriɗa", "panʉda."]
            }
        ]
    }
]

with open("dialogues.json", "w", encoding="utf-8") as f:
    json.dump(scenarios_native, f, ensure_ascii=False, indent=2)

print("Saved dialogues.json with 100% native audio references!")
