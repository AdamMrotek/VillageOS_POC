# VillageOS — Provider Search Eval Results

---

## Run: 2026-04-30 17:06

**Pipeline:** ChromaDB (text-embedding-3-small) + gpt-4o-mini synthesis  
**Cases:** quiet_birthday_4yo, toddler_football, outdoor_birthday  

> **Issue identified:** Retrieval quality is poor for constraint-heavy queries. The embedded document was a flat string (`name + category + description + tags`), causing "birthday" to dominate the vector space and drown out constraints like "quiet" or "outdoor". Concretely: Chessington World of Adventures (loud theme park) ranked #1 for a quiet venue query; The Clay Room (indoor pottery studio) ranked #1 for an outdoor birthday query.

### quiet_birthday_4yo

**Query:** birthday venue for a 4-year-old that isn't too loud  
**Expected any of:** Clay Room, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Chessington World of Adventures (0.47)  |
| 2 | The Clay Room Kingston (0.46)           |
| 3 | Richmond Park Café — Events Lawn (0.44) |

**Synthesis:** For a birthday venue for your 4-year-old that isn't too loud, I recommend The Cl…  
**Tokens:** 385 · **Time:** 3.39s · **Expected match:** Clay Room

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### toddler_football

**Query:** football coaching for my toddler  
**Expected any of:** Little Kickers

| # | Provider (score)                      |
| - | ------------------------------------- |
| 1 | Little Kickers Kingston (0.53)        |
| 2 | Surbiton Racket & Fitness Club (0.34) |
| 3 | Kingston Gymnastics Club (0.31)       |

**Synthesis:** For football coaching tailored specifically for toddlers, I highly recommend **L…  
**Tokens:** 353 · **Time:** 2.77s · **Expected match:** Little Kickers

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### outdoor_birthday

**Query:** outdoor birthday party ideas in Kingston  
**Expected any of:** Hobbledown, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | The Clay Room Kingston (0.60)           |
| 2 | Kingston Gymnastics Club (0.56)         |
| 3 | Richmond Park Café — Events Lawn (0.54) |

**Synthesis:** For an outdoor birthday party in Kingston, I recommend the Richmond Park Café — …  
**Tokens:** 399 · **Time:** 3.38s · **Expected match:** Richmond Park

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

---

## Run: 2026-04-30 17:25

**Pipeline:** ChromaDB (text-embedding-3-small) + gpt-4o-mini synthesis  
**Cases:** quiet_birthday_4yo, toddler_football, outdoor_birthday  

> **Fix 1 — Schema-to-prose embeddings:** replaced flat string with full schema-to-prose serialisation in `vector_store._build_document()`. Each attribute (noise level, indoor/outdoor, age range, price) gets an explicit natural-language sentence. Re-seeded ChromaDB. Clay Room moves to #1 for quiet query; Richmond Park moves to #1 for outdoor query — but indoor venues still sneak into #2/#3.

### quiet_birthday_4yo

**Query:** birthday venue for a 4-year-old that isn't too loud  
**Expected any of:** Clay Room, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | The Clay Room Kingston (0.49)           |
| 2 | Richmond Park Café — Events Lawn (0.47) |
| 3 | Chessington World of Adventures (0.47)  |

**Synthesis:** For a birthday venue that isn't too loud for your 4-year-old, I recommend **The …  
**Tokens:** 404 · **Time:** 3.07s · **Expected match:** Clay Room

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### toddler_football

**Query:** football coaching for my toddler  
**Expected any of:** Little Kickers

| # | Provider (score)                      |
| - | ------------------------------------- |
| 1 | Little Kickers Kingston (0.47)        |
| 2 | Surbiton Racket & Fitness Club (0.28) |
| 3 | Kingston Gymnastics Club (0.25)       |

**Synthesis:** For football coaching tailored specifically for toddlers, I highly recommend **L…  
**Tokens:** 352 · **Time:** 3.13s · **Expected match:** Little Kickers

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### outdoor_birthday

**Query:** outdoor birthday party ideas in Kingston  
**Expected any of:** Hobbledown, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Richmond Park Café — Events Lawn (0.61) |
| 2 | The Clay Room Kingston (0.59)           |
| 3 | Kingston Gymnastics Club (0.58)         |

**Synthesis:** For an outdoor birthday party, I highly recommend the Richmond Park Café — Event…  
**Tokens:** 392 · **Time:** 4.50s · **Expected match:** Richmond Park

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

---

## Run: 2026-04-30 17:49

**Pipeline:** ChromaDB (text-embedding-3-small) + gpt-4o-mini synthesis  
**Cases:** quiet_birthday_4yo, toddler_football, outdoor_birthday  

> **Fix 2 — Constraint extraction + post-filtering:** one gpt-4o-mini call (temp=0, ~264 tokens) extracts `noise_max`, `setting`, and `age` from the query as structured JSON. Python filter hard-excludes providers that violate constraints before synthesis. Retrieves top-20 candidates, filters, returns top-3. Falls back to unfiltered if filtering yields 0 results. Chessington and Clay Room now fully removed from wrong queries.

### quiet_birthday_4yo

**Query:** birthday venue for a 4-year-old that isn't too loud  
**Expected any of:** Clay Room, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | The Clay Room Kingston (0.49)           |
| 2 | Richmond Park Café — Events Lawn (0.47) |

**Synthesis:** For a birthday venue for your 4-year-old that isn't too loud, I recommend The Cl…  
**Tokens:** 328 · **Time:** 4.09s · **Expected match:** Clay Room

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### toddler_football

**Query:** football coaching for my toddler  
**Expected any of:** Little Kickers

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Little Kickers Kingston (0.47)          |
| 2 | Hobbledown Heath Farm Park (0.20)       |
| 3 | Richmond Park Café — Events Lawn (0.10) |

**Synthesis:** For football coaching for your toddler, I highly recommend **Little Kickers King…  
**Tokens:** 352 · **Time:** 2.82s · **Expected match:** Little Kickers

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### outdoor_birthday

**Query:** outdoor birthday party ideas in Kingston  
**Expected any of:** Hobbledown, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Richmond Park Café — Events Lawn (0.61) |
| 2 | Hobbledown Heath Farm Park (0.56)       |
| 3 | Chessington World of Adventures (0.51)  |

**Synthesis:** For an outdoor birthday party in Kingston, I recommend Hobbledown Heath Farm Par…  
**Tokens:** 370 · **Time:** 3.53s · **Expected match:** Hobbledown

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

---

## Run: 2026-05-01 11:40

**Pipeline:** ChromaDB (text-embedding-3-small) + gpt-4o-mini synthesis + HyDE query expansion  
**Cases:** quiet_birthday_4yo, toddler_football, outdoor_birthday  

> **Fix 3 — HyDE + taxonomy tag filtering:** LLM generates an atmospheric "vibe description" per provider at seed time — this is what gets embedded instead of structured prose. At query time, the raw query is expanded into a matching vibe description (HyDE technique) and hard tag constraints are extracted from a controlled vocabulary (`tags.py`). Vector search runs against the expanded query. Tag filter applied post-retrieval. Top result scores improved across all queries; Clay Room relevance score rises from 0.49 → 0.54.
>
> **Remaining issue:** `outdoor_birthday` extracted `{setting: outdoor, noise: quiet}` — Hobbledown is outdoor but tagged `noise: moderate`, so it was filtered out, leaving only 1 result. The query expander inferred a quiet constraint that wasn't explicitly stated. Prompt tuning needed to be more conservative with noise inference.

### quiet_birthday_4yo

**Query:** birthday venue for a 4-year-old that isn't too loud  
**Expected any of:** Clay Room, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | The Clay Room Kingston (0.54)           |
| 2 | Richmond Park Café — Events Lawn (0.49) |

**Synthesis:** For a birthday venue that is calm and suitable for a 4-year-old, I recommend **T…  
**Tokens:** 322 · **Time:** 6.94s · **Expected match:** Clay Room

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### toddler_football

**Query:** football coaching for my toddler  
**Expected any of:** Little Kickers

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Little Kickers Kingston (0.60)          |
| 2 | Hobbledown Heath Farm Park (0.39)       |
| 3 | Richmond Park Café — Events Lawn (0.33) |

**Synthesis:** For football coaching for your toddler, I highly recommend **Little Kickers King…  
**Tokens:** 328 · **Time:** 5.30s · **Expected match:** Little Kickers

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

### outdoor_birthday

**Query:** outdoor birthday party ideas in Kingston  
**Expected any of:** Hobbledown, Richmond Park

| # | Provider (score)                        |
| - | --------------------------------------- |
| 1 | Richmond Park Café — Events Lawn (0.63) |

**Synthesis:** For a delightful outdoor birthday party, I recommend the Richmond Park Café — Ev…  
**Tokens:** 200 · **Time:** 4.76s · **Expected match:** Richmond Park

| has_results | top_score | expected_match | synthesis_ok |
| ----------- | --------- | -------------- | ------------ |
| ✓           | ✓         | ✓              | ✓            |

---

## Findings Summary

### Iteration progression

| Run | Pipeline change | quiet_birthday | outdoor_birthday | toddler_football |
| --- | --------------- | -------------- | ---------------- | ---------------- |
| 17:06 | Baseline — flat embedding string | Chessington #1 (loud!) | Clay Room #1 (indoor!) | Little Kickers #1 ✓ |
| 17:25 | Schema-to-prose embedding | Clay Room #1 ✓, Chessington still #3 | Richmond Park #1 ✓, Clay Room still #2 | Little Kickers #1 ✓ |
| 17:49 | + Constraint extraction & post-filter | Clay Room #1 ✓, Chessington gone | Richmond Park #1 ✓, Hobbledown #2 ✓ | Little Kickers #1 ✓ |
| 11:40 | + HyDE vibe descriptions & tag filter | Clay Room #1 ✓ (0.54 ↑), Chessington gone | Richmond Park #1 ✓ (0.63 ↑), over-filtered | Little Kickers #1 ✓ (0.60 ↑) |

### Key insight

Vector similarity alone cannot enforce hard constraints. When multiple providers share a dominant keyword ("birthday"), their scores cluster within 0.02–0.03 of each other, making a soft constraint like "quiet" or "outdoor" worth almost nothing in the ranking. The fix is architectural: extract hard constraints and filter, don't score; expand the query semantically so the embedding space actually separates venues by feel.

### Architecture (current)

```
raw query
   │
   ├─ query_expander.py (gpt-4o-mini, ~430 tokens)
   │    ├─ expanded vibe description  → used for vector search
   │    └─ required_tags             → used for hard post-filter
   │
   ├─ ChromaDB vector search (text-embedding-3-small)
   │    └─ documents = vibe_description + name + factual description
   │
   ├─ Python tag filter (required_tags must be present in tag_* metadata)
   │
   └─ gpt-4o-mini synthesis (~280 tokens)
```

### Remaining issues

- **Over-filtering on noise:** `outdoor_birthday` query had no explicit noise constraint but the expander inferred `noise: quiet`, which removed Hobbledown (moderate). Prompt needs to be more conservative — only extract noise constraint when the parent uses explicit words like "quiet", "not too loud", "calm".
- **Weak #2/#3 for toddler_football:** tag filter keeps only Little Kickers (only toddler-rated football club). Spots #2/#3 filled by low-relevance fallbacks. Fix: cap results at the number that pass the filter rather than padding to `limit`.
- **Small corpus:** 8 providers, 4 birthday venues. Scores are compressed and quality will improve naturally as corpus grows toward 50–100 providers.

### Cost per search (gpt-4o-mini, May 2026 pricing: $0.15/1M input · $0.60/1M output)

| Step | Model | Avg tokens | Est. cost |
| ---- | ----- | ---------- | --------- |
| Query expansion (HyDE + tags) | gpt-4o-mini | ~430 (370 in / 60 out) | **$0.000092** |
| Synthesis | gpt-4o-mini | ~280 (210 in / 70 out) | **$0.000073** |
| Query embedding | text-embedding-3-small | ~15 | **~$0.000000** |
| **Total per search** | | | **~$0.000165** |

**Seed-time cost (one-off):** ~560 tokens × 8 providers = ~4,500 tokens ≈ **$0.001** total to generate all vibes.

~$0.17 per 1,000 searches · ~$1.70 per 10,000 · ~$17 per 100,000
