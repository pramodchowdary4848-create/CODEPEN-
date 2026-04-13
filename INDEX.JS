/* ============================================================
   SORT FUNCTION
   ============================================================ */

function sort(width, height, length, mass) {
  if (
    typeof width  !== "number" || typeof height !== "number" ||
    typeof length !== "number" || typeof mass   !== "number" ||
    [width, height, length, mass].some((v) => !isFinite(v) || v < 0)
  ) {
    throw new TypeError(
      `All arguments must be non-negative finite numbers. ` +
      `Received: width=${width}, height=${height}, length=${length}, mass=${mass}`
    );
  }

  const VOLUME_THRESHOLD = 1_000_000;
  const DIM_THRESHOLD    = 150;
  const MASS_THRESHOLD   = 20;

  const volume  = width * height * length;
  const isBulky = volume >= VOLUME_THRESHOLD ||
                  width  >= DIM_THRESHOLD    ||
                  height >= DIM_THRESHOLD    ||
                  length >= DIM_THRESHOLD;

  const isHeavy = mass >= MASS_THRESHOLD;

  if (isBulky && isHeavy) return "REJECTED";
  if (isBulky || isHeavy) return "SPECIAL";
  return "STANDARD";
}

/* ============================================================
   UI WIRING
   ============================================================ */

const REASONS = {
  STANDARD:      "Not bulky, not heavy — handled normally.",
  SPECIAL_BULKY: "Bulky package — cannot be handled automatically.",
  SPECIAL_HEAVY: "Heavy package — cannot be handled automatically.",
  REJECTED:      "Both bulky and heavy — package is rejected.",
};

function getDetails(w, h, l, m) {
  const volume  = w * h * l;
  const isBulky = volume >= 1_000_000 || w >= 150 || h >= 150 || l >= 150;
  const isHeavy = m >= 20;
  return { volume, isBulky, isHeavy };
}

function getReason(isBulky, isHeavy) {
  if (isBulky && isHeavy) return REASONS.REJECTED;
  if (isBulky)            return REASONS.SPECIAL_BULKY;
  if (isHeavy)            return REASONS.SPECIAL_HEAVY;
  return REASONS.STANDARD;
}

document.getElementById("sort-btn").addEventListener("click", () => {
  const w = parseFloat(document.getElementById("width").value);
  const h = parseFloat(document.getElementById("height").value);
  const l = parseFloat(document.getElementById("length").value);
  const m = parseFloat(document.getElementById("mass").value);

  const badge  = document.getElementById("result-badge");
  const reason = document.getElementById("result-reason");

  try {
    const stack                    = sort(w, h, l, m);
    const { volume, isBulky, isHeavy } = getDetails(w, h, l, m);

    badge.textContent  = stack;
    badge.className    = "result-badge " + stack;
    reason.textContent = getReason(isBulky, isHeavy);

    document.getElementById("stat-vol").textContent   = volume.toLocaleString() + " cm³";
    document.getElementById("stat-bulky").textContent = isBulky ? "Yes" : "No";
    document.getElementById("stat-heavy").textContent = isHeavy ? "Yes" : "No";
  } catch (e) {
    badge.textContent  = "ERROR";
    badge.className    = "result-badge REJECTED";
    reason.textContent = e.message;
  }
});

/* ============================================================
   TEST SUITE
   ============================================================ */

const TEST_CASES = [
  // STANDARD
  { group: "STANDARD",          args: [10, 10, 10, 1],       expected: "STANDARD", label: "small package, light weight" },
  { group: "STANDARD",          args: [99, 99, 99, 19],      expected: "STANDARD", label: "just under every threshold" },
  { group: "STANDARD",          args: [0.1, 0.1, 0.1, 0.01],expected: "STANDARD", label: "tiny package" },
  { group: "STANDARD",          args: [0, 0, 0, 0],          expected: "STANDARD", label: "all zeros" },

  // SPECIAL – bulky only
  { group: "SPECIAL (bulky)",   args: [100, 100, 100, 1],    expected: "SPECIAL",  label: "volume exactly 1,000,000 cm³, light" },
  { group: "SPECIAL (bulky)",   args: [150, 10, 10, 1],      expected: "SPECIAL",  label: "width exactly 150 cm, light" },
  { group: "SPECIAL (bulky)",   args: [10, 150, 10, 1],      expected: "SPECIAL",  label: "height exactly 150 cm, light" },
  { group: "SPECIAL (bulky)",   args: [10, 10, 150, 1],      expected: "SPECIAL",  label: "length exactly 150 cm, light" },
  { group: "SPECIAL (bulky)",   args: [200, 10, 10, 1],      expected: "SPECIAL",  label: "width > 150 cm, light" },

  // SPECIAL – heavy only
  { group: "SPECIAL (heavy)",   args: [10, 10, 10, 20],      expected: "SPECIAL",  label: "standard size, exactly 20 kg" },
  { group: "SPECIAL (heavy)",   args: [10, 10, 10, 100],     expected: "SPECIAL",  label: "standard size, very heavy" },

  // REJECTED
  { group: "REJECTED",          args: [100, 100, 100, 20],   expected: "REJECTED", label: "volume threshold AND mass threshold" },
  { group: "REJECTED",          args: [200, 200, 200, 50],   expected: "REJECTED", label: "massive and very heavy" },
  { group: "REJECTED",          args: [150, 10, 10, 25],     expected: "REJECTED", label: "dim >= 150 cm and heavy" },

  // Boundaries
  { group: "Boundaries",        args: [99, 100, 100, 19],    expected: "STANDARD", label: "volume = 990,000 (just under 1M), light" },
  { group: "Boundaries",        args: [149, 149, 149, 19],   expected: "SPECIAL",  label: "all dims < 150 but volume = 3,307,949 (bulky)" },
];

const ERROR_CASES = [
  { args: [-1, 10, 10, 5],     label: "negative width" },
  { args: [10, 10, 10, -5],    label: "negative mass" },
  { args: [NaN, 10, 10, 5],    label: "NaN dimension" },
  { args: [Infinity, 1, 1, 1], label: "Infinity dimension" },
  { args: ["10", 10, 10, 5],   label: "string instead of number" },
];

function runTests() {
  let passed = 0;
  let failed = 0;
  const container = document.getElementById("test-results");
  container.innerHTML = "";

  const groups = {};
  TEST_CASES.forEach((tc) => {
    if (!groups[tc.group]) groups[tc.group] = [];
    groups[tc.group].push(tc);
  });

  for (const [groupName, cases] of Object.entries(groups)) {
    container.appendChild(makeGroupTitle(groupName));
    cases.forEach(({ args, expected, label }) => {
      let result, ok;
      try {
        result = sort(...args);
        ok = result === expected;
      } catch (e) {
        result = "threw: " + e.message;
        ok = false;
      }
      ok ? passed++ : failed++;
      container.appendChild(makeRow(ok, label, ok ? null : `got "${result}", expected "${expected}"`));
    });
  }

  container.appendChild(makeGroupTitle("Invalid input (should throw TypeError)"));
  ERROR_CASES.forEach(({ args, label }) => {
    let ok = false;
    try { sort(...args); } catch (e) { ok = e instanceof TypeError; }
    ok ? passed++ : failed++;
    container.appendChild(makeRow(ok, label, ok ? null : "expected TypeError to be thrown"));
  });

  const summary = document.createElement("div");
  summary.className = "test-summary " + (failed === 0 ? "all-pass" : "has-fail");
  summary.textContent = `${passed} passed, ${failed} failed — ${passed + failed} total`;
  container.prepend(summary);
}

function makeGroupTitle(text) {
  const el = document.createElement("div");
  el.className = "test-group-title";
  el.textContent = text;
  return el;
}

function makeRow(ok, label, detail) {
  const row = document.createElement("div");
  row.className = "test-row " + (ok ? "pass" : "fail");

  const icon = document.createElement("em");
  icon.className = "icon";
  icon.textContent = ok ? "✓" : "✗";

  const text = document.createElement("span");
  text.className = "label";
  text.textContent = label;

  row.appendChild(icon);
  row.appendChild(text);

  if (detail) {
    const d = document.createElement("span");
    d.className = "detail";
    d.textContent = detail;
    row.appendChild(d);
  }
  return row;
}

document.getElementById("run-tests-btn").addEventListener("click", runTests);
