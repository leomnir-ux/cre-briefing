# 2026-11-10: Market Summary rewrite, length and paragraph depth

**What went wrong:** The live 2026-10-27 briefing still used the old format, so the Market Summary read as short, robotic paragraphs with no topic headers. A first rewrite added headers but the paragraphs were still too short and dense with figures.

**Rule that fixes it (spec.md, Market Summary):**
- Length is now 1,800 to 2,300 words, not counting the Sources lines (was 800 to 1,100).
- Six to seven topics (was five to six).
- Each topic has two or three paragraphs of four to six sentences, with concrete detail such as parties, size, location and terms.
- The format from 2026-10-28 stays: topic headlines that state the takeaway, an italic overview, one "My read:" paragraph, and a Sources line.

**What changed in the briefing:** The Market Summary in briefings/2026-10-27.md was rewritten into seven headed topics. It reuses only figures that were already verified in the briefing's other sections and links each topic to the same sources. No new figures were added.

**Website impact:** None. briefings-data.js was rebuilt with node build.js.
