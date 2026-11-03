import {
  animate,
  createTimeline,
  onScroll,
  splitText,
  stagger,
  svg,
  utils,
  type AnimationParams,
  type Target,
  type Timeline,
} from "animejs";
import { flushSync } from "react-dom";
import { prefersReducedMotion, type MotionSetup } from "./useLandingMotion";

// Landing and login page motion: subtle, short distances, soft deceleration.
// Only transform and opacity are animated, so nothing shifts the layout.

const EASE = "outQuart";
// Scroll reveals start once the trigger's top reaches 85% of the viewport.
const ENTER = "85% top";
const LOGIN_ITEM = "[data-anim=login-item]";

const frenchNumber = new Intl.NumberFormat("fr-FR");

const all = (root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector));

// Both helpers skip empty target lists (e.g. a part missing on mobile).

/** Applies the starting state of an animation right away. */
function set(targets: Target[], params: AnimationParams) {
  if (targets.length) utils.set(targets, params);
}

/** Wraps SVG lines so their stroke can be drawn with the `draw` property. */
function drawable(elements: HTMLElement[]) {
  return elements.length ? svg.createDrawable(elements) : [];
}

function addTo(
  tl: Timeline,
  targets: Target[],
  params: AnimationParams,
  position: number,
) {
  if (targets.length) tl.add(targets, params, position);
}

/**
 * Plays `tickable` the first time `trigger` scrolls into view, or right away
 * if it already is. Unlike the default scroll sync, it never pauses when the
 * trigger leaves the viewport and never replays.
 */
function playOnEnter(trigger: Element, tickable: { play: () => unknown }) {
  let played = false;
  onScroll({
    target: trigger,
    enter: ENTER,
    onEnter: () => {
      if (played) return;
      played = true;
      tickable.play();
    },
  });
}

/** Hero: headline words rise in one after another, then the text and CTAs. */
export const heroIntro: MotionSetup = (root) => {
  const words = all(root, "[data-anim=headline]").flatMap(
    (line) => splitText(line, { words: true }).words as HTMLElement[],
  );
  const subtitle = all(root, "[data-anim=subtitle]");
  const ctas = all(root, "[data-anim=ctas] > *");

  set(words, { opacity: 0, y: "0.35em" });
  set([...subtitle, ...ctas], { opacity: 0, y: 14 });

  const tl = createTimeline({ defaults: { ease: EASE, duration: 900 } });
  addTo(tl, words, { opacity: 1, y: 0, delay: stagger(45) }, 0);
  addTo(tl, subtitle, { opacity: 1, y: 0 }, 450);
  addTo(tl, ctas, { opacity: 1, y: 0, delay: stagger(90) }, 600);
};

/**
 * Dashboard preview: the frame slides up, cards or rows follow, then the
 * sparklines and the BTC chart draw themselves and the live dot appears.
 */
export const previewIntro: MotionSetup = (root) => {
  // Desktop and mobile previews are both in the DOM; animate the visible one.
  const frame = all(root, "[data-anim^=preview-]").find(
    (el) => el.getClientRects().length > 0,
  );
  if (!frame) return;

  const items = all(frame, "[data-anim=card], [data-anim=row]");
  const sparks = drawable(all(frame, "[data-anim=spark]"));
  const line = drawable(all(frame, "[data-anim=chart-line]"));
  const fills = all(frame, "[data-anim=spark-area], [data-anim=chart-area]");
  const dot = all(frame, "[data-anim=live-dot]");

  set([frame], { opacity: 0, y: 40 });
  set(items, { opacity: 0, y: 14 });
  set([...sparks, ...line], { draw: "0 0" });
  set(fills, { opacity: 0 });
  set(dot, { opacity: 0, scale: 0 });

  const tl = createTimeline({
    autoplay: false,
    delay: 300,
    defaults: { ease: EASE, duration: 800 },
  });
  addTo(tl, [frame], { opacity: 1, y: 0, duration: 1100, ease: "outExpo" }, 0);
  addTo(tl, items, { opacity: 1, y: 0, delay: stagger(70) }, 200);
  addTo(
    tl,
    sparks,
    { draw: "0 1", duration: 900, ease: "inOutSine", delay: stagger(70) },
    400,
  );
  addTo(tl, line, { draw: "0 1", duration: 1600, ease: "inOutSine" }, 450);
  addTo(tl, fills, { opacity: 1, duration: 1000 }, 900);
  addTo(tl, dot, { opacity: 1, scale: 1, duration: 500, ease: "outBack" }, 1950);
  playOnEnter(frame, tl);
};

/** Partner logos fade in one after another, back to their resting opacity. */
export const partnersReveal: MotionSetup = (root) => {
  const logos = all(root, "img");
  if (!logos.length) return;
  // Read before hiding: the resting opacity comes from the logo's class.
  const opacity = Number(getComputedStyle(logos[0]).opacity) || 1;

  set(logos, { opacity: 0, y: 10 });
  playOnEnter(
    root,
    animate(logos, {
      opacity,
      y: 0,
      ease: EASE,
      duration: 800,
      delay: stagger(70),
      autoplay: false,
    }),
  );
};

/** Beta band: content fades up, the progress bar fills, the count rises. */
export const betaReveal: MotionSetup = (root) => {
  const blocks = all(
    root,
    "[data-anim=beta-title], [data-anim=beta-countdown], [data-anim=beta-progress]",
  );
  const fill = all(root, "[data-anim=beta-fill]");
  const count = root.querySelector<HTMLElement>("[data-anim=beta-count]");
  const total = Number(count?.dataset.value);

  set(blocks, { opacity: 0, y: 16 });
  set(fill, { scaleX: 0 });

  const tl = createTimeline({
    autoplay: false,
    defaults: { ease: EASE, duration: 800 },
  });
  addTo(tl, blocks, { opacity: 1, y: 0, delay: stagger(110) }, 0);
  addTo(tl, fill, { scaleX: 1, duration: 1400, ease: "inOutQuart" }, 350);

  if (count && Number.isFinite(total)) {
    const counter = { value: 0 };
    count.textContent = frenchNumber.format(0);
    tl.add(
      counter,
      {
        value: total,
        duration: 1400,
        ease: "inOutQuart",
        onUpdate: () => {
          count.textContent = frenchNumber.format(Math.round(counter.value));
        },
      },
      350,
    );
  }
  playOnEnter(root, tl);
};

/** Features: the intro, then each item as it scrolls in (rule, number, text). */
export const featuresReveal: MotionSetup = (root) => {
  const intro = all(root, "[data-anim=intro]");
  set(intro, { opacity: 0, y: 16 });
  const introTl = createTimeline({ autoplay: false });
  addTo(
    introTl,
    intro,
    { opacity: 1, y: 0, ease: EASE, duration: 800, delay: stagger(90) },
    0,
  );
  playOnEnter(root, introTl);

  for (const item of all(root, "[data-anim=feature]")) {
    const rule = all(item, "[data-anim=rule]");
    const parts = all(item, ":scope > :not([data-anim=rule])");

    set(rule, { scaleX: 0 });
    set(parts, { opacity: 0, y: 16 });

    const tl = createTimeline({
      autoplay: false,
      defaults: { ease: EASE, duration: 800 },
    });
    addTo(tl, rule, { scaleX: 1, duration: 1000, ease: "inOutQuart" }, 0);
    addTo(tl, parts, { opacity: 1, y: 0, delay: stagger(80) }, 150);
    playOnEnter(item, tl);
  }
};

/** Contact: rule, text column, then the card and its stack tags. */
export const contactReveal: MotionSetup = (root) => {
  const rule = all(root, ":scope > [data-anim=rule]");
  const intro = all(root, "[data-anim=contact-intro] > *");
  const card = all(root, "[data-anim=contact-card]");
  const tags = all(root, "[data-anim=contact-card] .n-tag");

  set(rule, { scaleX: 0 });
  set(intro, { opacity: 0, y: 16 });
  set(card, { opacity: 0, y: 24 });
  set(tags, { opacity: 0, scale: 0.9 });

  const tl = createTimeline({
    autoplay: false,
    defaults: { ease: EASE, duration: 800 },
  });
  addTo(tl, rule, { scaleX: 1, duration: 1000, ease: "inOutQuart" }, 0);
  addTo(tl, intro, { opacity: 1, y: 0, delay: stagger(70) }, 100);
  addTo(tl, card, { opacity: 1, y: 0, duration: 900 }, 300);
  addTo(tl, tags, { opacity: 1, scale: 1, duration: 500, delay: stagger(30) }, 650);
  playOnEnter(root, tl);
};

/** Login form: quick, so it never gets in the way of typing. */
export const loginFormIntro: MotionSetup = (root) => {
  const items = all(root, LOGIN_ITEM);
  set(items, { opacity: 0, y: 12 });
  animate(items, {
    opacity: 1,
    y: 0,
    ease: EASE,
    duration: 550,
    delay: stagger(35),
  });
};

/** Login showcase: title, favorites card and its rows, sparklines, then perks. */
export const loginShowcaseIntro: MotionSetup = (root) => {
  // The panel is hidden below lg: nothing to play, nothing to measure.
  if (!root.getClientRects().length) return;

  const words = all(root, "[data-anim=headline]").flatMap(
    (line) => splitText(line, { words: true }).words as HTMLElement[],
  );
  const card = all(root, "[data-anim=card]");
  const rows = all(root, "[data-anim=row]");
  const sparks = drawable(all(root, "[data-anim=spark]"));
  const perks = all(root, "[data-anim=perk]");

  set(words, { opacity: 0, y: "0.35em" });
  set(card, { opacity: 0, y: 24 });
  set(rows, { opacity: 0, y: 10 });
  set(sparks, { draw: "0 0" });
  set(perks, { opacity: 0, y: 12 });

  const tl = createTimeline({ defaults: { ease: EASE, duration: 800 } });
  addTo(tl, words, { opacity: 1, y: 0, delay: stagger(45) }, 100);
  addTo(tl, card, { opacity: 1, y: 0, duration: 900 }, 300);
  addTo(tl, rows, { opacity: 1, y: 0, delay: stagger(70) }, 450);
  addTo(
    tl,
    sparks,
    { draw: "0 1", duration: 900, ease: "inOutSine", delay: stagger(70) },
    550,
  );
  addTo(tl, perks, { opacity: 1, y: 0, delay: stagger(90) }, 800);
};

/**
 * Applies a state change that rearranges the login form (switching tab) without
 * the jump: what stays slides over from its old position, what's new fades in.
 * `update` sets the React state; it's flushed here to measure the new layout.
 */
export function slideLoginForm(root: HTMLElement | null, update: () => void) {
  if (!root || prefersReducedMotion()) {
    update();
    return;
  }

  const tops = new Map(
    all(root, LOGIN_ITEM).map((el) => [el, el.getBoundingClientRect().top]),
  );
  flushSync(update);

  const moved: HTMLElement[] = [];
  const entering: HTMLElement[] = [];
  for (const el of all(root, LOGIN_ITEM)) {
    const top = tops.get(el);
    if (top === undefined) {
      entering.push(el);
      continue;
    }
    // Clear any slide still running, to measure the real new position.
    el.style.transform = "";
    const offset = top - el.getBoundingClientRect().top;
    if (Math.abs(offset) < 1) continue;
    utils.set(el, { y: offset });
    moved.push(el);
  }

  if (moved.length) animate(moved, { y: 0, ease: EASE, duration: 400 });
  if (entering.length) {
    // Starts a bit later, once its neighbours have moved out of the way.
    utils.set(entering, { opacity: 0, y: 8 });
    animate(entering, {
      opacity: 1,
      y: 0,
      ease: EASE,
      duration: 400,
      delay: 100,
    });
  }
}
