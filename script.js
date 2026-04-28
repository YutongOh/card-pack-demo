const stage = document.querySelector("#stage");
const pack = document.querySelector("#pack");
const packArea = document.querySelector("#packArea");
const cardsArea = document.querySelector("#cardsArea");
const cardStack = document.querySelector("#cardStack");
let cards = [];
const mobileMedia = window.matchMedia("(max-width: 820px), (pointer: coarse)");

const CARD_DATA = [
  {
    word: "commute",
    phonetic: "/kəˈmjuːt/",
    scene: "Morning train ride to work",
    label: "Transit",
    accent: "#63d6ff",
    secondary: "#8368ff",
    glow: "rgba(99, 214, 255, 0.34)",
    lines: [
      "I commute by subway every weekday morning.",
      "Her commute gets longer when it rains.",
      "He listens to podcasts during his commute.",
    ],
  },
  {
    word: "order",
    phonetic: "/ˈɔːr.dɚ/",
    scene: "Speaking to a cafe cashier",
    label: "Cafe",
    accent: "#ffb54d",
    secondary: "#ff7a91",
    glow: "rgba(255, 181, 77, 0.34)",
    lines: [
      "I'd like to order an iced latte, please.",
      "She ordered a salad for lunch.",
      "We usually order takeout on Friday nights.",
    ],
  },
  {
    word: "charge",
    phonetic: "/tʃɑːrdʒ/",
    scene: "Plugging in a phone at a desk",
    label: "Tech",
    accent: "#62f0d9",
    secondary: "#3a8fff",
    glow: "rgba(98, 240, 217, 0.32)",
    lines: [
      "My phone needs to charge before class.",
      "Can I charge my laptop here for a while?",
      "He forgot to charge his earbuds last night.",
    ],
  },
  {
    word: "receipt",
    phonetic: "/rɪˈsiːt/",
    scene: "Checking out at a grocery store",
    label: "Shopping",
    accent: "#ffd364",
    secondary: "#7f7cff",
    glow: "rgba(255, 211, 100, 0.3)",
    lines: [
      "Please keep the receipt in case you need a return.",
      "She looked at the receipt after paying.",
      "The cashier asked if I wanted a paper receipt.",
    ],
  },
  {
    word: "borrow",
    phonetic: "/ˈbɑːr.oʊ/",
    scene: "Asking a classmate for help",
    label: "School",
    accent: "#ff8cb3",
    secondary: "#7f6dff",
    glow: "rgba(255, 140, 179, 0.32)",
    lines: [
      "Can I borrow your pen for a minute?",
      "He borrowed a book from the library.",
      "She asked to borrow my umbrella after lunch.",
    ],
  },
  {
    word: "schedule",
    phonetic: "/ˈskedʒ.uːl/",
    scene: "Looking at plans on a calendar",
    label: "Planning",
    accent: "#6fe3ff",
    secondary: "#41c7a9",
    glow: "rgba(111, 227, 255, 0.32)",
    lines: [
      "My schedule is full this afternoon.",
      "Let's check the meeting schedule again.",
      "She changed her study schedule for the exam week.",
    ],
  },
  {
    word: "grocery",
    phonetic: "/ˈɡroʊ.sɚ.i/",
    scene: "Carrying bags home after shopping",
    label: "Home",
    accent: "#8ae16d",
    secondary: "#4aa8ff",
    glow: "rgba(138, 225, 109, 0.3)",
    lines: [
      "We need to buy groceries after work.",
      "He made a grocery list before leaving home.",
      "She stopped by the grocery store for fruit.",
    ],
  },
  {
    word: "neighbor",
    phonetic: "/ˈneɪ.bɚ/",
    scene: "Meeting someone in the hallway",
    label: "Community",
    accent: "#ffb28a",
    secondary: "#ff6f9d",
    glow: "rgba(255, 178, 138, 0.3)",
    lines: [
      "Our neighbor brought us homemade cookies.",
      "I ran into my neighbor in the elevator.",
      "She waved to her neighbor across the street.",
    ],
  },
  {
    word: "delay",
    phonetic: "/dɪˈleɪ/",
    scene: "Waiting at the station platform",
    label: "Travel",
    accent: "#89b6ff",
    secondary: "#61e5ff",
    glow: "rgba(137, 182, 255, 0.32)",
    lines: [
      "The train was delayed by twenty minutes.",
      "Sorry for the delay in my reply.",
      "Bad weather caused a flight delay this morning.",
    ],
  },
  {
    word: "appointment",
    phonetic: "/əˈpɔɪnt.mənt/",
    scene: "Checking time before a visit",
    label: "Routine",
    accent: "#d492ff",
    secondary: "#ff83c7",
    glow: "rgba(212, 146, 255, 0.3)",
    lines: [
      "I have a dentist appointment at three.",
      "She wrote the appointment in her planner.",
      "He arrived early for his doctor appointment.",
    ],
  },
  {
    word: "reusable",
    phonetic: "/riːˈjuː.zə.bəl/",
    scene: "Packing a bag before shopping",
    label: "Eco",
    accent: "#5fe1c1",
    secondary: "#7fa0ff",
    glow: "rgba(95, 225, 193, 0.32)",
    lines: [
      "I keep a reusable bag in my backpack.",
      "She bought a reusable bottle for school.",
      "Using reusable items helps reduce waste.",
    ],
  },
  {
    word: "crowded",
    phonetic: "/ˈkraʊ.dɪd/",
    scene: "Standing in a busy food court",
    label: "Busy",
    accent: "#ff8c74",
    secondary: "#ffcf5e",
    glow: "rgba(255, 140, 116, 0.32)",
    lines: [
      "The bus is always crowded after school.",
      "It gets crowded around the station at six.",
      "We left early because the cafe became crowded.",
    ],
  },
];

let opened = false;
let tear = 0;
let tearDrag = null;
let cardDrag = null;
let activeIndex = 0;
let cardExitDirections = cards.map(() => -1);
let orientationActive = false;
let audioContext = null;
let noiseBuffer = null;
let audioUnlocked = false;
const packOpenAudio = new Audio("./assets/pack-open.wav");
packOpenAudio.preload = "auto";
packOpenAudio.playsInline = true;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function syncDeviceClass() {
  document.body.classList.toggle("mobile-lite", mobileMedia.matches);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCards() {
  cardStack.innerHTML = CARD_DATA.map((card, index) => {
    const lines = card.lines
      .map((line) => `<li class="card-line">${escapeHtml(line)}</li>`)
      .join("");

    return `
      <article
        class="card"
        data-word="${escapeHtml(card.word)}"
        style="
          --card-accent: ${card.accent};
          --card-secondary: ${card.secondary};
          --card-glow: ${card.glow};
        "
      >
        <div class="card-glass"></div>
        <div class="card-shell">
          <header class="card-hero">
            <div class="card-hero-grid"></div>
            <div class="card-hero-orb"></div>
            <div class="card-hero-badge">${String(index + 1).padStart(2, "0")}</div>
            <div class="card-hero-scene">${escapeHtml(card.scene)}</div>
            <div class="card-hero-label">${escapeHtml(card.label)}</div>
            <div class="card-hero-figure">
              <span class="card-hero-head"></span>
              <span class="card-hero-body"></span>
              <span class="card-hero-prop"></span>
            </div>
          </header>
          <section class="card-copy">
            <div class="card-word-row">
              <h2 class="card-word">${escapeHtml(card.word)}</h2>
              <div class="card-phonetic">${escapeHtml(card.phonetic)}</div>
            </div>
            <ol class="card-lines">${lines}</ol>
          </section>
        </div>
      </article>
    `;
  }).join("");

  cards = [...document.querySelectorAll(".card")];
  cardExitDirections = cards.map(() => -1);
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) {
    audioContext = new AudioCtor();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  if (!noiseBuffer) {
    const length = Math.floor(audioContext.sampleRate * 1.4);
    noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / length * 0.18);
    }
  }
  return audioContext;
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  ensureAudio();
  packOpenAudio.muted = true;
  const maybePlay = packOpenAudio.play();
  if (maybePlay && typeof maybePlay.then === "function") {
    maybePlay
      .then(() => {
        packOpenAudio.pause();
        packOpenAudio.currentTime = 0;
        packOpenAudio.muted = false;
      })
      .catch(() => {
        packOpenAudio.muted = false;
        audioUnlocked = false;
      });
    return;
  }
  packOpenAudio.pause();
  packOpenAudio.currentTime = 0;
  packOpenAudio.muted = false;
}

function createNoiseSource() {
  const ctx = ensureAudio();
  if (!ctx || !noiseBuffer) return null;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  return { ctx, source };
}

function playPackOpenSound() {
  packOpenAudio.muted = false;
  packOpenAudio.pause();
  packOpenAudio.currentTime = 0;
  packOpenAudio.play().catch(() => {});
}

function playCardSwipeSound(offset) {
  if (mobileMedia.matches) return;
  const ctx = ensureAudio();
  if (!ctx) return;

  const noise = createNoiseSource();
  if (noise) {
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(980, ctx.currentTime);
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.042, ctx.currentTime + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    noise.source.playbackRate.value = 1.08;
    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.source.start();
    noise.source.stop(ctx.currentTime + 0.14);
  }

  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = "sine";
  click.frequency.setValueAtTime(460 + Math.min(Math.abs(offset) * 0.8, 120), ctx.currentTime);
  click.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.07);
  clickGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  clickGain.gain.linearRampToValueAtTime(0.009, ctx.currentTime + 0.01);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  click.start();
  click.stop(ctx.currentTime + 0.09);

  const whoosh = ctx.createOscillator();
  const whooshGain = ctx.createGain();
  whoosh.type = "triangle";
  whoosh.frequency.setValueAtTime(180, ctx.currentTime);
  whoosh.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.065);
  whooshGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  whooshGain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 0.018);
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
  whoosh.connect(whooshGain);
  whooshGain.connect(ctx.destination);
  whoosh.start();
  whoosh.stop(ctx.currentTime + 0.12);
}

function pointerInPack(event) {
  const rect = pack.getBoundingClientRect();
  return {
    x: clamp(event.clientX - rect.left, 0, rect.width),
    y: clamp(event.clientY - rect.top, 10, rect.height - 10),
    width: rect.width,
    height: rect.height,
  };
}

function setTear(point) {
  const width = point.width || pack.getBoundingClientRect().width;
  tear = clamp(point.x / width, 0, 1);
  pack.style.setProperty("--tear", tear.toFixed(3));
  pack.style.setProperty("--cut-x", `${point.x.toFixed(1)}px`);
  pack.style.setProperty("--cut-y", `${point.y.toFixed(1)}px`);
}

function setGuideY(y) {
  pack.style.setProperty("--cut-y", `${y.toFixed(1)}px`);
}

function updatePackReflection(event) {
  if (opened) return;
  const rect = pack.getBoundingClientRect();
  const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  pack.style.setProperty("--mx", `${(xRatio * 100).toFixed(1)}%`);
  pack.style.setProperty("--my", `${(yRatio * 100).toFixed(1)}%`);
  if (!orientationActive) {
    const yaw = (xRatio - 0.5) * 30;
    const pitch = (0.5 - yRatio) * 8;
    pack.style.setProperty("--tilt-y", `${yaw.toFixed(2)}deg`);
    pack.style.setProperty("--tilt-x", `${pitch.toFixed(2)}deg`);
  }
}

function resetPackReflection() {
  pack.style.setProperty("--mx", "50%");
  pack.style.setProperty("--my", "42%");
  pack.style.setProperty("--tilt-x", "0deg");
  pack.style.setProperty("--tilt-y", "0deg");
}

function updatePackOrientation(event) {
  if (opened || event.gamma == null) return;
  orientationActive = true;
  const gamma = clamp(event.gamma, -38, 38);
  const beta = clamp(event.beta ?? 0, -20, 28);
  const yaw = gamma * 0.8;
  pack.style.setProperty("--tilt-y", `${yaw.toFixed(2)}deg`);
  pack.style.setProperty("--tilt-x", `${(-beta * 0.24).toFixed(2)}deg`);
  pack.style.setProperty("--mx", `${clamp(50 + gamma * 1.1, 8, 92).toFixed(1)}%`);
  pack.style.setProperty("--my", `${clamp(44 + beta * 0.42, 18, 82).toFixed(1)}%`);
}

function requestDeviceOrientation() {
  const DeviceOrientation = window.DeviceOrientationEvent;
  if (!DeviceOrientation || typeof DeviceOrientation.requestPermission !== "function") return;
  DeviceOrientation.requestPermission().catch(() => {});
}

function resetPack() {
  opened = false;
  activeIndex = 0;
  cardExitDirections = cards.map(() => -1);
  tearDrag = null;
  cardDrag = null;
  pack.className = "pack";
  packArea.classList.remove("gone");
  cardsArea.classList.remove("revealed");
  resetPackReflection();
  setTear({ x: 0, y: pack.getBoundingClientRect().height * 0.47 });
  updateCards();
}

function burst() {
  const node = document.createElement("div");
  node.className = "burst";
  stage.append(node);
  node.addEventListener("animationend", () => node.remove(), { once: true });
}

function openPack() {
  if (opened) return;
  opened = true;
  playPackOpenSound();
  const rect = pack.getBoundingClientRect();
  setTear({ x: rect.width, y: tearDrag?.y ?? rect.height * 0.47, width: rect.width });
  burst();
  pack.classList.add("split");

  window.setTimeout(() => {
    packArea.classList.add("gone");
  }, 720);

  window.setTimeout(() => {
    cardsArea.classList.add("revealed");
    updateCards();
  }, 360);
}

function updateCards(dragX = 0, dragging = false) {
  const compactStack = mobileMedia.matches;
  cards.forEach((card, index) => {
    const depth = index - activeIndex;
    const isTopCard = depth === 0;
    const isInDeck = depth >= 0;
    const archived = depth < 0;
    const visibleDepth = clamp(depth, 0, compactStack ? 2 : 4);

    let x = visibleDepth * (compactStack ? 12 : 16);
    let y = visibleDepth * (compactStack ? -7 : -10);
    let scale = 1 - visibleDepth * (compactStack ? 0.038 : 0.045);
    let rotate = visibleDepth * (compactStack ? -2.2 : -3.2);
    let opacity = isInDeck ? 1 - visibleDepth * (compactStack ? 0.14 : 0.1) : 0;
    let z = cards.length - visibleDepth;

    if (isTopCard) {
      x = dragX;
      y = Math.abs(dragX) * (compactStack ? 0.024 : 0.035);
      rotate = dragX * (compactStack ? 0.026 : 0.035);
      scale = 1;
      opacity = 1;
      z = cards.length + 2;
    }

    if (archived) {
      const archivedDepth = Math.abs(depth);
      const exitDirection = cardExitDirections[index] || -1;
      x = exitDirection * (230 + archivedDepth * 44);
      y = 34 + archivedDepth * 18;
      scale = 0.78;
      rotate = exitDirection * (22 + archivedDepth * 7);
      z = 0;
    }

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    card.style.setProperty("--scale", Math.max(0.7, scale).toFixed(3));
    card.style.setProperty("--rotate", `${rotate}deg`);
    card.style.setProperty("--z", `${z}`);
    card.style.setProperty("--opacity", opacity.toFixed(3));
    card.classList.toggle("dragging", dragging && isTopCard);
    card.classList.toggle("active", isTopCard);
    card.classList.toggle("behind", depth > 0);
    card.classList.toggle("archived", archived);
  });
}

pack.addEventListener("pointerdown", (event) => {
  if (opened) return;
  unlockAudio();
  requestDeviceOrientation();
  updatePackReflection(event);
  const point = pointerInPack(event);

  tearDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startPackX: point.x,
    y: point.y,
    hasMoved: false,
    cutting: false,
  };

  setGuideY(point.y);
  pack.setPointerCapture(event.pointerId);
});

pack.addEventListener("pointermove", (event) => {
  updatePackReflection(event);
  if (!tearDrag || event.pointerId !== tearDrag.pointerId || opened) return;
  const point = pointerInPack(event);
  const deltaX = event.clientX - tearDrag.startX;
  tearDrag.hasMoved = Math.abs(event.clientX - tearDrag.startX) > 8;
  tearDrag.y = point.y;

  if (deltaX > 14) {
    if (!tearDrag.cutting) {
      tearDrag.cutting = true;
      pack.classList.add("cutting");
    }
    setTear(point);
  } else {
    setGuideY(point.y);
  }
});

function finishTear(event) {
  if (!tearDrag || event.pointerId !== tearDrag.pointerId) return;
  const shouldOpen = tearDrag.cutting && tear > 0.78 && tearDrag.hasMoved && event.clientX > tearDrag.startX;
  pack.classList.remove("cutting");

  if (shouldOpen) {
    openPack();
  } else {
    tear = 0;
    pack.style.setProperty("--tear", "0");
    pack.style.setProperty("--cut-x", "0px");
    setGuideY(tearDrag.y);
  }

  tearDrag = null;
}

pack.addEventListener("pointerup", finishTear);
pack.addEventListener("pointercancel", finishTear);
pack.addEventListener("pointerleave", () => {
  if (!tearDrag && !orientationActive) resetPackReflection();
});

window.addEventListener("deviceorientation", updatePackOrientation);

cardStack.addEventListener("pointerdown", (event) => {
  if (!opened) return;
  unlockAudio();
  const topCard = cards[activeIndex];
  if (topCard && event.target.closest(".card") !== topCard) return;

  cardDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    lastX: 0,
  };
  cardStack.setPointerCapture(event.pointerId);
});

cardStack.addEventListener("pointermove", (event) => {
  if (!cardDrag || event.pointerId !== cardDrag.pointerId) return;
  const raw = event.clientX - cardDrag.startX;
  const noNextCard = activeIndex === cards.length - 1;
  const offset = raw * (noNextCard ? 0.28 : 1);
  cardDrag.lastX = offset;
  updateCards(offset, true);
});

function finishCardDrag(event) {
  if (!cardDrag || event.pointerId !== cardDrag.pointerId) return;
  const offset = cardDrag.lastX;
  cardDrag = null;
  const shouldAdvance = Math.abs(offset) > 74 && activeIndex < cards.length - 1;

  if (shouldAdvance) {
    playCardSwipeSound(offset);
    cardExitDirections[activeIndex] = offset >= 0 ? 1 : -1;
    activeIndex += 1;
  }

  updateCards();
}

cardStack.addEventListener("pointerup", finishCardDrag);
cardStack.addEventListener("pointercancel", finishCardDrag);

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") resetPack();
});

mobileMedia.addEventListener("change", () => {
  syncDeviceClass();
  updateCards(cardDrag?.lastX ?? 0, Boolean(cardDrag));
});

syncDeviceClass();
renderCards();
resetPack();
