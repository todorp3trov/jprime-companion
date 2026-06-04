# Graph Report - jprime-companion  (2026-06-04)

## Corpus Check
- 63 files · ~27,696 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 360 nodes · 470 edges · 47 communities (30 shown, 17 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed9e6bed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `UserDataService` - 17 edges
2. `Session` - 17 edges
3. `ConferenceService` - 14 edges
4. `SessionController` - 13 edges
5. `Speaker` - 13 edges
6. `apiGet()` - 12 edges
7. `SessionRating` - 10 edges
8. `SessionNote` - 10 edges
9. `ConferenceController` - 9 edges
10. `DtoMapper` - 9 edges

## Surprising Connections (you probably didn't know these)
- `loadUrl()` --calls--> `attachmentObjectUrl()`  [INFERRED]
  frontend/src/App.tsx → frontend/src/api/conference.ts
- `onPickFile()` --calls--> `uploadAttachment()`  [INFERRED]
  frontend/src/App.tsx → frontend/src/api/conference.ts
- `fetchDays()` --calls--> `apiGet()`  [INFERRED]
  frontend/src/api/conference.ts → frontend/src/api/client.ts
- `fetchSessions()` --calls--> `apiGet()`  [INFERRED]
  frontend/src/api/conference.ts → frontend/src/api/client.ts
- `fetchNotifications()` --calls--> `apiGet()`  [INFERRED]
  frontend/src/api/conference.ts → frontend/src/api/client.ts

## Communities (47 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (28): apiDelete(), apiGet(), apiJson(), apiObjectUrl(), apiSend(), apiUpload(), deviceHeaders(), unwrap() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (3): SessionNote, SavedSessionRepository, UserDataService

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (4): ConferenceDayRepository, SessionRepository, SpeakerRepository, ConferenceService

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (4): CompanionApiIntegrationTest, FixedClockConfig, NoteAttachmentRepository, AttachmentController

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (11): datePart(), decodeHtml(), eventDate(), isBreakLike(), kindFor(), normalizeName(), parseSpeakerDetail(), parseSpeakerIndex() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (11): CompanionApplication, childPidsOf(), descendantPidsOf(), handleSignal(), log(), postgresStatus(), run(), spawnChild() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (4): Key, Key, SavedSession, Serializable

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (4): DeviceIdArgumentResolver, WebConfig, HandlerMethodArgumentResolver, WebMvcConfigurer

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UserDataService` connect `Community 1` to `Community 4`, `Community 6`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `DtoMapper` connect `Community 3` to `Community 10`, `Community 12`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `RatingScore` connect `Community 6` to `Community 9`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._