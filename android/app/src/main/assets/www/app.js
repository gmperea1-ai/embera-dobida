// Safe Lucide guard for offline environments
if (typeof window.lucide === 'undefined') {
  window.lucide = {
    createIcons: function() {
      // Fallback: replace data-lucide elements with simple symbols or text if icons are missing
      document.querySelectorAll('[data-lucide]').forEach(function(el) {
        if (!el.textContent.trim()) {
          var name = el.getAttribute('data-lucide') || '';
          if (name.includes('volume') || name.includes('audio')) el.textContent = '🔊';
          else if (name.includes('mic')) el.textContent = '🎙️';
          else if (name.includes('book')) el.textContent = '📖';
          else if (name.includes('sparkle')) el.textContent = '✨';
          else if (name.includes('check')) el.textContent = '✓';
          else if (name.includes('x')) el.textContent = '✕';
          else if (name.includes('compass') || name.includes('map')) el.textContent = '🧭';
          else if (name.includes('search')) el.textContent = '🔍';
        }
      });
    }
  };
}

// app.js - Dóbida Aprende Engine: Bilingual Karaoke, Grammar & Verb Conjugator, Native Audio & AI Inspector

class NativeAudioManager {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.currentSource = null;
    this.clipTimeout = null;
    this.audioPool = {};
    this.init();
  }

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API unavailable", e);
    }
  }

  async preload(file) {
    if (this.buffers[file] || !this.ctx) return;
    try {
      const resp = await fetch(file);
      const ab = await resp.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(ab);
      this.buffers[file] = decoded;
      console.log(`Preloaded ${file} into memory (${decoded.duration.toFixed(1)}s)`);
    } catch (e) {
      console.warn("Preload buffer failed for", file, e);
    }
  }

  async play(file, start, end, speed = 1.0) {
    this.stop();

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      const buffer = this.buffers[file];
      if (buffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.connect(this.ctx.destination);
        const duration = (end - start) / speed;
        source.start(0, start, duration);
        this.currentSource = source;
        return;
      } else {
        this.preload(file);
      }
    }

    let audio = this.audioPool[file];
    if (!audio) {
      audio = new Audio(file);
      audio.preload = 'auto';
      this.audioPool[file] = audio;
    }

    audio.playbackRate = speed;

    const executePlay = () => {
      try {
        audio.currentTime = start;
        audio.play().catch(e => console.log("Audio play error", e));
        const durationMs = ((end - start) / speed) * 1000;
        this.clipTimeout = setTimeout(() => {
          audio.pause();
        }, durationMs);
      } catch (err) {
        console.warn("Audio seek error", err);
      }
    };

    if (audio.readyState >= 2) {
      executePlay();
    } else {
      audio.addEventListener('canplay', executePlay, { once: true });
      audio.load();
    }
  }

  stop() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (e) {}
      this.currentSource = null;
    }
    if (this.clipTimeout) {
      clearTimeout(this.clipTimeout);
      this.clipTimeout = null;
    }
    Object.values(this.audioPool).forEach(a => {
      try { a.pause(); } catch (e) {}
    });
  }
}

const audioMgr = new NativeAudioManager();

let state = {
  activeTab: 'study', // 'study', 'grammar', 'dialogue', 'phonetics', 'dictionary'
  gems: 50,
  streak: 4,
  scenarios: [],
  currentScenario: null,
  currentStepIndex: 0,
  scaffoldLevel: 1,
  selectedBlocks: [],
  lesson: null,
  karaokeData: [],
  activeKaraokeId: 'k1',
  currentKaraokeIndex: 0,
  studyMode: 'step_by_step', // 'step_by_step' (pausa tras cada frase) o 'continuous'
  autoPauseAt: null,
  isSentencePaused: false,
  audioElement: null,
  isPlaying: false,
  dictionary: [],
  filteredDict: [],
  dictSearchTerm: '',
  dictFilterNativeOnly: false,
  grammarData: null,
  nativeLexicon: {},

  showGhostPrompter: false,
  dictViewMode: 'list', // 'list' o 'vault_srs'
  srsCardFlipped: false,
  srsCardIndex: 0,
  vaultCards: [
    { embera: "Mẽrã", phonetic: "[mẽ.ɾã]", meaning: "Hola / Saludo afectuoso", context: "Arco 1: Llegada al Río", icon: "🛶" },
    { embera: "Bia zebʉrʉ", phonetic: "[bia se.bɨ.ɾɨ]", meaning: "Bienvenido / Bien llegado", context: "Arco 1: Llegada al Río", icon: "🛶" },
    { embera: "Bia ɓʉa", phonetic: "[bia ɓɨ.a]", meaning: "Estoy bien / Está bien", context: "Arco 1: Estado y Ánimo", icon: "✨" },
    { embera: "Capipia", phonetic: "[ka.pi.pia]", meaning: "Contento / Gozoso", context: "Arco 1: Estado y Ánimo", icon: "😊" },
    { embera: "Ache", phonetic: "[a.tʃe]", meaning: "Amigo / Compañero (entre hombres)", context: "Arco 1: Identidad", icon: "🤝" },
    { embera: "Do", phonetic: "[do]", meaning: "Río", context: "Arco 1: Entorno fluvial", icon: "🌊" },
    { embera: "Jãba", phonetic: "[dʒã.ba]", meaning: "Canoa tradicional", context: "Arco 1: Navegación", icon: "🛶" },
    { embera: "Ɗoi", phonetic: "[ɗoi]", meaning: "Canalete de remar (implosiva ɗ)", context: "Arco 3: Navegación", icon: "🛶" },
    { embera: "Doi", phonetic: "[doi]", meaning: "Beber / Tomar líquido", context: "Arco 2: Tambo y Comida", icon: "🥤" },
    { embera: "De", phonetic: "[de]", meaning: "Casa / Tambo sobre pilotes", context: "Arco 2: El Hogar", icon: "🏡" },
    { embera: "Baido", phonetic: "[bai.do]", meaning: "Agua fresca de río", context: "Arco 2: Bebida", icon: "💧" },
    { embera: "Paɗa", phonetic: "[pa.ɗa]", meaning: "Plátano / Comida cotidiana", context: "Arco 2: Alimentación", icon: "🍌" },
    { embera: "Ɓeda", phonetic: "[ɓe.da]", meaning: "Pescado (implosiva ɓ)", context: "Arco 2: Alimentación", icon: "🐟" },
    { embera: "Cuaria", phonetic: "[kua.ɾia]", meaning: "Familia / Comunidad", context: "Arco 2: Familia", icon: "👨‍👩‍👧‍👦" },
    { embera: "Jiraba", phonetic: "[dʒi.ɾa.ba]", meaning: "Hamaca tejida para descansar", context: "Arco 2: Reposo", icon: "🛌" },
    { embera: "Carebai", phonetic: "[ka.ɾe.bai]", meaning: "Ayudar / Solidaridad comunitaria", context: "Arco 4: Trabajo Comunal", icon: "🤝" },
    { embera: "Neco", phonetic: "[ne.ko]", meaning: "Machete / Herramienta de trabajo", context: "Arco 4: Herramientas", icon: "🔪" },
    { embera: "Jamara", phonetic: "[dʒa.ma.ɾa]", meaning: "Canasto tejido de fibras", context: "Arco 4: Trueque", icon: "🧺" },
    { embera: "Urua", phonetic: "[u.ɾua]", meaning: "Fuego vivo / Hoguera", context: "Arco 5: La Fogata", icon: "🔥" },
    { embera: "Wãbʉrʉda", phonetic: "[wã.bɨ.ɾɨ.da]", meaning: "Adiós (se despide una persona)", context: "Arco 5: Despedida", icon: "👋" }
  ],
  // Conjugator state
  conjugator: {
    selectedVerbIndex: 0,
    selectedPersonIndex: 0,
    selectedTenseId: 'pres_cont'
  },

  phoneticChallenges: [
    {
      id: 1,
      title: "Par Mínimo 1: Ɓ Implosiva vs B Oclusiva",
      character: "Hablante nativo de la Portada oficial",
      rule: "La 'ɓ' en 'Ɓʉsriɗa' y 'Ɓa' (jugo) requiere un leve vacío hacia adentro antes de la vocal, mientras que 'B' es la oclusiva común del español.",
      nativeKey: "ɓʉsriɗa",
      sampleWord: "Ɓʉsriɗa vs Bia",
      meaning: "Gozo / Alegría vs Bueno / Bien",
      question: "¿Cómo se distingue la consonante inicial 'ɓ' de 'Ɓʉsriɗa' de la 'B' común?",
      options: [
        { text: "Con un golpe implosivo suave (inhalación leve labial)", correct: true },
        { text: "Es exactamente idéntica a la 'B' española de 'barco'", correct: false }
      ]
    },
    {
      id: 2,
      title: "Par Mínimo 2: Ɗ Implosiva vs D Alveolar",
      character: "Locutor oficial de Lección 1",
      rule: "En 'Beɗea' (idioma) y 'Ɗoi' (canalete), la 'ɗ' se forma con la lengua en los alvéolos succionando levemente hacia la laringe. En 'Doi' (beber) es una d normal.",
      nativeKey: "beɗea",
      sampleWord: "Ɗoi (Canalete) vs Doi (Beber)",
      meaning: "¿Canalete de remar o tomar líquido?",
      question: "¿Por qué es crucial no confundir 'Ɗoi' con 'Doi' en el río?",
      options: [
        { text: "Porque 'Ɗoi' (con ɗ) es el canalete para remar y 'Doi' es la acción de beber", correct: true },
        { text: "Porque significan lo mismo en cualquier contexto", correct: false }
      ]
    },
    {
      id: 3,
      title: "Par Mínimo 3: Vocal ʉ Central vs Vocal u",
      character: "Narrador de Vocabulario",
      rule: "La 'ʉ' es una vocal alta central no redondeada (sonríes sin redondear los labios mientras pronuncias u).",
      nativeKey: "nama",
      sampleWord: "Cʉda (Cama/Tambo) vs Cui (Bañarse)",
      meaning: "Lugar de descanso vs aseo personal en el río",
      question: "¿Cómo se posicionan los labios para pronunciar la vocal 'ʉ' de Emberá?",
      options: [
        { text: "Labios relajados/abiertos en sonrisa sin redondear hacia adelante", correct: true },
        { text: "Labios muy redondeados en trompa como para dar un beso", correct: false }
      ]
    },
    {
      id: 4,
      title: "Par Mínimo 4: Resonancia Nasal (Ã / Õ) vs Oral",
      character: "Hablante de Sección 1",
      rule: "En 'Ãcõrẽ' y 'Wãi' (ir), el velo del paladar baja dejando escapar el flujo de aire por la nariz (zumbido nasal).",
      nativeKey: "ãcõrẽ",
      sampleWord: "Wãi (Ir / Marchar) vs Wai (Esperar)",
      meaning: "Avanzar en el río vs aguardar inmóvil",
      question: "¿Qué ocurre con el flujo de aire al pronunciar la vocal con tilde nasal (~)?",
      options: [
        { text: "El aire viaja a través de la cavidad nasal produciendo resonancia", correct: true },
        { text: "El aire sale exclusivamente por los dientes sin tocar la nariz", correct: false }
      ]
    },
    {
      id: 5,
      title: "Entonación Interrogativa y Melodía de Frase",
      character: "Narrador de la Lección 1",
      rule: "Las preguntas como '¿Cãrẽã nama panʉda?' o las que terminan en '-ca' culminan con una elevación tonal ágil y curiosa.",
      nativeKey: "nama",
      sampleWord: "¿Cãrẽã nama panʉda?",
      meaning: "¿Por qué estamos aquí?",
      question: "¿Cómo articula el hablante el final de la pregunta en la grabación nativa?",
      options: [
        { text: "Con una elevación tonal natural y viva al final de 'panʉda'", correct: true },
        { text: "Totalmente plano, monótono y sin curva melódica", correct: false }
      ]
    }
  ],
  currentPhoneticIndex: 0
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupKaraokeAudioPlayer();
  await loadData();
  
  audioMgr.preload('track2_audio.mp3');
  audioMgr.preload('lesson1_audio.mp3');

  renderCurrentTab();
  lucide.createIcons();
});

// Load JSON Data
async function loadData() {
  if (typeof window.APP_DATA !== 'undefined' && window.APP_DATA) {
    console.log("[App] Usando datos locales bundled en APP_DATA (100% offline)");
    state.scenarios = window.APP_DATA.dialogues || [];
    state.grammarData = window.APP_DATA.verbs_grammar || {};
    state.lesson = window.APP_DATA.lesson1 || null;
    state.karaokeData = window.APP_DATA.lesson1_karaoke || [];
    state.dictionary = window.APP_DATA.dictionary || [];
    state.nativeLexicon = window.APP_DATA.native_lexicon || {};
    state.filteredDict = state.dictionary.slice(0, 100);

    if (state.scenarios.length > 0) {
      state.currentScenario = state.scenarios[0];
    }
    return;
  }

  try {
    const [scenariosRes, grammarRes, lessonRes, karaokeRes, dictRes, lexiconRes] = await Promise.all([
      fetch('dialogues.json').then(r => r.json()).catch(() => []),
      fetch('verbs_grammar.json').then(r => r.json()).catch(() => null),
      fetch('lesson1.json').then(r => r.json()).catch(() => null),
      fetch('lesson1_karaoke.json').then(r => r.json()).catch(() => []),
      fetch('dictionary.json').then(r => r.json()).catch(() => []),
      fetch('native_lexicon.json').then(r => r.json()).catch(() => ({}))
    ]);

    state.scenarios = scenariosRes || [];
    state.grammarData = grammarRes || {};
    state.lesson = lessonRes;
    state.karaokeData = karaokeRes || [];
    state.dictionary = dictRes || [];
    state.nativeLexicon = lexiconRes || {};
    state.filteredDict = state.dictionary.slice(0, 100);

    if (state.scenarios.length > 0) {
      state.currentScenario = state.scenarios[0];
    }
  } catch (err) {
    console.error("Error loading app data:", err);
  }
}

// Navigation Handling
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-tab-target]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      audioMgr.stop();
      const target = btn.getAttribute('data-tab-target');
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  if (state.audioElement && state.isPlaying) {
    state.audioElement.pause();
    state.isPlaying = false;
    updateKaraokePlayButton();
  }
  state.activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const activeEl = document.getElementById(`tab-${tabId}`);
  if (activeEl) activeEl.classList.add('active');

  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab-target') === tabId;
    if (isTarget) {
      btn.classList.add('text-teal-700', 'font-bold');
      btn.classList.remove('text-slate-400');
    } else {
      btn.classList.remove('text-teal-700', 'font-bold');
      btn.classList.add('text-slate-400');
    }
  });

  renderCurrentTab();
  lucide.createIcons();
}

function renderCurrentTab() {
  if (state.activeTab === 'study') {
    renderStudyTab();
  } else if (state.activeTab === 'grammar') {
    renderGrammarTab();
  } else if (state.activeTab === 'dialogue') {
    renderDialogueTab();
  } else if (state.activeTab === 'phonetics') {
    renderPhoneticsTab();
  } else if (state.activeTab === 'dictionary') {
    renderDictionaryTab();
  }
  updateStats();
}

function updateStats() {
  const gemEl = document.getElementById('stat-gems');
  const streakEl = document.getElementById('stat-streak');
  if (gemEl) gemEl.innerText = state.gems;
  if (streakEl) streakEl.innerText = state.streak;
}

// ==========================================
// 1. ESTUDIO BÍBLICO (KARAOKE BILINGÜE SINCRONIZADO Y PASO A PASO)
// ==========================================
function setupKaraokeAudioPlayer() {
  state.audioElement = new Audio('lesson1_audio.mp3');
  
  state.audioElement.addEventListener('timeupdate', () => {
    const cur = state.audioElement.currentTime;
    const dur = state.audioElement.duration || 810;
    
    // Update scrubber
    const scrubber = document.getElementById('karaoke-scrubber');
    const timeEl = document.getElementById('karaoke-current-time');
    const totalEl = document.getElementById('karaoke-total-time');

    if (scrubber) scrubber.value = (cur / dur) * 100;
    if (timeEl) timeEl.innerText = formatTime(cur);
    if (totalEl) totalEl.innerText = formatTime(dur);

    // Sync Karaoke active sentence
    syncKaraokeHighlight(cur);

    // Step-by-Step Auto-Pause check
    if (state.studyMode === 'step_by_step' && state.autoPauseAt !== null) {
      if (cur >= state.autoPauseAt - 0.05) {
        state.audioElement.pause();
        state.isPlaying = false;
        state.isSentencePaused = true;
        state.autoPauseAt = null;
        updateKaraokePlayButton();
        if (state.activeKaraokeId) {
          highlightActiveCard(state.activeKaraokeId);
        }
      }
    }
  });

  state.audioElement.addEventListener('ended', () => {
    state.isPlaying = false;
    state.isSentencePaused = false;
    state.autoPauseAt = null;
    updateKaraokePlayButton();
  });
}

function syncKaraokeHighlight(currentTime) {
  const currentSentence = state.karaokeData.find(item => currentTime >= item.start && currentTime <= item.end);
  const newActiveId = currentSentence ? currentSentence.id : null;

  if (newActiveId && newActiveId !== state.activeKaraokeId) {
    state.activeKaraokeId = newActiveId;
    state.currentKaraokeIndex = state.karaokeData.findIndex(item => item.id === newActiveId);
    highlightActiveCard(newActiveId);
    updateStepIndicator();
  }
}

function highlightActiveCard(id) {
  document.querySelectorAll('.karaoke-card').forEach(card => {
    card.classList.remove('active');
    const ctrl = card.querySelector('.card-step-controls');
    if (ctrl) ctrl.classList.add('hidden');
  });

  const activeCard = document.getElementById(`karaoke-${id}`);
  if (activeCard) {
    activeCard.classList.add('active');
    const ctrl = activeCard.querySelector('.card-step-controls');
    if (ctrl) ctrl.classList.remove('hidden');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function updateStepIndicator() {
  const stepInd = document.getElementById('karaoke-step-indicator');
  if (stepInd && state.karaokeData.length > 0) {
    stepInd.innerText = `${state.currentKaraokeIndex + 1}/${state.karaokeData.length}`;
  }
}

function setStudyMode(mode) {
  state.studyMode = mode;
  
  if (mode === 'step_by_step') {
    const item = state.karaokeData[state.currentKaraokeIndex];
    if (item && state.isPlaying) {
      state.autoPauseAt = item.end;
    }
  } else {
    state.autoPauseAt = null;
  }

  const stepBtn = document.getElementById('mode-btn-step');
  const contBtn = document.getElementById('mode-btn-cont');
  if (stepBtn && contBtn) {
    if (mode === 'step_by_step') {
      stepBtn.className = "px-2.5 py-1 rounded-md transition bg-teal-600 text-white shadow-xs font-bold";
      contBtn.className = "px-2.5 py-1 rounded-md transition text-slate-400 hover:text-slate-200 font-medium";
    } else {
      stepBtn.className = "px-2.5 py-1 rounded-md transition text-slate-400 hover:text-slate-200 font-medium";
      contBtn.className = "px-2.5 py-1 rounded-md transition bg-teal-600 text-white shadow-xs font-bold";
    }
  }
}

function renderStudyTab() {
  const container = document.getElementById('tab-study');
  if (!container || !state.lesson) return;

  const lesson = state.lesson;

  let html = `
    <!-- Top Sticky Audio Controller -->
    <div class="sticky top-0 z-20 bg-slate-900 text-white p-3.5 shadow-xl border-b border-teal-900/60">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${state.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}"></span>
            ${state.studyMode === 'step_by_step' ? 'Modo Frase a Frase (Paso a Paso)' : 'Modo Lectura Corrida'}
          </span>
          <h3 class="text-sm font-bold text-slate-100 truncate max-w-[250px]">Beɗea 1: ¿Bibliaba sãwã poya carebaida bʉra?</h3>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="setPlaybackSpeed(0.75)" id="speed-btn" class="px-2 py-1 text-[11px] font-bold bg-slate-800 rounded-lg text-teal-300 border border-slate-700">0.75x</button>
          <button onclick="toggleAudio()" id="btn-karaoke-play" class="w-10 h-10 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 flex items-center justify-center text-white shadow-lg transition">
            <i data-lucide="${state.isPlaying ? 'pause' : 'play'}" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- Stepper Controls & Mode Switcher Bar -->
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
        <!-- Mode Switcher -->
        <div class="inline-flex bg-slate-800/90 p-0.5 rounded-lg text-[10px] font-bold border border-slate-700">
          <button onclick="setStudyMode('step_by_step')" id="mode-btn-step" class="px-2.5 py-1 rounded-md transition ${state.studyMode === 'step_by_step' ? 'bg-teal-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'}">
            ⏸️ Pausa por Frase
          </button>
          <button onclick="setStudyMode('continuous')" id="mode-btn-cont" class="px-2.5 py-1 rounded-md transition ${state.studyMode === 'continuous' ? 'bg-teal-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'}">
            🔄 Corrido
          </button>
        </div>

        <!-- Navigation Stepper -->
        <div class="flex items-center gap-1">
          <button onclick="playPrevSentence()" class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Frase anterior">
            <i data-lucide="skip-back" class="w-4 h-4"></i>
          </button>
          <span id="karaoke-step-indicator" class="text-[11px] font-mono text-teal-300 font-bold px-1.5 py-0.5 bg-slate-800 rounded">
            ${state.currentKaraokeIndex + 1}/${state.karaokeData.length}
          </span>
          <button onclick="playNextSentence()" class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Siguiente frase">
            <i data-lucide="skip-forward" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
      
      <!-- Scrubber -->
      <div class="flex items-center gap-2 mt-2">
        <span id="karaoke-current-time" class="text-[10px] text-slate-400 font-mono">0:00</span>
        <input type="range" id="karaoke-scrubber" min="0" max="100" value="0" class="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400" oninput="seekAudio(this.value)">
        <span id="karaoke-total-time" class="text-[10px] text-slate-400 font-mono">13:30</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="p-4 space-y-4 pb-24">
      
      <!-- Header Banner -->
      <div class="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/80 p-4 rounded-3xl shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-teal-800 uppercase tracking-widest bg-teal-100/80 px-2 py-0.5 rounded-full">¡Ɓʉsriɗa ɓadua dãrã!</span>
          <span class="text-xs text-slate-500 font-medium">Lección 1</span>
        </div>
        <h1 class="text-lg font-extrabold text-slate-900 mt-1 font-embera">${lesson.title_embera}</h1>
        <p class="text-xs text-slate-600 italic font-sans mt-0.5">"${lesson.title_spanish}"</p>
        
        <!-- Verse pill -->
        <div class="mt-3 p-3 bg-white/90 rounded-2xl border border-teal-200/60 shadow-xs flex items-start gap-2.5">
          <i data-lucide="book-open" class="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5"></i>
          <div>
            <p class="text-xs font-bold text-slate-800">${lesson.key_verse.reference}:</p>
            <p class="text-xs font-semibold text-slate-900 font-embera mt-0.5">"${lesson.key_verse.text_embera}"</p>
            <p class="text-[11px] text-slate-500 italic">"${lesson.key_verse.text_spanish}"</p>
          </div>
        </div>
      </div>

      <!-- Pedagogical SLA Banner -->
      <div class="p-3 bg-teal-50/80 rounded-2xl border border-teal-200/70 text-xs text-teal-950 flex items-start gap-2">
        <i data-lucide="help-circle" class="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5"></i>
        <div>
          <p class="font-bold">Modo de Aprendizaje Activo:</p>
          <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            La lectura pausa automáticamente al terminar cada oración para que puedas <strong>repetirla en voz alta</strong>, inspeccionar palabras con IA o pulsar <strong>"Siguiente Frase ▶"</strong>.
          </p>
        </div>
      </div>

      <!-- Karaoke Bilingual Cards List -->
      <div class="space-y-3" id="karaoke-cards-container">
        ${state.karaokeData.map((item, idx) => {
          const isActive = state.activeKaraokeId === item.id;
          return `
          <div id="karaoke-${item.id}" class="karaoke-card bg-white p-3.5 rounded-2xl border ${isActive ? 'active' : 'border-slate-200/90'} shadow-sm transition">
            
            <div class="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
              <span class="text-[10px] font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1">
                <i data-lucide="volume-2" class="w-3 h-3 text-teal-600"></i> ${item.section} <span class="text-slate-400 font-mono">(${idx + 1}/${state.karaokeData.length})</span>
              </span>
              <button onclick="playKaraokeSentenceById('${item.id}')" class="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition">
                <i data-lucide="play-circle" class="w-3.5 h-3.5"></i> ${formatTime(item.start)}
              </button>
            </div>

            <!-- Emberá Spoken Line with Clickable Words -->
            <p class="karaoke-embera-text text-sm font-semibold text-slate-900 leading-relaxed font-embera">
              ${renderBilingualInteractiveTokens(item.words)}
            </p>

            <!-- Synchronized Spanish Translation -->
            <p class="karaoke-spanish-text text-xs text-slate-500 italic mt-1.5 pl-2.5 border-l-2 border-teal-400">
              ${item.spanish}
            </p>

            <!-- Action Controls for Active Card -->
            <div class="card-step-controls mt-2.5 pt-2 border-t border-amber-300/60 flex items-center justify-between gap-1.5 flex-wrap ${isActive ? '' : 'hidden'}">
              <div class="flex items-center gap-1.5">
                <button onclick="replayCurrentSentence()" class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg flex items-center gap-1 transition shadow-xs">
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Repetir Frase
                </button>
                <button onclick="replayCurrentSentence(0.7)" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-300 transition" title="Repetir despacio">
                  🐢 0.7x
                </button>
              </div>

              ${idx < state.karaokeData.length - 1 ? `
                <button onclick="playNextSentence()" class="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition">
                  <span>Siguiente Frase</span> <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              ` : `
                <span class="text-[11px] text-teal-800 font-bold flex items-center gap-1">
                  <span>🎉 Fin de la lección</span>
                </span>
              `}
            </div>

          </div>
        `;}).join('')}
      </div>

    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function renderBilingualInteractiveTokens(words) {
  if (!words || words.length === 0) return '';
  return words.map(w => `
    <span class="token-chip" onclick="openAIInspector('${escapeStr(w.em)}', '${escapeStr(w.es)}', '${escapeStr(w.pos)}')">
      ${w.em}
    </span>
  `).join(' ');
}

function playKaraokeSentence(startSec) {
  const item = state.karaokeData.find(k => Math.abs(k.start - startSec) < 1.0) || state.karaokeData[0];
  if (item) {
    playKaraokeSentenceById(item.id);
  } else {
    if (!state.audioElement) return;
    state.audioElement.currentTime = startSec;
    state.audioElement.play();
    state.isPlaying = true;
    updateKaraokePlayButton();
  }
}

function playKaraokeSentenceById(id, speed = 1.0) {
  if (!state.audioElement) return;
  const idx = state.karaokeData.findIndex(item => item.id === id);
  if (idx === -1) return;

  const item = state.karaokeData[idx];
  state.currentKaraokeIndex = idx;
  state.activeKaraokeId = id;

  if (state.studyMode === 'step_by_step') {
    state.autoPauseAt = item.end;
  } else {
    state.autoPauseAt = null;
  }

  state.isSentencePaused = false;
  state.audioElement.playbackRate = speed;
  state.audioElement.currentTime = item.start;
  state.audioElement.play().catch(e => console.log("Audio play error", e));
  state.isPlaying = true;

  updateKaraokePlayButton();
  updateStepIndicator();
  highlightActiveCard(id);
}

function playNextSentence() {
  if (state.currentKaraokeIndex < state.karaokeData.length - 1) {
    const nextItem = state.karaokeData[state.currentKaraokeIndex + 1];
    playKaraokeSentenceById(nextItem.id);
  }
}

function playPrevSentence() {
  if (state.currentKaraokeIndex > 0) {
    const prevItem = state.karaokeData[state.currentKaraokeIndex - 1];
    playKaraokeSentenceById(prevItem.id);
  }
}

function replayCurrentSentence(speed = 1.0) {
  const item = state.karaokeData[state.currentKaraokeIndex];
  if (item) {
    playKaraokeSentenceById(item.id, speed);
  }
}

function toggleAudio() {
  if (!state.audioElement) return;

  if (state.isPlaying) {
    state.audioElement.pause();
    state.isPlaying = false;
    updateKaraokePlayButton();
  } else {
    if (state.studyMode === 'step_by_step') {
      const curItem = state.karaokeData[state.currentKaraokeIndex];
      if (state.isSentencePaused || (curItem && state.audioElement.currentTime >= curItem.end - 0.2)) {
        if (state.currentKaraokeIndex < state.karaokeData.length - 1) {
          playNextSentence();
          return;
        } else {
          playKaraokeSentenceById(state.karaokeData[0].id);
          return;
        }
      } else if (curItem) {
        state.autoPauseAt = curItem.end;
      }
    }
    state.audioElement.play().catch(e => console.log("Audio play error", e));
    state.isPlaying = true;
    updateKaraokePlayButton();
  }
}

function updateKaraokePlayButton() {
  const btn = document.getElementById('btn-karaoke-play');
  if (btn) {
    btn.innerHTML = `<i data-lucide="${state.isPlaying ? 'pause' : 'play'}" class="w-5 h-5"></i>`;
    lucide.createIcons();
  }
}

function seekAudio(val) {
  if (!state.audioElement || !state.audioElement.duration) return;
  const seekTo = (val / 100) * state.audioElement.duration;
  state.audioElement.currentTime = seekTo;
}

function setPlaybackSpeed(speed) {
  if (!state.audioElement) return;
  const newSpeed = state.audioElement.playbackRate === 1 ? 0.75 : 1;
  state.audioElement.playbackRate = newSpeed;
  const btn = document.getElementById('speed-btn');
  if (btn) btn.innerText = `${newSpeed}x`;
}

// ==========================================
// ASISTENTE IA: INSPECTOR LINGÜÍSTICO EMBERÁ-ESPAÑOL
// ==========================================
function openAIInspector(emberaWord, spanishEquivalent, posHint) {
  const modal = document.getElementById('ai-inspector-modal');
  if (!modal) return;

  const clean = emberaWord.toLowerCase().replace(/[¿?¡!.,]/g, '').trim();

  document.getElementById('ai-word-embera').innerText = emberaWord;
  document.getElementById('ai-word-spanish').innerText = spanishEquivalent;
  document.getElementById('ai-word-pos').innerText = posHint || 'Término Bíblico Dóbida';

  // Analyze morphology
  let root = clean;
  let suffixExplanation = "Forma léxica base.";
  if (clean.endsWith('ba')) {
    root = clean.slice(0, -2);
    suffixExplanation = "Sufijo ergativo (-ba): Indica que la palabra es el sujeto activo que realiza la acción sobre otro.";
  } else if (clean.endsWith('ra')) {
    root = clean.slice(0, -2);
    suffixExplanation = "Sufijo de estado / ser / estar (-ra): Indica que la palabra es el tema o sujeto intransitivo.";
  } else if (clean.endsWith('ne')) {
    root = clean.slice(0, -2);
    suffixExplanation = "Sufijo locativo (-ne): Significa 'en' (ej. ẽjũãne = en la tierra).";
  } else if (clean.endsWith('ɗe')) {
    root = clean.slice(0, -2);
    suffixExplanation = "Sufijo locativo/temporal (-ɗe): Significa 'en / dentro de' o 'durante'.";
  } else if (clean.includes('panʉ')) {
    suffixExplanation = "Aspecto continuo plural (-panʉ): Indica que varias personas están realizando la acción en este momento.";
  } else if (clean.includes('bada')) {
    suffixExplanation = "Aspecto habitual plural (-bada): Indica una costumbre o acción que se realiza frecuentemente.";
  }

  document.getElementById('ai-word-root').innerText = root;
  document.getElementById('ai-suffix-rule').innerText = suffixExplanation;

  // Check if native audio exists
  const hasClip = state.nativeLexicon[clean] || Object.keys(state.nativeLexicon).some(k => clean.includes(k));
  const audioContainer = document.getElementById('ai-native-audio-controls');
  if (hasClip) {
    audioContainer.innerHTML = `
      <div class="flex gap-2">
        <button onclick="playNativeWord('${escapeStr(emberaWord)}', 1.0)" class="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition">
          <i data-lucide="volume-2" class="w-4 h-4"></i> Escuchar al Personaje (1x)
        </button>
        <button onclick="playNativeWord('${escapeStr(emberaWord)}', 0.6)" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition" title="Cámara lenta">
          🐢 0.6x
        </button>
      </div>
    `;
  } else {
    // Zero artificial voices: Show phonetic guidance
    audioContainer.innerHTML = `
      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <span class="text-[11px] text-slate-500 italic block">Grabación de lección sincronizada activa arriba en el reproductor.</span>
        <button onclick="playKaraokeSentence(state.audioElement ? state.audioElement.currentTime : 5.2)" class="mt-1.5 text-xs text-teal-700 font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
          <i data-lucide="play-circle" class="w-3.5 h-3.5"></i> Escuchar esta sección en el audio oficial
        </button>
      </div>
    `;
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeAIInspectorModal() {
  const modal = document.getElementById('ai-inspector-modal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// 2. GRAMÁTICA VIVA & CONJUGADOR INTERACTIVO
// ==========================================
function renderGrammarTab() {
  const container = document.getElementById('tab-grammar');
  if (!container || !state.grammarData) return;

  const data = state.grammarData;
  const verbs = data.verbs;
  const pronouns = data.pronouns;
  const tenses = data.tenses;

  const curVerb = verbs[state.conjugator.selectedVerbIndex] || verbs[0];
  const curPerson = pronouns[state.conjugator.selectedPersonIndex] || pronouns[0];
  const curTense = tenses.find(t => t.id === state.conjugator.selectedTenseId) || tenses[0];

  // Conjugation logic based on manual rules
  const isPlural = state.conjugator.selectedPersonIndex >= 3;
  const pronounUsed = curPerson.transitive;
  const suffixUsed = isPlural ? curTense.suffix_plural : curTense.suffix_singular;
  const conjugatedVerb = `${curVerb.root}${suffixUsed}`;
  const fullSentence = `${pronounUsed} ${conjugatedVerb}`;

  let html = `
    <div class="p-4 space-y-4 pb-24">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-4 rounded-3xl shadow-lg border border-teal-900/60">
        <span class="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
          <i data-lucide="puzzle" class="w-3.5 h-3.5"></i> Gramática Viva Dóbida
        </span>
        <h2 class="text-base font-extrabold text-white mt-1">Pronombres y Conjugador de Verbos</h2>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">Aprende a conjugar aplicando las reglas de sufijos de los 15 años de manual en Chocó.</p>
      </div>

      <!-- SECTION A: CONJUGADOR DINÁMICO -->
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <i data-lucide="zap" class="w-4 h-4 text-teal-600"></i> Conjugador Interactivo
          </h3>
          <span class="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            Regla de Sufijos
          </span>
        </div>

        <!-- 1. Select Verb -->
        <div>
          <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">1. Selecciona el Verbo:</label>
          <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/80">
            ${verbs.map((v, idx) => `
              <button onclick="setConjugatorVerb(${idx})" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition ${state.conjugator.selectedVerbIndex === idx ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'}">
                ${v.infinitive} <span class="text-[10px] opacity-75">(${v.spanish.split('/')[0].trim()})</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Select Person -->
        <div>
          <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">2. Persona / Pronombre:</label>
          <div class="grid grid-cols-2 gap-1.5">
            ${pronouns.map((p, idx) => `
              <button onclick="setConjugatorPerson(${idx})" class="p-2 text-left rounded-xl text-xs transition border ${state.conjugator.selectedPersonIndex === idx ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}">
                <span class="block font-embera">${p.transitive}</span>
                <span class="text-[10px] text-slate-500 font-sans block">${p.person.split('(')[1]?.replace(')', '') || p.person}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. Select Tense -->
        <div>
          <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">3. Tiempo / Modo:</label>
          <div class="flex flex-wrap gap-1.5">
            ${tenses.map((t) => `
              <button onclick="setConjugatorTense('${t.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${state.conjugator.selectedTenseId === t.id ? 'bg-slate-900 text-white shadow-xs font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                ${t.name.split('(')[0].trim()}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Conjugated Result Card -->
        <div class="p-4 bg-gradient-to-br from-teal-700 to-slate-900 text-white rounded-2xl shadow-md space-y-2 mt-2">
          <span class="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Forma Conjugada Resultante:</span>
          
          <div class="text-xl font-extrabold font-embera text-white tracking-tight">
            ${fullSentence}
          </div>

          <!-- Linguistic breakdown chips -->
          <div class="flex flex-wrap gap-1.5 pt-1 text-[11px]">
            <span class="bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded border border-teal-600">
              Pronombre: <strong>${pronounUsed}</strong>
            </span>
            <span class="bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded border border-teal-600">
              Raíz: <strong>${curVerb.root}</strong>
            </span>
            <span class="bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded border border-teal-600">
              Sufijo: <strong>${suffixUsed}</strong>
            </span>
          </div>

          <div class="text-xs text-slate-300 pt-1 border-t border-teal-800/80 flex items-center justify-between">
            <span>💡 ${curTense.explanation}</span>
          </div>
        </div>
      </div>

      <!-- SECTION B: TABLA MAESTRA DE PRONOMBRES -->
      <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <i data-lucide="users" class="w-4 h-4 text-teal-600"></i> Tabla de Pronombres (Pág. 5-7 del Manual)
        </h3>
        
        <p class="text-xs text-slate-500">Recuerda: Los verbos de acción transitivos llevan <strong>-ba / -a</strong>, mientras que ser o estar lleva <strong>-ra</strong>.</p>

        <div class="space-y-2">
          ${pronouns.map(p => `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-1">
              <div class="flex justify-between items-center font-bold text-slate-900">
                <span>${p.person}</span>
                <span class="text-teal-700 font-mono">${p.base}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                <div>
                  <span class="text-slate-400 block font-semibold">Acción (-ba / -a):</span>
                  <span class="font-bold text-slate-800 font-embera">${p.transitive}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold">Ser/Estar (-ra):</span>
                  <span class="font-bold text-slate-800 font-embera">${p.intransitive}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold">Posesivo antes:</span>
                  <span class="font-semibold text-slate-700 font-embera">${p.possessive_before}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-semibold">Posesivo después:</span>
                  <span class="font-semibold text-slate-700 font-embera">${p.possessive_after}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function setConjugatorVerb(idx) {
  state.conjugator.selectedVerbIndex = idx;
  renderGrammarTab();
}

function setConjugatorPerson(idx) {
  state.conjugator.selectedPersonIndex = idx;
  renderGrammarTab();
}

function setConjugatorTense(tenseId) {
  state.conjugator.selectedTenseId = tenseId;
  renderGrammarTab();
}

// ==========================================
// 3. DIALOGUE SIMULATOR (EN EL CAMPO)
// ==========================================
function renderDialogueTab() {
  const container = document.getElementById('tab-dialogue');
  if (!container || !state.currentScenario) return;

  const scenario = state.currentScenario;
  const step = scenario.steps[state.currentStepIndex];
  const progressPct = Math.round(((state.currentStepIndex + 1) / scenario.steps.length) * 100);

  let html = `
    <div class="p-4 bg-slate-900 text-white rounded-2xl mx-4 mt-3 shadow-lg border border-teal-900/60">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs uppercase tracking-wider text-teal-400 font-semibold flex items-center gap-1">
          <i data-lucide="compass" class="w-3.5 h-3.5"></i> ${scenario.category}
        </span>
        <button onclick="openScenarioPicker()" class="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1 transition">
          Cambiar Escenario <i data-lucide="chevron-down" class="w-3 h-3"></i>
        </button>
      </div>
      <h2 class="text-lg font-bold text-slate-100 flex items-center gap-2">
        ${scenario.title}
      </h2>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
          ${scenario.badge || 'Aventura Dóbida'}
        </span>
      </div>
      <p class="text-xs text-slate-400 mt-1">${scenario.description}</p>
      
      <div class="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
        <div class="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
      </div>
      <div class="flex justify-between text-[11px] text-slate-400 mt-1">
        <span>Paso ${state.currentStepIndex + 1} de ${scenario.steps.length}</span>
        <span>${progressPct}% completado</span>
      </div>
    </div>

    <div class="px-4 mt-3 flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-600 flex items-center gap-1">
        <i data-lucide="layers" class="w-3.5 h-3.5 text-teal-700"></i> Andamio Pedagógico:
      </span>
      <div class="inline-flex bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
        <button onclick="setScaffoldLevel(1)" class="px-2.5 py-1 rounded-md transition ${state.scaffoldLevel === 1 ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
          Nivel 1 (Opciones)
        </button>
        <button onclick="setScaffoldLevel(2)" class="px-2.5 py-1 rounded-md transition ${state.scaffoldLevel === 2 ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
          Nivel 2 (Bloques)
        </button>
        <button onclick="setScaffoldLevel(3)" class="px-2.5 py-1 rounded-md transition ${state.scaffoldLevel === 3 ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
          Nivel 3 (Voz Libre)
        </button>
      </div>
    </div>

    <div class="px-4 mt-3 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
          ${step.avatar}
        </div>
        <div class="flex-1 bg-white p-4 rounded-2xl rounded-tl-xs shadow-xs border border-slate-200/80">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-slate-700">${step.speaker}</span>
            <div class="flex items-center gap-1">
              ${step.native_audio ? `
                <button onclick="playNativeAudio('${step.native_audio.file}', ${step.native_audio.start}, ${step.native_audio.end}, 1.0)" class="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Voz Nativa
                </button>
                <button onclick="playNativeAudio('${step.native_audio.file}', ${step.native_audio.start}, ${step.native_audio.end}, 0.65)" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition" title="En cámara lenta">
                  🐢 0.6x
                </button>
              ` : `
                <button onclick="playNativeWord('${escapeStr(step.text_embera)}', 1.0)" class="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded-lg border border-teal-200 flex items-center gap-1">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Escuchar
                </button>
              `}
            </div>
          </div>
          <p class="text-base font-semibold text-slate-900 leading-snug font-embera">${step.text_embera}</p>
          <p class="text-xs text-slate-500 mt-1 italic">"${step.text_spanish}"</p>
          ${step.audio_hint ? `<div class="mt-2 text-[11px] text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200 inline-flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3 text-teal-600"></i> ${step.audio_hint}</div>` : ''}
          ${step.focus_on_form ? `<div class="mt-2 text-[11px] text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-start gap-1.5"><i data-lucide="lightbulb" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5"></i> <span>${step.focus_on_form}</span></div>` : ''}
        </div>
      </div>

      <div class="bg-teal-500/10 border-l-4 border-teal-700 p-3 rounded-r-xl">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-teal-950 uppercase tracking-wide">Tu turno de responder:</p>
          <button onclick="toggleGhostPrompter()" class="text-[10px] font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 px-2 py-0.5 rounded-full border border-teal-300 flex items-center gap-1 transition">
            👻 ${state.showGhostPrompter ? 'Ocultar Susurro' : 'Susurrador IA'}
          </button>
        </div>
        <p class="text-sm text-slate-800 font-medium mt-1">${step.user_prompt}</p>
        ${state.showGhostPrompter ? `
          <div class="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <span class="text-base">👻</span>
            <div>
              <span class="font-bold block text-[10px] uppercase text-amber-700">Susurro Fonético del Copiloto:</span>
              <span class="italic font-medium">${step.ghost_prompt || 'Respira hondo y comienza con calma.'}</span>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="mt-4">
  `;

  if (state.scaffoldLevel === 1) {
    html += `
      <div class="space-y-2.5">
        ${step.options.map((opt, idx) => `
          <div class="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 shadow-xs transition group">
            <div class="flex items-start justify-between gap-2">
              <button onclick="submitOption(${idx})" class="text-left flex-1 flex items-start gap-3">
                <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 transition mt-0.5">
                  ${idx + 1}
                </span>
                <div>
                  <p class="text-sm font-semibold text-slate-900 font-embera">${opt.embera}</p>
                  <p class="text-xs text-slate-500 mt-0.5">${opt.spanish}</p>
                </div>
              </button>
              
              ${opt.native_audio ? `
                <button onclick="playNativeAudio('${opt.native_audio.file}', ${opt.native_audio.start}, ${opt.native_audio.end}, 1.0)" class="p-2 text-teal-700 hover:bg-teal-50 rounded-xl transition flex-shrink-0" title="Escuchar">
                  <i data-lucide="volume-2" class="w-4 h-4"></i>
                </button>
              ` : `
                <button onclick="playNativeWord('${escapeStr(opt.embera)}', 1.0)" class="p-2 text-slate-400 hover:text-teal-700 rounded-xl transition flex-shrink-0">
                  <i data-lucide="volume-2" class="w-4 h-4"></i>
                </button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (state.scaffoldLevel === 2) {
    html += `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-xs text-slate-500 mb-2 font-medium">Toca las palabras en orden para construir la frase:</p>
        
        <div class="min-h-[50px] p-2.5 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-wrap gap-1.5 items-center mb-3">
          ${state.selectedBlocks.length === 0 ? '<span class="text-xs text-slate-400 italic">Arma tu frase aquí...</span>' : ''}
          ${state.selectedBlocks.map((word, bIdx) => `
            <span onclick="removeBlock(${bIdx})" class="word-block inline-flex items-center gap-1 bg-teal-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs">
              ${word} <i data-lucide="x" class="w-3 h-3"></i>
            </span>
          `).join('')}
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          ${step.blocks.map((word) => `
            <button onclick="addBlock('${escapeStr(word)}')" class="word-block bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition">
              ${word}
            </button>
          `).join('')}
        </div>

        <div class="mt-4 flex gap-2">
          <button onclick="clearBlocks()" class="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Borrar</button>
          <button onclick="submitBlocks()" class="flex-1 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5">
            <i data-lucide="check" class="w-4 h-4"></i> Verificar Frase
          </button>
        </div>
      </div>
    `;
  } else if (state.scaffoldLevel === 3) {
    html += `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <textarea id="free-speech-input" rows="2" placeholder="Escribe tu respuesta en Emberá..." class="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"></textarea>
        
        <div class="flex items-center justify-between mt-3">
          <span class="text-[11px] text-slate-400">Recuerda los sufijos (-ba / -ra)</span>
          <button onclick="submitFreeSpeech()" class="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition">
            Enviar Respuesta
          </button>
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function setScaffoldLevel(lvl) {
  state.scaffoldLevel = lvl;
  state.selectedBlocks = [];
  renderDialogueTab();
}

function addBlock(word) {
  state.selectedBlocks.push(word);
  renderDialogueTab();
}

function removeBlock(idx) {
  state.selectedBlocks.splice(idx, 1);
  renderDialogueTab();
}

function clearBlocks() {
  state.selectedBlocks = [];
  renderDialogueTab();
}

function submitOption(optionIdx) {
  const step = state.currentScenario.steps[state.currentStepIndex];
  const selected = step.options[optionIdx];
  showFeedbackModal(selected.correct, selected.explanation, selected.embera, selected.native_audio, selected.recast);
}

function submitBlocks() {
  const step = state.currentScenario.steps[state.currentStepIndex];
  const assembled = state.selectedBlocks.join(' ').trim();
  const correctOption = step.options.find(o => o.correct);

  const normalize = s => s.toLowerCase().replace(/[.,?¿!¡]/g, '').trim();
  const isMatch = normalize(assembled) === normalize(correctOption.embera);

  if (isMatch) {
    showFeedbackModal(true, correctOption.explanation, assembled, correctOption.native_audio);
  } else {
    showFeedbackModal(false, `Intenta comparar el orden. Debe ser: "${correctOption.embera}". Recuerda la regla gramatical del manual.`, assembled, null);
  }
}

function submitFreeSpeech() {
  const input = document.getElementById('free-speech-input');
  if (!input || !input.value.trim()) return;
  const step = state.currentScenario.steps[state.currentStepIndex];
  const correctOption = step.options.find(o => o.correct);

  showFeedbackModal(true, `¡Excelente intento! La respuesta modelo grabada es: "${correctOption.embera}". ${correctOption.explanation}`, input.value, correctOption.native_audio);
}

function showFeedbackModal(isCorrect, explanation, textUsed, nativeAudio, recast) {
  const modal = document.getElementById('feedback-modal');
  if (!modal) return;

  if (isCorrect) {
    state.gems += 10;
    playSound('correct');
  } else {
    playSound('incorrect');
  }

  const titleEl = document.getElementById('feedback-title');
  const iconEl = document.getElementById('feedback-icon');
  const expEl = document.getElementById('feedback-explanation');
  const textEl = document.getElementById('feedback-text');
  const nextBtn = document.getElementById('feedback-next-btn');

  if (isCorrect) {
    titleEl.innerText = "¡Muy Bien! (Bio biara ɓʉ)";
    titleEl.className = "text-lg font-bold text-emerald-800";
    iconEl.innerHTML = `<div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-2">🎉</div>`;
  } else {
    titleEl.innerText = "Revisa la Regla";
    titleEl.className = "text-lg font-bold text-amber-800";
    iconEl.innerHTML = `<div class="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-2">💡</div>`;
  }

  let textHtml = `"${textUsed}"`;
  if (nativeAudio) {
    textHtml += `
      <div class="mt-2 flex justify-center gap-2">
        <button onclick="playNativeAudio('${nativeAudio.file}', ${nativeAudio.start}, ${nativeAudio.end}, 1.0)" class="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs">
          <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Escuchar al Narrador
        </button>
        <button onclick="playNativeAudio('${nativeAudio.file}', ${nativeAudio.start}, ${nativeAudio.end}, 0.65)" class="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg">
          🐢 0.6x
        </button>
      </div>
    `;
  }
  textEl.innerHTML = textHtml;
  expEl.innerText = explanation;

  const recastCont = document.getElementById('feedback-recast-container');
  const recastEl = document.getElementById('feedback-recast');
  if (recastCont && recastEl) {
    if (recast) {
      recastEl.innerText = recast;
      recastCont.classList.remove('hidden');
    } else {
      recastCont.classList.add('hidden');
    }
  }

  const isLastStep = state.currentStepIndex >= state.currentScenario.steps.length - 1;
  nextBtn.innerText = isLastStep ? "Finalizar Escenario" : "Siguiente Intercambio →";
  nextBtn.onclick = () => {
    closeFeedbackModal();
    if (isCorrect) {
      if (isLastStep) {
        state.currentStepIndex = 0;
        alert("¡Felicitaciones! Has completado este escenario con pronunciación nativa. +30 Gemas.");
        state.gems += 30;
      } else {
        state.currentStepIndex++;
      }
    }
    state.selectedBlocks = [];
    renderDialogueTab();
    updateStats();
  };

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('hidden');
}

function openScenarioPicker() {
  const modal = document.getElementById('scenario-picker-modal');
  if (!modal) return;
  const listEl = document.getElementById('scenario-picker-list');
  listEl.innerHTML = state.scenarios.map((sc) => `
    <button onclick="selectScenario('${sc.id}')" class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition mb-2 flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-teal-800">${sc.category}</p>
        <p class="text-sm font-semibold text-slate-900">${sc.title}</p>
      </div>
      <i data-lucide="check-circle" class="w-5 h-5 ${state.currentScenario.id === sc.id ? 'text-teal-700' : 'text-slate-300'}"></i>
    </button>
  `).join('');
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function selectScenario(scId) {
  const target = state.scenarios.find(s => s.id === scId);
  if (target) {
    state.currentScenario = target;
    state.currentStepIndex = 0;
    state.selectedBlocks = [];
  }
  const modal = document.getElementById('scenario-picker-modal');
  if (modal) modal.classList.add('hidden');
  renderDialogueTab();
}

// ==========================================
// 4. PHONETIC GYM (SOLO VOCES HUMANAS AUTÉNTICAS)
// ==========================================
function renderPhoneticsTab() {
  const container = document.getElementById('tab-phonetics');
  if (!container) return;

  const challenge = state.phoneticChallenges[state.currentPhoneticIndex];
  const clip = state.nativeLexicon[challenge.nativeKey];

  let html = `
    <div class="p-4 space-y-4 pb-24">
      <div class="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-5 rounded-3xl shadow-xl border border-teal-900/60 relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] uppercase font-bold tracking-widest text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Solo Voz Real de los Personajes
          </span>
          <span class="text-xs text-slate-400 font-mono">${state.currentPhoneticIndex + 1}/${state.phoneticChallenges.length}</span>
        </div>

        <h2 class="text-lg font-bold text-white mt-1">${challenge.title}</h2>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">${challenge.rule}</p>
        
        <div class="mt-4 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-teal-300 font-semibold block">${challenge.character}</span>
            <span class="text-sm font-bold text-white font-embera">${challenge.sampleWord}</span>
            <span class="text-[11px] text-slate-400 block italic">"${challenge.meaning}"</span>
          </div>
          
          <div class="flex items-center gap-1.5">
            <button onclick="playNativeWord('${challenge.nativeKey}', 1.0)" class="px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition">
              <i data-lucide="volume-2" class="w-4 h-4"></i> Escuchar (1x)
            </button>
            <button onclick="playNativeWord('${challenge.nativeKey}', 0.6)" class="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 text-teal-300 text-xs font-bold rounded-xl border border-slate-600 transition" title="Escuchar en cámara lenta">
              🐢 0.6x
            </button>
          </div>
        </div>

        ${clip && clip.phonetic ? `
          <div class="mt-2.5 text-[11px] text-teal-200 bg-teal-900/40 p-2.5 rounded-xl border border-teal-800/50 flex items-start gap-2">
            <i data-lucide="info" class="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5"></i>
            <span>Articulación Dóbida: ${clip.phonetic}.</span>
          </div>
        ` : ''}
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <p class="text-sm font-bold text-slate-800">${challenge.question}</p>

        <div class="grid grid-cols-1 gap-2.5">
          ${challenge.options.map((opt, optIdx) => `
            <button onclick="answerNativePhonetic(${opt.correct})" class="p-3.5 rounded-xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition text-left flex items-start gap-3 group">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 transition">
                ${optIdx + 1}
              </span>
              <span class="text-xs font-medium text-slate-800 leading-snug flex-1">${opt.text}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="flex justify-between items-center text-xs text-slate-500 px-1">
        <span>Desafío ${state.currentPhoneticIndex + 1} de ${state.phoneticChallenges.length}</span>
        <button onclick="nextPhonetic()" class="text-teal-800 font-bold hover:underline flex items-center gap-1">
          Siguiente Desafío <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function answerNativePhonetic(isCorrect) {
  if (isCorrect) {
    state.gems += 5;
    playSound('correct');
    alert("¡Excelente oído! Has captado la articulación auténtica del personaje.");
    nextPhonetic();
  } else {
    playSound('incorrect');
    alert("Escucha a velocidad 0.6x para percibir la inhalación suave de la implosiva.");
  }
}

function nextPhonetic() {
  state.currentPhoneticIndex = (state.currentPhoneticIndex + 1) % state.phoneticChallenges.length;
  renderPhoneticsTab();
  updateStats();
}

// ==========================================
// 5. GLOSARIO & DICCIONARIO (CERO VOCES SINTÉTICAS)
// ==========================================
function renderDictionaryTab() {
  const container = document.getElementById('tab-dictionary');
  if (!container) return;

  if (state.dictViewMode === 'vault_srs') {
    renderVaultSRSTab(container);
    return;
  }

  const totalCount = state.dictionary.length;

  let html = `
    <div class="p-4 space-y-3 pb-24">
      <!-- Mode Switcher -->
      <div class="flex bg-slate-200 p-1 rounded-2xl">
        <button onclick="setDictViewMode('list')" class="flex-1 py-1.5 rounded-xl text-xs font-bold transition ${state.dictViewMode === 'list' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
          📖 Diccionario Completo (${totalCount})
        </button>
        <button onclick="setDictViewMode('vault_srs')" class="flex-1 py-1.5 rounded-xl text-xs font-bold transition ${state.dictViewMode === 'vault_srs' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
          💎 Bóveda Léxica SRS (${state.vaultCards.length})
        </button>
      </div>

      <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
          <input type="text" id="dict-search-input" value="${state.dictSearchTerm}" oninput="searchDictionary(this.value)" placeholder="Buscar palabra (español o emberá)..." class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none">
        </div>

        <div class="flex items-center justify-between">
          <button onclick="toggleNativeOnlyFilter()" class="px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${state.dictFilterNativeOnly ? 'bg-teal-700 text-white border-teal-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}">
            <i data-lucide="mic" class="w-3.5 h-3.5"></i> Solo con Voz de los Personajes (${Object.keys(state.nativeLexicon).length})
          </button>
          
          <span class="text-[11px] text-slate-400">${state.filteredDict.length} de ${totalCount}</span>
        </div>
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        ${state.filteredDict.slice(0, 150).map(e => {
          const clean = e.embera.toLowerCase().replace(/[¿?¡!.,]/g, '').trim();
          const hasNative = state.nativeLexicon[clean] || Object.keys(state.nativeLexicon).some(k => clean.includes(k));
          return `
            <div class="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-teal-400 transition flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <p class="text-sm font-bold text-slate-900 font-embera">${e.embera}</p>
                  ${hasNative ? `<span class="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded border border-teal-300">🎙️ Voz Personaje</span>` : ''}
                </div>
                <p class="text-xs text-slate-600 mt-0.5">${e.spanish}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">Pág. ${e.page}</span>
                <button onclick="playNativeWord('${escapeStr(e.embera)}', 1.0)" class="p-2 ${hasNative ? 'bg-teal-50 hover:bg-teal-100 text-teal-800' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'} rounded-xl transition" title="Pronunciación o guía articulatoria">
                  <i data-lucide="${hasNative ? 'volume-2' : 'sparkles'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function renderVaultSRSTab(container) {
  const card = state.vaultCards[state.srsCardIndex];
  const progressPct = Math.round(((state.srsCardIndex + 1) / state.vaultCards.length) * 100);

  let html = `
    <div class="p-4 space-y-4 pb-24">
      <!-- Mode Switcher -->
      <div class="flex bg-slate-200 p-1 rounded-2xl">
        <button onclick="setDictViewMode('list')" class="flex-1 py-1.5 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900">
          📖 Diccionario Completo
        </button>
        <button onclick="setDictViewMode('vault_srs')" class="flex-1 py-1.5 rounded-xl text-xs font-bold transition bg-teal-700 text-white shadow-xs">
          💎 Bóveda Léxica SRS (${state.vaultCards.length})
        </button>
      </div>

      <!-- Header Card -->
      <div class="bg-gradient-to-br from-slate-900 to-teal-950 p-4 rounded-3xl text-white shadow-lg border border-teal-900/60">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] uppercase font-bold text-teal-300 tracking-wider flex items-center gap-1">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-teal-400"></i> Anclaje Léxico sin Traducción
          </span>
          <span class="text-xs text-slate-400 font-mono">${state.srsCardIndex + 1}/${state.vaultCards.length}</span>
        </div>
        <h2 class="text-base font-bold text-white">${card.context}</h2>
        <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div class="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all" style="width: ${progressPct}%"></div>
        </div>
      </div>

      <!-- Flashcard Body -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center flex flex-col items-center justify-center min-h-[260px] relative transition-all">
        <div class="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl mb-3 shadow-xs">
          ${card.icon}
        </div>
        <h3 class="text-2xl font-extrabold text-slate-900 font-embera mb-1">${card.embera}</h3>
        <p class="text-xs text-teal-700 font-mono mb-4">${card.phonetic}</p>

        <button onclick="playNativeWord('${escapeStr(card.embera)}', 1.0)" class="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 flex items-center gap-1.5 transition mb-4">
          <i data-lucide="volume-2" class="w-4 h-4"></i> Escuchar Pronunciación
        </button>

        ${!state.srsCardFlipped ? `
          <button onclick="flipSrsCard()" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2">
            <i data-lucide="eye" class="w-4 h-4"></i> Revelar Significado y Contexto
          </button>
        ` : `
          <div class="w-full bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/80 mb-4 animate-fadeIn">
            <span class="text-[10px] uppercase font-bold text-teal-800 tracking-wide block mb-0.5">Significado Directo:</span>
            <p class="text-base font-bold text-teal-950">${card.meaning}</p>
          </div>

          <p class="text-[11px] text-slate-500 mb-2 font-medium">¿Cómo sentiste la retención activa?</p>
          <div class="grid grid-cols-3 gap-2 w-full">
            <button onclick="rateSrsCard(1)" class="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold transition">
              🔴 Difícil
            </button>
            <button onclick="rateSrsCard(2)" class="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold transition">
              🟡 Bueno
            </button>
            <button onclick="rateSrsCard(3)" class="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold transition">
              🟢 Fácil (+5💎)
            </button>
          </div>
        `}
      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
}

function toggleNativeOnlyFilter() {
  state.dictFilterNativeOnly = !state.dictFilterNativeOnly;
  applyDictFilters();
}

function searchDictionary(val) {
  state.dictSearchTerm = val.toLowerCase().trim();
  applyDictFilters();
  const input = document.getElementById('dict-search-input');
  if (input) {
    input.focus();
    input.selectionStart = input.selectionEnd = input.value.length;
  }
}

function applyDictFilters() {
  let list = state.dictionary;
  
  if (state.dictSearchTerm) {
    list = list.filter(item => 
      item.spanish.toLowerCase().includes(state.dictSearchTerm) ||
      item.embera.toLowerCase().includes(state.dictSearchTerm)
    );
  }

  if (state.dictFilterNativeOnly) {
    list = list.filter(item => {
      const clean = item.embera.toLowerCase().replace(/[¿?¡!.,]/g, '').trim();
      return state.nativeLexicon[clean] || Object.keys(state.nativeLexicon).some(k => clean.includes(k));
    });
  }

  state.filteredDict = list;
  renderDictionaryTab();
}

// ==========================================
// UTILITIES
// ==========================================
function playNativeAudio(file, start, end, speed = 1.0) {
  audioMgr.play(file, start, end, speed);
}

function playNativeWord(word, speed = 1.0) {
  const clean = word.toLowerCase().replace(/[¿?¡!.,]/g, '').trim();
  
  if (state.nativeLexicon[clean]) {
    const c = state.nativeLexicon[clean];
    audioMgr.play(c.file, c.start, c.end, speed);
    return;
  }

  const matchedKey = Object.keys(state.nativeLexicon).find(k => clean.includes(k) || k.includes(clean));
  if (matchedKey) {
    const c = state.nativeLexicon[matchedKey];
    audioMgr.play(c.file, c.start, c.end, speed);
    return;
  }

  // NO robotic TTS: Open the Native Phonetic Articulation Guide
  showNativePhoneticGuide(word);
}

function showNativePhoneticGuide(word) {
  const modal = document.getElementById('phonetic-guide-modal');
  if (!modal) return;

  document.getElementById('guide-word').innerText = word;
  
  let phonemesFound = [];
  if (word.includes('ɓ')) phonemesFound.push({ char: 'ɓ', name: 'Implosiva bilabial', sample: 'ɓʉsriɗa', hint: 'Golpe suave hacia adentro con los labios cerrados' });
  if (word.includes('ɗ')) phonemesFound.push({ char: 'ɗ', name: 'Implosiva alveolar', sample: 'beɗea', hint: 'Retracción suave de la punta de la lengua en el paladar' });
  if (word.includes('ʉ')) phonemesFound.push({ char: 'ʉ', name: 'Vocal central cerrada', sample: 'ɓʉsriɗa', hint: 'Pronuncia entre la U y la I sin redondear los labios' });
  if (/[ãẽĩõũʉ̃]/.test(word)) phonemesFound.push({ char: 'Nasales (ã/õ/ũ)', name: 'Resonancia nasal', sample: 'ãcõrẽ', hint: 'Expulsión continua de aire por la cavidad nasal' });

  const container = document.getElementById('guide-phonemes-list');
  if (phonemesFound.length > 0) {
    container.innerHTML = phonemesFound.map(p => `
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 flex items-center justify-between">
        <div>
          <span class="text-xs font-extrabold text-teal-800 font-embera">${p.char} - ${p.name}</span>
          <p class="text-[11px] text-slate-600 mt-0.5">${p.hint}</p>
        </div>
        <button onclick="playNativeWord('${p.sample}', 0.7)" class="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-xs">
          <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Oír en "${p.sample}"
        </button>
      </div>
    `).join('');
  } else {
    container.innerHTML = `
      <p class="text-xs text-slate-600 italic">Sigue la fonética regular descrita en el Manual de 15 años. Para familiarizarte con el tono, escucha los audios de estudio arriba.</p>
      <div class="mt-2 flex justify-center">
        <button onclick="playNativeWord('beɗea', 1.0)" class="px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
          <i data-lucide="volume-2" class="w-4 h-4"></i> Escuchar Tono Modelo ("Beɗea")
        </button>
      </div>
    `;
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closePhoneticGuideModal() {
  const modal = document.getElementById('phonetic-guide-modal');
  if (modal) modal.classList.add('hidden');
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

function formatTime(secs) {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function escapeStr(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function toggleGhostPrompter() {
  state.showGhostPrompter = !state.showGhostPrompter;
  renderDialogueTab();
}

function setDictViewMode(mode) {
  state.dictViewMode = mode;
  state.srsCardFlipped = false;
  renderDictionaryTab();
}

function flipSrsCard() {
  state.srsCardFlipped = !state.srsCardFlipped;
  renderDictionaryTab();
}

function rateSrsCard(quality) {
  // FSRS Rating: 1 = Hard, 2 = Good, 3 = Easy
  if (quality === 3) {
    state.gems += 5;
    playSound('correct');
  } else if (quality === 2) {
    state.gems += 2;
  }
  state.srsCardFlipped = false;
  state.srsCardIndex = (state.srsCardIndex + 1) % state.vaultCards.length;
  renderDictionaryTab();
  updateStats();
}
