# Opening-burst packet loss at Larkspur Trading

Fictional incident, 2026-10-14. All times are Vesper Standard Time (VST, UTC+08:00).

A routine NIC driver upgrade on prism-b01 in VD-4 completed during the pre-open maintenance window. The driver changed the default receive ring from 4096 to 512 descriptors. The deployment did not explicitly configure that setting, and a quiet-feed health check passed. prism-a01 retained the previous driver and ring size as the unchanged A-channel standby.

At the 09:00:00 market open, a burst on Vesper Exchange's Prism feed overran prism-b01's receive ring. The B-channel handler detected missing sequence numbers. Every running Kestrel instance dependent on that handler became stale, and the risk layer halted them. Mira selected the healthy A channel and validated feed freshness before releasing the halt. Trading resumed about three minutes after the gap. The fictional record asserts no monetary loss estimate.

## Timeline

| Timestamp (2026-10-14, VST) | Event |
|---|---|
| 08:42:00 | Routine NIC driver upgrade completed on prism-b01; default ring fell from 4096 to 512 descriptors. |
| 09:00:00 | Market opened and Prism multicast traffic surged. |
| 09:00:00.240 | B-channel handler expected sequence 78124001 and received 78124641: 640 messages missing. |
| 09:00:00.480 | Feed freshness guard marked Kestrel stale; risk layer halted all affected instances. |
| 09:03:00 | Mira completed failover to prism-a01, verified fresh A-channel data, and resumed trading. |

Recovery was 179.760 seconds after the detected gap, rounded to three minutes. The halt lasted 179.520 seconds. Timestamp precision is illustrative, not measured production telemetry.

## Hypotheses and evidence

Before investigation, all three hypotheses could not be excluded. The handler log proves the symptom but cannot locate the loss. Each evidence excerpt has one highlighted finding; all evidence is synthetic.

| Hypothesis | Evidence for | Evidence against | Final standing |
|---|---|---|---|
| Vesper Exchange gapped Prism | The handler's sequence gap initially allowed an upstream explanation. | The exchange status page explicitly reports continuous A/B publication with zero publisher sequence gaps in the incident window. | **Ruled out** within this fictional record. A generic green status banner alone would not justify this confidence. |
| leaf-17 dropped multicast group membership | Lost membership could interrupt delivery, and initially could not be excluded. | The switch log reports both relevant memberships continuously present with zero leaves or expiry events in the incident window. | **Ruled out** for the specific membership-loss hypothesis; this is not a claim that every possible switch failure was tested. |
| prism-b01 dropped packets | Host NIC counters show receive-miss errors rising at the open, aligned with the gap. The same snapshot records the driver's reduced receive ring. | No contradictory evidence in the supplied record. A healthy quiet-feed check did not exercise burst capacity. | **Confirmed**. The local receive path exhausted its capacity during the burst. |

Evidence sources: `excerpts/handler.log`, `excerpts/exchange-status.txt`, `excerpts/switch.log`, and `excerpts/nic-counters.txt`. The NIC snapshot includes the maintenance comparison and burst-replay result so the smaller-ring mechanism is evidenced, not inferred from a miss counter alone.

## Root cause

The upgraded driver on prism-b01 supplied a default receive ring of 512 descriptors instead of 4096. Configuration relied on the default. At the open, arrivals outpaced receive processing long enough to exhaust the smaller buffer, increasing receive-miss errors and losing 640 sequence entries. A controlled replay in the host snapshot reproduces misses at 512 descriptors and records none at 4096. The trigger was the opening traffic burst; the root cause was the unpinned ring size introduced by the routine driver change. The risk halt correctly contained stale-data trading, and the unchanged A channel provided the recovery path.

## Follow-ups

| Action | Owner | Completion criterion |
|---|---|---|
| Pin the receive ring to 4096 descriptors in host configuration. | Mira | Both hosts report 4096 after driver reload and reboot. |
| Alert on any positive receive-miss counter delta. | Mira | Injected misses trigger an alert; reset/wrap handling does not create a false negative. |
| Run a pre-open burst replay after every driver change. | Mira | Representative peak plus headroom produces zero receive misses and no handler sequence gaps before promotion. |
