# 2026-10-28: Market Summary format

**What went wrong:** The Market Summary read as a dense stack of statistics. Each paragraph packed in several figures and links, with a "My read:" sentence tacked onto the end, so it was hard to read as an article.

**Rule that fixes it (spec.md, Market Summary):**
- Length is now 800 to 1,100 words (was 500 to 700).
- Five to six topics, each with a `###` headline that states the takeaway, one italic overview sentence, one or two flowing paragraphs, one "My read:" paragraph, and a "Sources:" line with links.
- No more than three figures per sentence. Interpretation goes only in the "My read:" paragraph.
- Required topics: the week in brief, rates and the Fed, credit and CMBS, capital and pricing, and which asset classes are strengthening or weakening.
- Verify step now says every Market Summary figure must match its source exactly.

**Website impact:** None. The page already renders `###` headings, italics, bold and links.

**Note:** The existing briefing `briefings/2026-10-27.md` still uses the old format. The new rules apply from the next briefing, or from a rewrite of that one.
