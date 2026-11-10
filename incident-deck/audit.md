# Visual and narration audit

Each row records the intended first-second change and spoken anchors. Text matching is a structural check, not proof of comprehension or visual timing; inspect the rendered states and test playback. Retained axes and source context need not be read aloud.

| Slide / step | Seconds | Caption | First-second change | Narrated anchors |
|---|---:|---|---|---|
| title / 0 | 11.00 | Three minutes to recover | Cover appears with three-minute recovery figure | fictional; Larkspur Trading; three minutes; feed traffic; receive misses; strategy state; packet path |
| timeline / 0 | 5.41 | 08:42:00 · quiet checks | New timestamped vertical marker and event label appear | driver upgrade; quiet checks; strategy |
| timeline / 1 | 5.41 | 09:00:00 · traffic spike | New timestamped vertical marker and event label appear | market opens; top trace; feed traffic |
| timeline / 2 | 5.38 | Step at 09:00:00.240 | New timestamped vertical marker and event label appear | middle trace; six hundred forty; receive misses |
| timeline / 3 | 5.38 | 09:00:00.480 · risk halt | New timestamped vertical marker and event label appear | bottom band; stale data; risk halt |
| timeline / 4 | 5.38 | 09:03:00 · running again | New timestamped vertical marker and event label appear | Mira; A channel; bottom band; running |
| hypotheses / 0 | 11.00 | Exchange publication · still possible | Exchange node lights up | Vesper Exchange; leaf-seventeen; prism B host ring; handler; Kestrel; could not be excluded |
| hypotheses / 1 | 6.01 | leaf-17 membership · still possible | Switch node lights up | leaf-seventeen; multicast membership; could not be excluded |
| hypotheses / 2 | 5.98 | Host ring · still possible | NIC ring node lights up | host ring; could not be excluded; driver change |
| evidence-handler-log / 0 | 5.02 | Handler log · locate the symptom | Source appears without a highlighted finding | B-channel handler log; establish the symptom; locating the loss |
| evidence-handler-log / 1 | 18.00 | Finding line · 640 missing messages | Finding line highlights | highlighted line; expected sequence; next arrival; six hundred forty; does not identify where; capture context |
| evidence-handler-log / 2 | 6.01 | Handler confirmed · cause still open | Path miniature appears with updated standing | miniature; handler symptom; Exchange; switch membership; host loss; could not be excluded |
| evidence-exchange / 0 | 5.02 | Exchange report · check publication | Source appears without a highlighted finding | exchange status report; publication evidence; incident window |
| evidence-exchange / 1 | 18.00 | Finding line · publication stayed continuous | Finding line highlights | highlighted finding; continuous publication; both channels; reviewed window; rules out; audit scope |
| evidence-exchange / 2 | 6.01 | Exchange gap · ruled out | Path miniature appears with updated standing | miniature; crosses out the exchange; ruled out; downstream candidates remain open |
| evidence-switch / 0 | 5.02 | leaf-17 log · check memberships | Source appears without a highlighted finding | leaf-seventeen; membership audit; subscriptions; open |
| evidence-switch / 1 | 18.02 | Finding line · joins stayed intact | Finding line highlights | highlighted audit; both memberships; departures or expirations; rules out; not clear every possible switch fault; ports and audit window |
| evidence-switch / 2 | 6.01 | Membership loss · ruled out | Path miniature appears with updated standing | miniature; crosses out membership loss; leaf-seventeen; Host receive loss; unresolved |
| evidence-host / 0 | 5.02 | Host replay · compare ring capacity | Two unhighlighted replay traces appear, labeled by ring capacity | two receive-miss traces; same replay burst; Only ring capacity changes |
| evidence-host / 1 | 18.02 | 512 climbs · 4096 stays zero | Replay series become orange and green; finding point lights up | orange trace; six hundred forty; five hundred twelve; green trace; zero; four thousand ninety-six; step; ring capacity; collapsed raw counters |
| evidence-host / 2 | 6.01 | Host receive loss · confirmed | Path miniature appears with updated standing | miniature; host ring confirmed; receive misses; controlled replay |
| verdict / 0 | 5.51 | Exchange publication · ruled out | Exchange mark changes to crossed | Cross out the exchange; continuous publication |
| verdict / 1 | 5.49 | leaf-17 membership · ruled out | Switch mark changes to crossed | Cross out membership loss; leaf-seventeen; both subscriptions |
| verdict / 2 | 5.49 | Host ring · confirmed | Host ring mark changes to confirmed | Confirm the host ring; receive misses; controlled replay; exhausted capacity |
| root-cause / 0 | 20.04 | Same burst · smaller ring overflows | Both buffers appear empty and begin filling immediately | Both buffers; same burst; left; four thousand ninety-six; drain; right; five hundred twelve; overflow; six hundred forty; new driver; quiet check |
| follow-ups / 0 | 6.01 | Pin 4096 · verify after reboot | Only the pin-and-verify action appears | four thousand ninety-six; configuration; both hosts; reload and reboot |
| follow-ups / 1 | 5.98 | Alert on receive-miss increases | Action changes to counter alert | Alert; increase in receive misses; Mira |
| follow-ups / 2 | 7.00 | Burst test · zero misses or gaps | Action changes to pre-open burst test | every driver change; pre-open burst; zero misses; zero handler gaps |

Total clip duration: **232.59 seconds** / 240-second cap.
