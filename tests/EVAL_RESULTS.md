# VillageOS — Model Eval Results

**Run:** 2026-04-30 13:32  
**Configs:** groq_tools, groq_json, openai_tools, openai_json  
**Cases:** bake_sale, stanley_may_day, football_whatsapp  


## bake_sale

```
Reminder from school: Bake Sale this Friday 24th May at 3pm in the school hall. Please bring £2 in a labelled envelope.
```

| Config                 | event_type | title     | start        | end | location    | description                              | action_items | conf | tokens | time  |
| ---------------------- | ---------- | --------- | ------------ | --- | ----------- | ---------------------------------------- | ------------ | ---- | ------ | ----- |
| Groq 70b / TOOLS       | school     | Bake Sale | 24 May 15:00 | —   | school hall | Bake Sale where children can buy baked g | 1 (£2.0)     | 90%  | 888    | 0.75s |
| Groq 70b / JSON        | school     | Bake Sale | 24 May 15:00 | —   | school hall | A bake sale event at the school hall.    | 1 (£2.0)     | 100% | 1075   | 0.70s |
| OpenAI 4o-mini / TOOLS | fundraiser | Bake Sale | 01 May 15:00 | —   | school hall | Join the bake sale to support fundraisin | 1 (£2.0)     | 100% | 605    | 2.42s |
| OpenAI 4o-mini / JSON  | fundraiser | Bake Sale | 24 May 15:00 | —   | school hall | A bake sale to raise funds for school ac | 1 (£2.0)     | 100% | 1041   | 2.91s |

| Config                 | title | event_type | start_time | end_time | location | description | action_items | confidence |
| ---------------------- | ----- | ---------- | ---------- | -------- | -------- | ----------- | ------------ | ---------- |
| Groq 70b / TOOLS       | ✓     | ✓          | ✓          | ✗        | ✓        | ✓           | ✓            | ✓          |
| Groq 70b / JSON        | ✓     | ✓          | ✓          | ✗        | ✓        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / TOOLS | ✓     | ✓          | ✓          | ✗        | ✓        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / JSON  | ✓     | ✓          | ✓          | ✗        | ✓        | ✓           | ✓            | ✓          |


## stanley_may_day

```
## Event Overview * Event Name: Stanley's May Day * Theme: Stay & Play, Relax and Enjoy the Outdoors * Date: Saturday, 1...
```

| Config                 | event_type | title             | start        | end   | location | description                              | action_items    | conf | tokens | time  |
| ---------------------- | ---------- | ----------------- | ------------ | ----- | -------- | ---------------------------------------- | --------------- | ---- | ------ | ----- |
| Groq 70b / TOOLS       | other      | Stanley's May Day | 16 May 14:00 | 17:00 | —        | Stanley's May Day is a fun-filled outdoo | 2 (£3.0, £10.0) | 90%  | 1019   | 0.73s |
| Groq 70b / JSON        | other      | Stanley's May Day | 16 May 14:00 | 17:00 | —        | A Stay & Play event to relax and enjoy t | 2 (£3.0, £10.0) | 100% | 1202   | 0.70s |
| OpenAI 4o-mini / TOOLS | other      | Stanley's May Day | 16 May 14:00 | 17:00 | —        | A fun outdoor event featuring games, foo | 2 (£3.0)        | 90%  | 713    | 2.70s |
| OpenAI 4o-mini / JSON  | other      | Stanley's May Day | 16 May 14:00 | 17:00 | —        | A family-friendly outdoor event featurin | 1 (—)           | 90%  | 1136   | 3.02s |

| Config                 | title | event_type | start_time | end_time | location | description | action_items | confidence |
| ---------------------- | ----- | ---------- | ---------- | -------- | -------- | ----------- | ------------ | ---------- |
| Groq 70b / TOOLS       | ✓     | ✓          | ✓          | ✓        | ✗        | ✓           | ✓            | ✓          |
| Groq 70b / JSON        | ✓     | ✓          | ✓          | ✓        | ✗        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / TOOLS | ✓     | ✓          | ✓          | ✓        | ✗        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / JSON  | ✓     | ✓          | ✓          | ✓        | ✗        | ✓           | ✓            | ✓          |


## football_whatsapp

```
Hi all! Just a reminder that the under-9s football tournament is next Saturday 10th May, kick off 9am at Riverside Park....
```

| Config                 | event_type | title                        | start        | end   | location       | description                              | action_items | conf | tokens | time  |
| ---------------------- | ---------- | ---------------------------- | ------------ | ----- | -------------- | ---------------------------------------- | ------------ | ---- | ------ | ----- |
| Groq 70b / TOOLS       | sport      | Under-9s Football Tournament | 10 May 09:00 | 12:30 | Riverside Park | Under-9s football tournament with kids n | 3 (£5.0)     | 90%  | 978    | 0.75s |
| Groq 70b / JSON        | sport      | Under-9s Football Tournament | 10 May 09:00 | 12:30 | Riverside Park | Under-9s football tournament with a £5 e | 3 (£5.0)     | 90%  | 1170   | 0.72s |
| OpenAI 4o-mini / TOOLS | sport      | Under-9s Football Tournament | 09 May 09:00 | 12:30 | Riverside Park | A fun under-9s football tournament where | 2 (£5.0)     | 100% | 673    | 2.83s |
| OpenAI 4o-mini / JSON  | sport      | Under-9s Football Tournament | 09 May 09:00 | 12:30 | Riverside Park | A competitive football tournament for un | 2 (£5.0)     | 100% | 1127   | 4.00s |

| Config                 | title | event_type | start_time | end_time | location | description | action_items | confidence |
| ---------------------- | ----- | ---------- | ---------- | -------- | -------- | ----------- | ------------ | ---------- |
| Groq 70b / TOOLS       | ✓     | ✓          | ✓          | ✓        | ✓        | ✓           | ✓            | ✓          |
| Groq 70b / JSON        | ✓     | ✓          | ✓          | ✓        | ✓        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / TOOLS | ✓     | ✓          | ✓          | ✓        | ✓        | ✓           | ✓            | ✓          |
| OpenAI 4o-mini / JSON  | ✓     | ✓          | ✓          | ✓        | ✓        | ✓           | ✓            | ✓          |
