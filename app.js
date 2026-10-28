// Page logic for the briefing site. Data comes from briefings-data.js,
// which build.js generates from the files in briefings/.

const briefings = window.BRIEFINGS || [];
const sectionNames = window.SECTION_NAMES || [];

const titleEl = document.getElementById("title");
const weekEl = document.getElementById("week");
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

function render() {
  const b = briefings[currentWeek];
  titleEl.textContent = b.title;
  document.title = b.title;

  for (const btn of buttonsEl.children) {
    btn.classList.toggle("active", btn.dataset.section === currentSection);
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
    opt.textContent = weekLabel(b);
    weekEl.appendChild(opt);
  });

  sectionNames.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.dataset.section = name;
    btn.addEventListener("click", () => {
      currentSection = name;
      render();
    });
    buttonsEl.appendChild(btn);
  });

  weekEl.addEventListener("change", () => {
    currentWeek = Number(weekEl.value);
    render();
  });

  render();
}

init();
