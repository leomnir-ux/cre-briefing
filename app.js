// Page logic for the briefing site. Data comes from briefings-data.js,
// which build.js generates from the files in briefings/.

const briefings = window.BRIEFINGS || [];
const sectionNames = window.SECTION_NAMES || [];

const weekRangeEl = document.getElementById("week-range");
const weekEl = document.getElementById("week");
const prevEl = document.getElementById("week-prev");
const nextEl = document.getElementById("week-next");
const buttonsEl = document.getElementById("sections");
const contentEl = document.getElementById("content");

let currentWeek = 0; // index into briefings (0 = newest)
let currentSection = sectionNames[0];

// ---------- Markdown rendering ----------

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Remove utm_source and any other utm_* tracking parameter from a link.
function cleanUrl(raw) {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }
    return url.toString();
  } catch (e) {
    return raw;
  }
}

function renderInline(text) {
  let html = escapeHtml(text);
  // Links: [label](url). The url was escaped above, so turn &amp; back first.
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, label, url) => {
    const clean = cleanUrl(url.replace(/&amp;/g, "&"));
    return `<a href="${escapeHtml(clean)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  return html;
}

function splitRow(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

function renderTable(lines) {
  const header = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow); // lines[1] is the |---| divider
  const head = header.map((c) => `<th>${renderInline(c)}</th>`).join("");
  const body = rows
    .map((r) => "<tr>" + r.map((c) => `<td>${renderInline(c)}</td>`).join("") + "</tr>")
    .join("");
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    const heading = line.match(/^###\s+(.*)$/);
    if (heading) {
      out.push(`<h3>${renderInline(heading[1])}</h3>`);
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const block = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) block.push(lines[i++]);
      out.push(renderTable(block));
      continue;
    }

    // Paragraph: runs until a blank line, heading, or table.
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^###\s/.test(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) {
      para.push(lines[i++]);
    }
    // Two spaces at the end of a line mean a line break.
    const html = para
      .map((l, idx) => renderInline(l.trim()) + (/ {2,}$/.test(l) && idx < para.length - 1 ? "<br>" : ""))
      .join(" ");
    out.push(`<p>${html}</p>`);
  }

  return out.join("\n");
}

// ---------- Page ----------

function weekLabel(b) {
  // "U.S. CRE Weekly Briefing, October 21 to October 27, 2026" -> "October 21 to October 27, 2026"
  const parts = b.title.split(", ");
  return parts.length > 1 ? parts.slice(1).join(", ") : b.date;
}

// "October 21 to October 27, 2026" -> "Oct 21 to Oct 27". The year is added
// only when the briefings span more than one year.
function shortWeekLabel(b) {
  const m = weekLabel(b).match(/^([A-Za-z]+) (\d+) to ([A-Za-z]+) (\d+), (\d{4})$/);
  if (!m) return weekLabel(b);
  const label = `${m[1].slice(0, 3)} ${m[2]} to ${m[3].slice(0, 3)} ${m[4]}`;
  const years = new Set(briefings.map((x) => x.date.slice(0, 4)));
  return years.size > 1 ? `${label}, ${m[5]}` : label;
}

// "Data Centers" -> "data-centers", used in the URL hash.
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// The first section this week's briefing actually has.
function firstSection(b) {
  return sectionNames.find((n) => b.sections[n]) || sectionNames[0];
}

// Change week and/or section by updating the URL hash. The hashchange
// listener below then redraws the page, so links, refresh and the back
// button all behave the same way.
function goTo(weekIndex, section) {
  const b = briefings[weekIndex];
  const name = b.sections[section] ? section : firstSection(b);
  const hash = `#${b.date}/${slugify(name)}`;
  if (location.hash === hash) render();
  else location.hash = hash;
}

// Read the URL hash (#2026-10-27/office). Anything missing or unknown falls
// back to the newest week and its first section.
function applyHash() {
  const [date, slug] = location.hash.replace(/^#/, "").split("/");
  const weekIndex = briefings.findIndex((b) => b.date === date);
  currentWeek = weekIndex >= 0 ? weekIndex : 0;
  const b = briefings[currentWeek];
  const wanted = sectionNames.find((n) => slugify(n) === slug);
  currentSection = wanted && b.sections[wanted] ? wanted : firstSection(b);

  // Tidy a bare or invalid address into the full form without adding a history entry.
  const canonical = `#${b.date}/${slugify(currentSection)}`;
  if (location.hash !== canonical) history.replaceState(null, "", canonical);
  render();
}

function render() {
  const b = briefings[currentWeek];
  weekRangeEl.textContent = weekLabel(b);
  document.title = b.title;

  weekEl.value = String(currentWeek);
  // The list is newest first, so "previous" is the next index along.
  prevEl.disabled = currentWeek >= briefings.length - 1;
  nextEl.disabled = currentWeek <= 0;

  for (const btn of buttonsEl.children) {
    const active = btn.dataset.section === currentSection;
    btn.classList.toggle("active", active);
    // On a phone the bar scrolls sideways, so keep the current tab in view.
    if (active) btn.scrollIntoView({ block: "nearest", inline: "center" });
  }

  const body = b.sections[currentSection];
  contentEl.innerHTML = body
    ? renderMarkdown(body)
    : "<p>This section is not in this week's briefing.</p>";
}

function init() {
  if (briefings.length === 0) {
    contentEl.innerHTML = "<p>No briefings found. Add a file to briefings/ and run <code>node build.js</code>.</p>";
    return;
  }

  briefings.forEach((b, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = shortWeekLabel(b);
    weekEl.appendChild(opt);
  });

  sectionNames.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.dataset.section = name;
    btn.addEventListener("click", () => goTo(currentWeek, name));
    buttonsEl.appendChild(btn);
  });

  weekEl.addEventListener("change", () => goTo(Number(weekEl.value), currentSection));
  prevEl.addEventListener("click", () => goTo(currentWeek + 1, currentSection));
  nextEl.addEventListener("click", () => goTo(currentWeek - 1, currentSection));
  window.addEventListener("hashchange", applyHash);

  applyHash();
}

init();
