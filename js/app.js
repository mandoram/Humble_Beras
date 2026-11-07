import {
  AS_OF_LABEL,
  MODEL,
  SHOCK,
  ZONE_LABEL,
  brentDensity,
  brentTape,
  fallTail,
  formatDay,
  jobs,
  middleHalf,
  pathById,
  paths,
  riseTail,
  shockMap,
} from "./data.js";

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "paths", label: "Paths" },
  { id: "rise", label: "A 20% rise" },
];

const tablist = document.querySelector("#tabs");

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function parseHash() {
  const raw = (location.hash || "#today").slice(1);
  const [view, pathId] = raw.split("/");
  const known = VIEWS.some((item) => item.id === view) ? view : "today";
  return { view: known, pathId: pathId || null };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function markPosition(value, lo, hi) {
  if (hi === lo) return 0;
  return Math.min(100, Math.max(0, ((value - lo) / (hi - lo)) * 100));
}

function track(lo, hi, marks, loLabel, hiLabel) {
  const bar = el("span", { class: "track" });
  for (const mark of marks) {
    const node = el("span", {
      class: `mark ${mark.kind || ""}`,
      style: `left:${markPosition(mark.value, lo, hi)}%`,
    });
    if (mark.label) node.title = mark.label;
    bar.append(node);
  }
  return el("span", { class: "track-block" }, [
    bar,
    el("span", { class: "track-labels" }, [
      el("span", { text: loLabel }),
      el("span", { text: hiLabel }),
    ]),
  ]);
}

function payrollChart() {
  const { actual, consensusLo, consensusHi, scaleMax } = jobs;
  const zone = el("div", {
    class: "zone",
    style: `left:${markPosition(consensusLo, 0, scaleMax)}%;width:${markPosition(consensusHi, 0, scaleMax) - markPosition(consensusLo, 0, scaleMax)}%`,
  });
  const actualMark = el("span", {
    class: "mark actual",
    style: `left:${markPosition(actual, 0, scaleMax)}%`,
    title: `Actual ${jobs.actualLabel}`,
  });
  const bar = el("div", { class: "track payroll", "aria-hidden": "true" }, [zone, actualMark]);
  const ticks = el("div", { class: "axis", "aria-hidden": "true" });
  for (const tick of [0, 50, 100, 150]) {
    ticks.append(el("span", { text: String(tick), style: `left:${markPosition(tick, 0, scaleMax)}%` }));
  }
  const legendItem = (swatchClass, text) =>
    el("span", { class: "legend-item" }, [
      el("span", { class: `swatch ${swatchClass}`, "aria-hidden": "true" }),
      el("span", { text }),
    ]);
  const legend = el("div", { class: "legend" }, [
    legendItem("zone-swatch", `Consensus ${jobs.consensusLabel}`),
    legendItem("actual-swatch", "Actual 165 thousand"),
  ]);
  return el("figure", { class: "payroll-fig" }, [
    el("figcaption", { class: "sr-only", text: "Nonfarm payrolls, thousands. Consensus sits between 59 and 70. The actual print is 165." }),
    bar,
    ticks,
    el("div", { class: "axis-unit", text: "Thousands of jobs" }),
    legend,
  ]);
}

function jobsCard() {
  const rows = el("dl", { class: "pairs" });
  for (const [name, actual, consensus] of jobs.rows) {
    rows.append(
      el("div", {}, [
        el("dt", { text: name }),
        el("dd", {}, [
          el("span", { class: "pair-actual", text: actual }),
          consensus
            ? el("span", { class: "pair-vs", text: `consensus ${consensus}` })
            : el("span", { class: "pair-vs", text: "prior months" }),
        ]),
      ]),
    );
  }
  return el("article", { class: "card" }, [
    el("p", { class: "kicker", text: jobs.kicker }),
    el("h2", { text: jobs.title }),
    el("p", { class: "figure", text: jobs.actualLabel }),
    el("p", { class: "figure-caption", text: "Nonfarm payrolls, actual" }),
    payrollChart(),
    el("p", { class: "read", text: jobs.read }),
    rows,
    el("p", { class: "source", text: jobs.source }),
  ]);
}

function brentCard() {
  const five = pathById("brent-5");
  const twentyOne = pathById("brent-21");
  return el("article", { class: "card" }, [
    el("p", { class: "kicker", text: "Observatory path · still open" }),
    el("h2", { text: "Brent" }),
    el("p", { class: "figure", text: brentTape.settle }),
    el("p", { class: "figure-caption", text: `${brentTape.day} on the day (${brentTape.dayPct})` }),
    el("h3", { text: "5-day band" }),
    track(five.lo, five.hi, [{ value: five.center, kind: "center", label: "Center 0%" }], five.loLabel, five.hiLabel),
    el("h3", { text: "21-day band" }),
    track(
      twentyOne.lo,
      twentyOne.hi,
      [{ value: twentyOne.center, kind: "center", label: "Center 0%" }],
      twentyOne.loLabel,
      twentyOne.hiLabel,
    ),
    el("p", { class: "read", text: pathById("brent-5").note }),
    el("p", { class: "read", text: brentTape.week }),
    el("p", { class: "source", text: brentTape.source }),
  ]);
}

function renderToday() {
  return el("div", { class: "today" }, [
    el("header", { class: "lead-block" }, [
      el("h1", { class: "lead", text: "One print landed. It was not on this sheet." }),
      el("p", {
        class: "dek",
        text: "October employment beat the Street consensus. The eight Observatory paths are still unsettled, without a print today, or waiting on a later cutoff.",
      }),
    ]),
    el("div", { class: "today-grid" }, [jobsCard(), brentCard()]),
  ]);
}

function renderPaths(selectedId) {
  const list = el("div", { class: "path-list" });
  for (const path of paths) {
    const open = path.id === selectedId;
    const button = el("button", {
      type: "button",
      id: `path-btn-${path.id}`,
      class: `path-row${open ? " is-open" : ""}`,
      "aria-expanded": open ? "true" : "false",
      "aria-controls": `detail-${path.id}`,
    });
    button.append(
      el("span", { class: "path-top" }, [
        el("span", { class: "path-name", text: path.name }),
        el("span", { class: `pill ${path.status}`, text: path.statusLabel }),
      ]),
      el("span", { class: "path-meta" }, [
        el("span", { text: `${path.model} · cutoff ${formatDay(path.cutoff)}` }),
        el("span", { class: "path-toggle", text: open ? "Hide" : "Note" }),
      ]),
      el("span", { class: "path-center", text: path.centerLabel }),
    );
    button.append(track(path.lo, path.hi, [{ value: path.center, kind: "center" }], path.loLabel, path.hiLabel));
    button.addEventListener("click", () => {
      go(open ? "#paths" : `#paths/${path.id}`);
    });
    const detail = el("div", {
      id: `detail-${path.id}`,
      class: "path-detail",
      role: "region",
      hidden: open ? null : "",
    });
    if (open) {
      detail.append(
        el("p", { text: path.note }),
        el("p", { class: "source", text: `${path.series}. Center ${path.centerLabel}. 90% band ${path.loLabel} to ${path.hiLabel}, ${path.unit}.` }),
      );
    }
    list.append(el("article", { class: "path" }, [button, detail]));
  }
  return el("div", { class: "paths" }, [
    el("header", { class: "lead-block" }, [
      el("h1", { class: "lead", text: "Eight paths the rule kept." }),
      el("p", {
        class: "dek",
        text: "Each center is the stored point. Each bar is the 90% band, and the tick is the center. Open a row for the note.",
      }),
    ]),
    list,
  ]);
}

function densityChart() {
  const samples = brentDensity();
  const width = 640;
  const height = 280;
  const pad = { l: 44, r: 16, t: 28, b: 42 };
  const minPct = samples[0].pct;
  const maxPct = samples[samples.length - 1].pct;
  const maxD = Math.max(...samples.map((sample) => sample.density));
  const xOf = (pct) => pad.l + ((pct - minPct) / (maxPct - minPct)) * (width - pad.l - pad.r);
  const yOf = (density) => pad.t + (1 - density / maxD) * (height - pad.t - pad.b);
  const baseline = height - pad.b;
  const line = samples
    .map((sample, index) => `${index === 0 ? "M" : "L"}${xOf(sample.pct).toFixed(1)},${yOf(sample.density).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${xOf(maxPct).toFixed(1)},${baseline} L${xOf(minPct).toFixed(1)},${baseline} Z`;
  const tail = samples.filter((sample) => sample.pct >= SHOCK * 100);
  const tailPath =
    `M${xOf(tail[0].pct).toFixed(1)},${baseline} ` +
    tail.map((sample) => `L${xOf(sample.pct).toFixed(1)},${yOf(sample.density).toFixed(1)}`).join(" ") +
    ` L${xOf(tail[tail.length - 1].pct).toFixed(1)},${baseline} Z`;
  const half = middleHalf();
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Density of the 21-day Brent price change. The center is zero. A pale band marks the middle half. The tail at 20 percent and above is marked.",
  );
  const parts = [
    `<rect class="half" x="${xOf(half.lo).toFixed(1)}" y="${pad.t}" width="${(xOf(half.hi) - xOf(half.lo)).toFixed(1)}" height="${baseline - pad.t}"></rect>`,
    `<path class="tail" d="${tailPath}"></path>`,
    `<path class="area" d="${area}"></path>`,
    `<path class="line" d="${line}"></path>`,
    `<line class="axis-line" x1="${pad.l}" x2="${width - pad.r}" y1="${baseline}" y2="${baseline}"></line>`,
    `<line class="guide zero" x1="${xOf(0)}" x2="${xOf(0)}" y1="${pad.t}" y2="${baseline}"></line>`,
    `<line class="guide shock" x1="${xOf(20)}" x2="${xOf(20)}" y1="${pad.t}" y2="${baseline}"></line>`,
    `<text class="guide-label" x="${xOf(0)}" y="16" text-anchor="middle">0%</text>`,
    `<text class="guide-label shock" x="${xOf(20) + 8}" y="16" text-anchor="start">20% scenario</text>`,
    `<text class="tick" x="${pad.l}" y="${height - 8}">21-day price change</text>`,
  ];
  for (const tick of [-30, -15, 0, 15, 30]) {
    parts.push(`<text class="tick" x="${xOf(tick)}" y="${baseline + 18}" text-anchor="middle">${tick > 0 ? `+${tick}` : tick}%</text>`);
  }
  svg.innerHTML = parts.join("");
  const readout = el("p", { class: "readout", "aria-live": "polite", text: "Center at 0%. The marked tail starts at +20%." });
  const follow = (event) => {
    const rect = svg.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const pct = minPct + ratio * (maxPct - minPct);
    let nearest = samples[0];
    for (const sample of samples) {
      if (Math.abs(sample.pct - pct) < Math.abs(nearest.pct - pct)) nearest = sample;
    }
    const share = nearest.density / maxD;
    const signed = nearest.pct > 0 ? `+${nearest.pct.toFixed(1)}` : nearest.pct.toFixed(1);
    readout.textContent = `${signed}% price change. Density is ${share.toFixed(2)} of the peak.`;
  };
  svg.addEventListener("pointermove", follow);
  svg.addEventListener("pointerdown", follow);
  return el("figure", { class: "chart-card" }, [
    el("figcaption", { text: "EIA Europe Brent spot, next 21 days" }),
    svg,
    readout,
    el("p", {
      class: "source",
      text: "Gaussian density of the live random-walk shadow. Height is scaled to the peak. The pale band is the middle half of outcomes. The tail is a rise of 20% or more. Observatory model 2026.11.0, information cutoff 4 Nov 2026.",
    }),
  ]);
}

function renderRise() {
  const up = Math.round(riseTail() * 100);
  const down = Math.round(fallTail() * 100);
  const stats = el("div", { class: "stats" }, [
    stat("0%", "Central forecast, log return and price"),
    stat(`${up}%`, "Chance of a rise of 20% or more"),
    stat(`${down}%`, "Chance of a fall of 20% or more"),
  ]);
  const map = el("dl", { class: "pairs" });
  for (const [name, value] of shockMap) {
    map.append(el("div", {}, [el("dt", { text: name }), el("dd", { text: value })]));
  }
  return el("div", { class: "rise" }, [
    el("header", { class: "lead-block" }, [
      el("h1", { class: "lead", text: "A 20% rise is a tail, not a path." }),
      el("p", {
        class: "dek",
        text: "The recommended forecast says Brent is unchanged over the next 21 days. The stored 20% shock was not given its own odds.",
      }),
    ]),
    el("div", { class: "rise-layout" }, [
      densityChart(),
      el("div", { class: "rise-side" }, [
        stats,
        el("article", { class: "card" }, [
          el("h2", { text: "If that tail hit" }),
          el("p", {
            class: "read",
            text: "One window, seasonal term held at zero. The policy-rate mapping treats a one-month blip as a year-on-year impulse.",
          }),
          map,
          el("p", {
            class: "source",
            text: "The same regression also fits a demand boom, a tax change, or a rate move that was already coming. Rounded chances use the stored Gaussian; holdout 90% coverage was 87.9% on 33 origins.",
          }),
        ]),
      ]),
    ]),
  ]);
}

function stat(value, label) {
  return el("div", { class: "stat" }, [el("p", { class: "figure", text: value }), el("p", { class: "figure-caption", text: label })]);
}

function renderPanel(state) {
  if (state.view === "paths") return renderPaths(state.pathId && pathById(state.pathId) ? state.pathId : null);
  if (state.view === "rise") return renderRise();
  return renderToday();
}

function renderTabs(view) {
  tablist.replaceChildren();
  VIEWS.forEach((item, index) => {
    const selected = item.id === view;
    const button = el("button", {
      type: "button",
      role: "tab",
      id: `tab-${item.id}`,
      "aria-selected": selected ? "true" : "false",
      "aria-controls": "panel",
      tabindex: selected ? "0" : "-1",
      text: item.label,
    });
    button.addEventListener("click", () => go(`#${item.id}`));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = VIEWS[(index + direction + VIEWS.length) % VIEWS.length];
      go(`#${next.id}`);
      queueMicrotask(() => document.getElementById(`tab-${next.id}`)?.focus());
    });
    tablist.append(button);
  });
}

function render() {
  const state = parseHash();
  const focusId = document.activeElement?.id;
  renderTabs(state.view);
  const panel = document.querySelector("#panel");
  panel.replaceChildren(renderPanel(state));
  panel.setAttribute("aria-labelledby", `tab-${state.view}`);
  document.title = `Humble Beras · ${VIEWS.find((item) => item.id === state.view).label}`;
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  if (state.view === "paths" && state.pathId) {
    document.getElementById(`detail-${state.pathId}`)?.scrollIntoView({ block: "nearest" });
  }
}

function mountChrome() {
  document.querySelector("#as-of").textContent = `${AS_OF_LABEL} · ${ZONE_LABEL}`;
  document.querySelector("#model").textContent = MODEL;
}

window.addEventListener("hashchange", render);
mountChrome();
render();
