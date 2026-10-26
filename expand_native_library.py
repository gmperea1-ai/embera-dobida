import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive map of native audio clips from the studio recordings
native_lexicon = {
    "ɓʉsriɗa": {
        "word": "Ɓʉsriɗa",
        "file": "track2_audio.mp3",
        "start": 1.7,
        "end": 2.7,
        "meaning": "Gozo / Felicidad duradera",
        "phonetic": "[ɓɨs.ɾi.ɗa] - Implosiva ɓ y ɗ",
        "speaker": "Locutor oficial Portada Disfrute"
    },
    "ɓadua": {
        "word": "ɓadua",
        "file": "track2_audio.mp3",
        "start": 2.7,
        "end": 3.4,
        "meaning": "Permanezca / Viva",
        "phonetic": "[ɓa.dua] - Implosiva ɓ",
        "speaker": "Locutor oficial Portada Disfrute"
    },
    "dãrã": {
        "word": "dãrã",
        "file": "track2_audio.mp3",
        "start": 3.4,
        "end": 4.1,
        "meaning": "Para siempre / Tiempo largo",
        "phonetic": "[dã.ɾã] - Doble vocal nasal ã",
        "speaker": "Locutor oficial Portada Disfrute"
    },
    "curso": {
        "word": "Curso",
        "file": "track2_audio.mp3",
        "start": 4.5,
        "end": 5.4,
        "meaning": "Curso / Estudio",
        "phonetic": "Préstamo adaptado al Emberá",
        "speaker": "Locutor oficial Sección 1"
    },
    "ãcõrẽ": {
        "word": "Ãcõrẽ",
        "file": "track2_audio.mp3",
        "start": 5.9,
        "end": 7.3,
        "meaning": "Dios",
        "phonetic": "[ã.kõ.ɾẽ] - Vocales nasales Ã y õ",
        "speaker": "Locutor oficial Sección 1"
    },
    "beɗea": {
        "word": "Beɗea",
        "file": "lesson1_audio.mp3",
        "start": 1.4,
        "end": 2.4,
        "meaning": "Palabra / Lección / Idioma",
        "phonetic": "[be.ɗe.a] - Implosiva alveolar ɗ",
        "speaker": "Locutor oficial Lección 1"
    },
    "bibliaba": {
        "word": "Bibliaba",
        "file": "lesson1_audio.mp3",
        "start": 5.2,
        "end": 6.8,
        "meaning": "La Biblia (sujeto activo)",
        "phonetic": "Raíz Biblia + sufijo ergativo -ba",
        "speaker": "Locutor oficial Lección 1"
    },
    "sãwã": {
        "word": "sãwã",
        "file": "lesson1_audio.mp3",
        "start": 6.8,
        "end": 7.8,
        "meaning": "¿Cómo?",
        "phonetic": "[sã.wã] - Doble nasal ã",
        "speaker": "Locutor oficial Lección 1"
    },
    "poya": {
        "word": "poya",
        "file": "lesson1_audio.mp3",
        "start": 7.8,
        "end": 8.5,
        "meaning": "Poder / Capaz",
        "phonetic": "Verbo auxiliar de posibilidad",
        "speaker": "Locutor oficial Lección 1"
    },
    "carebaida": {
        "word": "carebaida",
        "file": "lesson1_audio.mp3",
        "start": 8.5,
        "end": 10.2,
        "meaning": "Ayudar / Lo que ayuda",
        "phonetic": "Verbo carebai + sufijo subordinado -da",
        "speaker": "Locutor oficial Lección 1"
    },
    "bʉra": {
        "word": "bʉra",
        "file": "lesson1_audio.mp3",
        "start": 10.3,
        "end": 11.5,
        "meaning": "Lo que es / Aspecto",
        "phonetic": "bʉ + sufijo temático -ra",
        "speaker": "Locutor oficial Lección 1"
    },
    "zocãrã": {
        "word": "Zocãrã",
        "file": "lesson1_audio.mp3",
        "start": 12.8,
        "end": 13.8,
        "meaning": "Muchos / Bastantes",
        "phonetic": "[zo.kã.ɾã] - Nasal ã",
        "speaker": "Locutor oficial Lección 1"
    },
    "ẽberãrãba": {
        "word": "ẽberãrãba",
        "file": "lesson1_audio.mp3",
        "start": 13.8,
        "end": 15.1,
        "meaning": "Las personas (sujeto activo plural)",
        "phonetic": "ẽberã + rã (plural) + ba (ergativo)",
        "speaker": "Locutor oficial Lección 1"
    },
    "ẽberã": {
        "word": "ẽberã",
        "file": "lesson1_audio.mp3",
        "start": 13.8,
        "end": 14.6,
        "meaning": "Persona / Indígena Emberá",
        "phonetic": "[ẽ.be.ɾã] - Doble nasal ẽ y ã",
        "speaker": "Locutor oficial Lección 1"
    },
    "idibadada": {
        "word": "idibadada",
        "file": "lesson1_audio.mp3",
        "start": 14.6,
        "end": 15.6,
        "meaning": "Suelen preguntar / preguntan habitualmente",
        "phonetic": "Raíz idi (preguntar) + bada (habitual) + da",
        "speaker": "Locutor oficial Lección 1"
    },
    "idi": {
        "word": "idi",
        "file": "lesson1_audio.mp3",
        "start": 14.6,
        "end": 15.2,
        "meaning": "Preguntar / Pedir",
        "phonetic": "Verbo base de interrogación",
        "speaker": "Locutor oficial Lección 1"
    },
    "cãrẽã": {
        "word": "cãrẽã",
        "file": "lesson1_audio.mp3",
        "start": 15.6,
        "end": 16.2,
        "meaning": "¿Por qué?",
        "phonetic": "[kã.ɾẽ.ã] - Triple vocal nasalizada",
        "speaker": "Locutor oficial Lección 1"
    },
    "nama": {
        "word": "nama",
        "file": "lesson1_audio.mp3",
        "start": 16.2,
        "end": 16.7,
        "meaning": "Aquí / Acá",
        "phonetic": "Adverbio locativo",
        "speaker": "Locutor oficial Lección 1"
    },
    "panʉda": {
        "word": "panʉda",
        "file": "lesson1_audio.mp3",
        "start": 16.7,
        "end": 17.5,
        "meaning": "Estamos / están (plural)",
        "phonetic": "Vocal cerrada ʉ",
        "speaker": "Locutor oficial Lección 1"
    },
    "djuburia": {
        "word": "djuburia",
        "file": "lesson1_audio.mp3",
        "start": 17.7,
        "end": 18.7,
        "meaning": "Sufrimiento / dolor / compasión",
        "phonetic": "Africada suave dj + terminación ria",
        "speaker": "Locutor oficial Lección 1"
    },
    "beubada": {
        "word": "beubada",
        "file": "lesson1_audio.mp3",
        "start": 20.0,
        "end": 21.3,
        "meaning": "Mueren (habitual)",
        "phonetic": "Raíz beu (morir) + bada",
        "speaker": "Locutor oficial Lección 1"
    },
    "mãwãida": {
        "word": "mãwãida",
        "file": "lesson1_audio.mp3",
        "start": 22.0,
        "end": 23.0,
        "meaning": "Sucederá / pasará",
        "phonetic": "Verbo pasar/suceder con nasales",
        "speaker": "Locutor oficial Lección 1"
    },
    "ewari": {
        "word": "ewari",
        "file": "lesson1_audio.mp3",
        "start": 23.0,
        "end": 23.6,
        "meaning": "Día / Tiempo",
        "phonetic": "Sustantivo temporal básico",
        "speaker": "Locutor oficial Lección 1"
    },
    "zebʉrʉɗera": {
        "word": "zebʉrʉɗera",
        "file": "lesson1_audio.mp3",
        "start": 23.6,
        "end": 24.8,
        "meaning": "Cuando venga / en el futuro",
        "phonetic": "zei (venir) + bʉrʉ (progresivo) + ɗe (tiempo)",
        "speaker": "Locutor oficial Lección 1"
    },
    "idjaɓa": {
        "word": "idjaɓa",
        "file": "lesson1_audio.mp3",
        "start": 26.1,
        "end": 26.8,
        "meaning": "Y / Además / También",
        "phonetic": "Conector con implosiva ɓ",
        "speaker": "Locutor oficial Lección 1"
    },
    "cuariarã": {
        "word": "cuariarã",
        "file": "lesson1_audio.mp3",
        "start": 32.3,
        "end": 34.3,
        "meaning": "Familia / Miembros del hogar",
        "phonetic": "Cuaria (familia) + rã (plural)",
        "speaker": "Locutor oficial Lección 1"
    },
    "cawabadada": {
        "word": "cawabadada",
        "file": "lesson1_audio.mp3",
        "start": 37.4,
        "end": 39.6,
        "meaning": "Han aprendido / conocen",
        "phonetic": "cawai (aprender) + bada (habitual) + da",
        "speaker": "Locutor oficial Lección 1"
    },
    "ʉ̃rãga": {
        "word": "ʉ̃rãga",
        "file": "lesson1_audio.mp3",
        "start": 45.4,
        "end": 46.5,
        "meaning": "Consejo / Instrucción",
        "phonetic": "ʉ̃ nasal inicial",
        "speaker": "Locutor oficial Lección 1"
    },
    "bia": {
        "word": "bia",
        "file": "lesson1_audio.mp3",
        "start": 46.6,
        "end": 47.1,
        "meaning": "Bueno / Bien",
        "phonetic": "Término positivo universal",
        "speaker": "Locutor oficial Lección 1"
    },
    "dia": {
        "word": "dia",
        "file": "lesson1_audio.mp3",
        "start": 47.2,
        "end": 48.0,
        "meaning": "Dar / Da",
        "phonetic": "Verbo dar (diai)",
        "speaker": "Locutor oficial Lección 1"
    },
    "dadjirãra": {
        "word": "dadjirãra",
        "file": "lesson1_audio.mp3",
        "start": 76.3,
        "end": 78.1,
        "meaning": "Nosotros todos",
        "phonetic": "Pronombre inclusivo total",
        "speaker": "Locutor oficial Lección 1"
    },
    "ẽjũãne": {
        "word": "ẽjũãne",
        "file": "lesson1_audio.mp3",
        "start": 81.6,
        "end": 83.2,
        "meaning": "En la tierra / En el mundo",
        "phonetic": "ẽjũã (tierra) + ne (en)",
        "speaker": "Locutor oficial Lección 1"
    },
    "beuɗacare": {
        "word": "beuɗacare",
        "file": "lesson1_audio.mp3",
        "start": 92.6,
        "end": 94.1,
        "meaning": "Después de morir",
        "phonetic": "beu (morir) + ɗacare (después de)",
        "speaker": "Locutor oficial Lección 1"
    },
    "capipia": {
        "word": "capipia",
        "file": "lesson1_audio.mp3",
        "start": 111.0,
        "end": 112.5,
        "meaning": "Contento / Alegre",
        "phonetic": "Adjetivo de alegría",
        "speaker": "Locutor oficial Lección 1"
    }
}

with open("native_lexicon.json", "w", encoding="utf-8") as f:
    json.dump(native_lexicon, f, ensure_ascii=False, indent=2)

print(f"Generated native_lexicon.json with {len(native_lexicon)} studio-recorded Emberá words!")
