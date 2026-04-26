const stage = document.querySelector("#stage");
const pack = document.querySelector("#pack");
const packArea = document.querySelector("#packArea");
const cardsArea = document.querySelector("#cardsArea");
const cardStack = document.querySelector("#cardStack");
const cards = [...document.querySelectorAll(".card")];

let opened = false;
let tear = 0;
let tearDrag = null;
let cardDrag = null;
let activeIndex = 0;
let cardExitDirections = cards.map(() => -1);
let orientationActive = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

function updatePackReflection(event) {
  if (opened) return;
  const rect = pack.getBoundingClientRect();
  const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  pack.style.setProperty("--mx", `${(xRatio * 100).toFixed(1)}%`);
  pack.style.setProperty("--my", `${(yRatio * 100).toFixed(1)}%`);
  if (!orientationActive) {
    pack.style.setProperty("--tilt-y", `${((xRatio - 0.5) * 64).toFixed(2)}deg`);
    pack.style.setProperty("--tilt-x", `${((0.5 - yRatio) * 10).toFixed(2)}deg`);
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
  pack.style.setProperty("--tilt-y", `${(gamma * 1.12).toFixed(2)}deg`);
  pack.style.setProperty("--tilt-x", `${(-beta * 0.28).toFixed(2)}deg`);
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
  cards.forEach((card, index) => {
    const depth = index - activeIndex;
    const isTopCard = depth === 0;
    const isInDeck = depth >= 0;
    const archived = depth < 0;
    const visibleDepth = clamp(depth, 0, 4);

    let x = visibleDepth * 16;
    let y = visibleDepth * -10;
    let scale = 1 - visibleDepth * 0.045;
    let rotate = visibleDepth * -3.2;
    let opacity = isInDeck ? 1 - visibleDepth * 0.1 : 0;
    let z = cards.length - visibleDepth;

    if (isTopCard) {
      x = dragX;
      y = Math.abs(dragX) * 0.035;
      rotate = dragX * 0.035;
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
  };

  pack.classList.add("cutting");
  setTear(point);
  pack.setPointerCapture(event.pointerId);
});

pack.addEventListener("pointermove", (event) => {
  updatePackReflection(event);
  if (!tearDrag || event.pointerId !== tearDrag.pointerId || opened) return;
  const point = pointerInPack(event);
  tearDrag.hasMoved = Math.abs(event.clientX - tearDrag.startX) > 8;
  tearDrag.y = point.y;
  setTear(point);
});

function finishTear(event) {
  if (!tearDrag || event.pointerId !== tearDrag.pointerId) return;
  const shouldOpen = tear > 0.78 && tearDrag.hasMoved && event.clientX > tearDrag.startX;
  pack.classList.remove("cutting");

  if (shouldOpen) {
    openPack();
  } else {
    setTear({ x: 0, y: tearDrag.y });
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

resetPack();
