import pypdf
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'C:\Users\GEILER M\Downloads\LIBRO EMBERA DOBIDA mayo 16 de 2020.pdf'
reader = pypdf.PdfReader(pdf_path)

# Curated scenarios from the manual
scenarios = [
    {
        "id": "scenario-1",
        "title": "Saludo inicial y permiso para hablar",
        "category": "En el Tambo / Casa",
        "description": "Llegas a la casa de una familia y pides permiso para conversar.",
        "icon": "home",
        "steps": [
            {
                "speaker": "Hablante Emberá",
                "speaker_role": "Dueño de casa en el río",
                "avatar": "🧔🏽",
                "text_embera": "Mẽrã. ¿Cãrẽ idi quĩrĩã ɓʉ?",
                "text_spanish": "Hola. ¿Qué desea preguntar?",
                "audio_hint": "Mẽrã (Hola) - nasal en la e y a",
                "user_prompt": "¿Cómo te presentas como Testigo de Jehová y pides permiso para hablar?",
                "options": [
                    {
                        "embera": "Mʉra Testigo de Jehová, ¿poya beɗeaɗi?",
                        "spanish": "Yo soy Testigo de Jehová, ¿podemos hablar?",
                        "correct": True,
                        "explanation": "Usa 'Mʉra' porque es con ser/estar (-ra), y 'poya beɗeaɗi' (poder hablar en plural)."
                    },
                    {
                        "embera": "Mʉba Testigo de Jehová, ¿poya beɗeaɗi?",
                        "spanish": "Yo Testigo de Jehová...",
                        "correct": False,
                        "explanation": "Incorrecto: '-ba' se usa solo cuando se hace una acción transitiva. Para decir 'yo soy', se usa '-ra' (Mʉra)."
                    },
                    {
                        "embera": "Mʉ trʉda Pedro, wãbʉrʉda.",
                        "spanish": "Mi nombre es Pedro, ya me voy.",
                        "correct": False,
                        "explanation": "'Wãbʉrʉda' significa 'chao / ya me voy'. No coincide con pedir permiso para hablar."
                    }
                ],
                "blocks": ["Mʉra", "Testigo", "de", "Jehová,", "¿poya", "beɗeaɗi?"]
            },
            {
                "speaker": "Hablante Emberá",
                "speaker_role": "Dueño de casa",
                "avatar": "🧔🏽",
                "text_embera": "Mãẽ, jãwã ɓʉbʉrʉ, ¿cãrẽdebema beɗeada?",
                "text_spanish": "Sí, siendo así, ¿de qué trata?",
                "audio_hint": "Mãẽ (Sí afirmativo)",
                "user_prompt": "Dile que estás aprendiendo Emberá y estás enseñando acerca de Dios.",
                "options": [
                    {
                        "embera": "Mʉa cawa ɓʉ Ẽberã beɗea, jaradia panʉ Ãcõrẽne.",
                        "spanish": "Estoy aprendiendo idioma Emberá, estamos enseñando de Dios.",
                        "correct": True,
                        "explanation": "¡Exacto! Pág. 60 del libro. 'Mʉa cawa ɓʉ' (Yo estoy aprendiendo), 'Ãcõrẽne' (acerca de Dios)."
                    },
                    {
                        "embera": "Mʉ beɗeacaa, maéa.",
                        "spanish": "Yo no hablo, no.",
                        "correct": False,
                        "explanation": "Esto dice que no hablas."
                    },
                    {
                        "embera": "Ãcõrẽra sewa ocaa.",
                        "spanish": "Dios no dice mentiras.",
                        "correct": False,
                        "explanation": "Aunque es bíblico, no responde a la pregunta de qué viniste a hacer."
                    }
                ],
                "blocks": ["Mʉa", "cawa", "ɓʉ", "Ẽberã", "beɗea,", "jaradia", "panʉ", "Ãcõrẽne."]
            },
            {
                "speaker": "Hablante Emberá",
                "speaker_role": "Dueño de casa",
                "avatar": "🧔🏽",
                "text_embera": "Bia ɓʉa. ¿Cãrẽ idiɗada Bibliaba panubarida?",
                "text_spanish": "Está bien. ¿Qué preguntas responde la Biblia?",
                "audio_hint": "Idiɗada = preguntas / lo que se pregunta",
                "user_prompt": "Pregúntale si a él o a ella le gustaría aprender lo que Dios enseña.",
                "options": [
                    {
                        "embera": "¿Bʉa cawa quĩrĩã ɓʉca?",
                        "spanish": "¿Usted quiere aprender?",
                        "correct": True,
                        "explanation": "La partícula interrogativa '-ca' al final de 'quĩrĩã ɓʉca' convierte la frase en pregunta de Sí/No (Pág. 13)."
                    },
                    {
                        "embera": "¿Bʉra sãma ɓabari?",
                        "spanish": "¿Usted dónde vive?",
                        "correct": False,
                        "explanation": "Esta frase significa '¿Dónde vive usted?', no '¿Quiere aprender?'."
                    },
                    {
                        "embera": "Mãwãnacarea wãya zei.",
                        "spanish": "Luego vendré.",
                        "correct": False,
                        "explanation": "No es una pregunta."
                    }
                ],
                "blocks": ["¿Bʉa", "cawa", "quĩrĩã", "ɓʉca?"]
            }
        ]
    },
    {
        "id": "scenario-2",
        "title": "Preguntar por familiares ausentes",
        "category": "Situaciones Cotidianas",
        "description": "El joven o niño sale y te dice que su mamá no está en la casa.",
        "icon": "users",
        "steps": [
            {
                "speaker": "Joven Emberá",
                "speaker_role": "Hijo del dueño de casa",
                "avatar": "👦🏽",
                "text_embera": "Mẽrã. Mʉ nana nama ɓʉée.",
                "text_spanish": "Hola. Mi mamá no está acá.",
                "audio_hint": "Nana = Mamá, nama = acá, ɓʉée = no está",
                "user_prompt": "Pregúntale: '¿Para dónde se fue?'",
                "options": [
                    {
                        "embera": "¿Sãma wãsi?",
                        "spanish": "¿Para dónde se fue?",
                        "correct": True,
                        "explanation": "Pág. 29 del manual. 'Sãma' (¿Dónde/Para dónde?) + 'wãsi' (se fue, pasado de wãi)."
                    },
                    {
                        "embera": "¿Cãrẽ hora zei?",
                        "spanish": "¿A qué hora viene?",
                        "correct": False,
                        "explanation": "Esta pregunta es para saber a qué hora viene, primero queremos saber a dónde fue."
                    },
                    {
                        "embera": "¿Bʉ nana sãma ɓʉ?",
                        "spanish": "¿Dónde está tu mamá?",
                        "correct": False,
                        "explanation": "Ya te dijo que no está acá, por lo que preguntas a dónde fue."
                    }
                ],
                "blocks": ["¿Sãma", "wãsi?"]
            },
            {
                "speaker": "Joven Emberá",
                "speaker_role": "Hijo del dueño de casa",
                "avatar": "👦🏽",
                "text_embera": "Doɗe wãsi ɓeda beai carea.",
                "text_spanish": "Se fue al río para pescar.",
                "audio_hint": "Do = río, doɗe = en el río, ɓeda beai = pescar",
                "user_prompt": "Pregúntale: '¿A qué hora vuelve / viene?'",
                "options": [
                    {
                        "embera": "¿Cãrẽ hora wãya zei?",
                        "spanish": "¿A qué hora viene otra vez?",
                        "correct": True,
                        "explanation": "Pág. 29. 'Cãrẽ hora' (qué hora) + 'wãya' (otra vez / de vuelta) + 'zei' (venir)."
                    },
                    {
                        "embera": "¿Cãrẽ cãrẽã beubada?",
                        "spanish": "¿Por qué se mueren?",
                        "correct": False,
                        "explanation": "No tiene sentido en este contexto."
                    },
                    {
                        "embera": "¿Bʉa neconũmʉ?",
                        "spanish": "¿Estás comiendo?",
                        "correct": False,
                        "explanation": "No pregunta la hora de regreso."
                    }
                ],
                "blocks": ["¿Cãrẽ", "hora", "wãya", "zei?"]
            },
            {
                "speaker": "Joven Emberá",
                "speaker_role": "Hijo del dueño de casa",
                "avatar": "👦🏽",
                "text_embera": "Quebara, ʉmãdau pʉrrʉabari.",
                "text_spanish": "En la tarde, cuando caiga el sol.",
                "audio_hint": "Quebara = por la tarde",
                "user_prompt": "Dile amablemente: '¿Puedo volver la otra semana?'",
                "options": [
                    {
                        "embera": "¿Mʉa poya wãya zeida dewarau domia?",
                        "spanish": "¿Puedo volver a venir la otra semana?",
                        "correct": True,
                        "explanation": "Pág. 29. 'dewarau domia' = otra semana (domia = semana)."
                    },
                    {
                        "embera": "Wãdua mʉ druaɗaa.",
                        "spanish": "Vete a mi país.",
                        "correct": False,
                        "explanation": "No es una cita de revisita."
                    },
                    {
                        "embera": "Bia buada.",
                        "spanish": "Muchas gracias.",
                        "correct": False,
                        "explanation": "Solo dice gracias, pero no agenda el regreso."
                    }
                ],
                "blocks": ["¿Mʉa", "poya", "wãya", "zeida", "dewarau", "domia?"]
            }
        ]
    },
    {
        "id": "scenario-3",
        "title": "Presentar el libro '¡Ɓʉsriɗa ɓadua dãrã!'",
        "category": "Enseñanza Bíblica",
        "description": "Muestras el curso interactivo y explicas por qué es de tanto provecho.",
        "icon": "book-open",
        "steps": [
            {
                "speaker": "Hablante Emberá",
                "speaker_role": "Interesado",
                "avatar": "👩🏽",
                "text_embera": "¿Cãrẽ carta jaugu? ¿Cãrẽã bio biara ɓʉda?",
                "text_spanish": "¿Qué libro es ese? ¿Por qué es tan bueno?",
                "audio_hint": "Carta = Libro / folleto / carta",
                "user_prompt": "Explícale: 'Este libro es muy importante. Proviene de Dios.'",
                "options": [
                    {
                        "embera": "Naʉgʉ carta bio biara ɓʉ, Ãcõrẽnebema bẽrã.",
                        "spanish": "Este libro es muy bueno, porque proviene de Dios.",
                        "correct": True,
                        "explanation": "Pág. 85 del manual. 'Naʉgʉ carta' (este libro), 'bẽrã' (conector porque)."
                    },
                    {
                        "embera": "Naʉgʉ librora Biblia quĩrãca ɓʉẽ́da.",
                        "spanish": "Este libro no es como la Biblia.",
                        "correct": False,
                        "explanation": "Aunque es una nota del libro, no resalta el mensaje de que proviene de Dios."
                    },
                    {
                        "embera": "Animarã mẽãbema.",
                        "spanish": "Animales del monte.",
                        "correct": False,
                        "explanation": "Vocabulario inconexo."
                    }
                ],
                "blocks": ["Naʉgʉ", "carta", "bio", "biara", "ɓʉ,", "Ãcõrẽnebema", "bẽrã."]
            },
            {
                "speaker": "Hablante Emberá",
                "speaker_role": "Interesado",
                "avatar": "👩🏽",
                "text_embera": "¿Sãwã carebaya naʉ̃ cartaba?",
                "text_spanish": "¿Cómo ayudará este libro?",
                "audio_hint": "Carebaya = ayudará (futuro simple)",
                "user_prompt": "Dile: 'Estos consejos nos ayudan para vivir mejor y ser felices.'",
                "options": [
                    {
                        "embera": "Naʉgʉ beɗeara carebaida bia panani carea idjaɓa ɓʉsriɗa panani carea.",
                        "spanish": "Estos consejos ayudan para vivir bien y vivir felices.",
                        "correct": True,
                        "explanation": "Pág. 85 y Lección 1. 'ɓʉsriɗa' = alegría / gozo / felicidad duradera."
                    },
                    {
                        "embera": "De obari.",
                        "spanish": "Constructor de casa.",
                        "correct": False,
                        "explanation": "No corresponde."
                    },
                    {
                        "embera": "Jira ɓʉi.",
                        "spanish": "Colgar.",
                        "correct": False,
                        "explanation": "No corresponde."
                    }
                ],
                "blocks": ["Naʉgʉ", "beɗeara", "carebaida", "bia", "panani", "carea."]
            }
        ]
    }
]

# Grammar rules extracted from the book
grammar_rules = [
    {
        "name": "Sufijo Ergativo (-ba / -ba)",
        "rule": "Si el verbo es transitivo (la acción recae sobre un objeto o persona diferente), el sujeto lleva el sufijo -ba.",
        "examples": [
            {"embera": "Ãcõrẽba diabuesi idji warra", "spanish": "Dios envió a su hijo (verbo transitivo -> Ãcõrẽba)"},
            {"embera": "Bibliaba careba ɓʉda", "spanish": "La Biblia ayuda (verbo transitivo -> Bibliaba)"},
            {"embera": "Mʉa cawa ɓʉ Ẽberã beɗea", "spanish": "Yo estoy aprendiendo emberá (Mʉ + a -> Mʉa)"}
        ]
    },
    {
        "name": "Sufijo de Estado / Ser / Intransitivo (-ra)",
        "rule": "Si la oración usa verbos intransitivos o verbos de ser/estar (identidad, descripción), el sujeto lleva el sufijo -ra.",
        "examples": [
            {"embera": "Mʉra Testigo de Jehová", "spanish": "Yo soy Testigo de Jehová"},
            {"embera": "Jesura so bia basía", "spanish": "Jesús fue un hombre bueno"},
            {"embera": "Naʉgʉ carta bio biara ɓʉ", "spanish": "Este libro es muy bueno"}
        ]
    },
    {
        "name": "Preguntas de Sí o No (-ca)",
        "rule": "Para formular una pregunta de respuesta 'Sí o No', se añade la partícula -ca al final del verbo o frase.",
        "examples": [
            {"embera": "¿Bʉa cawa quĩrĩã ɓʉca?", "spanish": "¿Usted quiere aprender?"},
            {"embera": "¿Cawasica?", "spanish": "¿Entendió?"},
            {"embera": "¿Domia naẽna beɗeasiɗaa quĩrãneba ɓʉca?", "spanish": "¿Recuerda lo que hablamos la semana pasada?"}
        ]
    },
    {
        "name": "Regla Fonética de la 'Y' Nasalizada",
        "rule": "Si antes o después de la 'Y' hay una vocal nasal (ã, ẽ, ĩ, õ, ũ, ʉ̃), la 'Y' suena como 'Ñ'.",
        "examples": [
            {"embera": "Wãya", "spanish": "Otra vez / De nuevo (se pronuncia 'Waña')"},
            {"embera": "Cãyãbara", "spanish": "Más que / Comparativo (se pronuncia 'Cañabara')"},
            {"embera": "Waya", "spanish": "Respeto (como no tiene nasales, suena 'Waya' normal)"}
        ]
    },
    {
        "name": "Consonantes Implosivas (ɓ y ɗ)",
        "rule": "La 'ɓ' y la 'ɗ' son implosivas sonoras: se producen cerrando los labios o la lengua e inhalando un pulso de aire hacia adentro, a diferencia de la 'b' y 'd' del español.",
        "examples": [
            {"embera": "Ɓʉsriɗa", "spanish": "Felicidad / Gozo"},
            {"embera": "Beɗea", "spanish": "Palabra / Idioma"},
            {"embera": "Dauɓara (Lágrima) vs Daubara (Hechicero)", "spanish": "Par mínimo crítico"}
        ]
    }
]

with open("dialogues.json", "w", encoding="utf-8") as f:
    json.dump(scenarios, f, ensure_ascii=False, indent=2)

with open("grammar_rules.json", "w", encoding="utf-8") as f:
    json.dump(grammar_rules, f, ensure_ascii=False, indent=2)

print("Saved dialogues.json and grammar_rules.json!")
