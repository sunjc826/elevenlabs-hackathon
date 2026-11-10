---
theme: default
title: "Opening-burst packet loss"
info: Fictional narrated incident review
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 1280
transition: fade
drawings:
  enabled: false
fonts:
  sans: Inter
  mono: monospace
  provider: none
mdc: false
layout: cover
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Opening-burst packet loss

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><div class='cover-subtitle'>Larkspur Trading</div><div class='cover-metric'>3 minutes<span>from gap to recovery</span></div><p class='cover-note'>Fictional incident review · 14 October 2026</p></div>

</div>

<!--
Step 0: This review follows a three-minute interruption at Larkspur Trading. We'll trace missing feed messages to a host setting, then explain how the next routine upgrade should be tested.
-->

---
layout: timeline
clicks: 4
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Eighteen quiet minutes, then a burst

<p class="time-zone">2026-10-14 · VST (UTC+08:00)</p>

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><time>08:42:00</time><div><strong>Driver upgrade complete</strong><span>prism-b01 passes quiet-feed checks</span></div></div>

<v-click at="1">

<div class="step" :class="{ active: $clicks === 1 }" data-step="1"><time>09:00:00</time><div><strong>Market opens</strong><span>Prism multicast traffic surges</span></div></div>

</v-click>

<v-click at="2">

<div class="step" :class="{ active: $clicks === 2 }" data-step="2"><time>09:00:00.240</time><div><strong>B-channel sequence gap</strong><span>640 messages missing on prism-b01</span></div></div>

</v-click>

<v-click at="3">

<div class="step" :class="{ active: $clicks === 3 }" data-step="3"><time>09:00:00.480</time><div><strong>Risk halt</strong><span>Kestrel instances stop on stale data</span></div></div>

</v-click>

<v-click at="4">

<div class="step" :class="{ active: $clicks === 4 }" data-step="4"><time>09:03:00</time><div><strong>Trading resumes</strong><span>Mira validates prism-a01 and releases the halt</span></div></div>

</v-click>

</div>

<!--
Step 0: At eight forty-two Vesper Standard Time, the B-channel host passed maintenance checks. Packets could arrive, but the checks did not test how much traffic the host could absorb at once.

Step 1: Eighteen minutes later, the open changed the workload abruptly. The opening burst demanded much more buffering than the quiet feed had needed, before packet processing could catch up.

Step 2: Within a quarter of a second, the handler detected missing sequence numbers. That locates the symptom at the open, but cannot tell us where the packets disappeared.

Step 3: Another quarter-second later, the freshness guard halted the strategy instances. This protective response stopped decisions on an incomplete market view while the feed problem was investigated.

Step 4: About three minutes after the gap, Mira completed the move to the unchanged A channel. Fresh data restored trading, leaving the B-channel failure to be explained.
-->

---
layout: hypotheses
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Three possible places to lose packets

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><span class='standing pending'>COULD NOT BE EXCLUDED</span><h2>Exchange publication</h2><p>Did Vesper Exchange omit messages from Prism?</p></div>

<v-click at="1">

<div class="step" :class="{ active: $clicks === 1 }" data-step="1"><span class='standing pending'>COULD NOT BE EXCLUDED</span><h2>Multicast membership</h2><p>Did leaf-17 stop forwarding the subscribed group?</p></div>

</v-click>

<v-click at="2">

<div class="step" :class="{ active: $clicks === 2 }" data-step="2"><span class='standing pending'>COULD NOT BE EXCLUDED</span><h2>Host receive path</h2><p>Did prism-b01 run out of receive capacity?</p></div>

</v-click>

</div>

<!--
Step 0: Initially, an exchange publication gap could not be excluded. Healthy receivers can report messages that were never sent, so we needed an independent account of publication.

Step 1: A lost multicast membership could not be excluded either. That would interrupt delivery to the handler even if the exchange published every message.

Step 2: Host packet loss also could not be excluded. The recent driver change made it worth investigating, but timing alone was insufficient to confirm it as the cause.
-->

---
layout: evidence
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# The symptom reaches the handler

<p class="evidence-source">Feed handler log, host prism-b01</p>

<div class="excerpt" role="region" aria-label="Evidence excerpt">
<div class="log-line"><span class="line-number">01</span><pre>2026-10-14T08:59:55.000+08:00 INFO host=prism-b01 process=handler</pre></div>
<div class="log-line"><span class="line-number">02</span><pre>2026-10-14T08:59:55.010+08:00 INFO feed=Prism channel=B</pre></div>
<div class="log-line"><span class="line-number">03</span><pre>2026-10-14T08:59:55.020+08:00 INFO site=VD-4 session=20261014</pre></div>
<div class="log-line"><span class="line-number">04</span><pre>2026-10-14T08:59:56.000+08:00 INFO heartbeat age_ms=2</pre></div>
<div class="log-line"><span class="line-number">05</span><pre>2026-10-14T08:59:57.000+08:00 INFO decoder schema=7</pre></div>
<div class="log-line"><span class="line-number">06</span><pre>2026-10-14T08:59:58.000+08:00 INFO journal segment=114</pre></div>
<div class="log-line"><span class="line-number">07</span><pre>2026-10-14T08:59:59.000+08:00 INFO downstream=Kestrel attached=true</pre></div>
<div class="log-line finding"><span class="line-number">08</span><pre>2026-10-14T09:00:00.240+08:00 WARN expected=78124001 received=78124641 gap=640</pre></div>
<div class="log-line"><span class="line-number">09</span><pre>2026-10-14T09:00:00.250+08:00 INFO journal flush_requested=true</pre></div>
<div class="log-line"><span class="line-number">10</span><pre>2026-10-14T09:00:01.000+08:00 INFO heartbeat age_ms=3</pre></div>
<div class="log-line"><span class="line-number">11</span><pre>2026-10-14T09:00:02.000+08:00 INFO metrics scrape_complete=true</pre></div>
<div class="log-line"><span class="line-number">12</span><pre>2026-10-14T09:00:03.000+08:00 INFO journal segment=115</pre></div>
</div>

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><strong>640 missing messages</strong><span>Symptom confirmed. Loss location still unknown.</span></div>

</div>

<!--
Step 0: The highlighted line compares the next expected sequence with the next arrival. Their difference establishes missing messages. It confirms the symptom, while leaving all three possible loss locations open.
-->

---
layout: evidence
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Publication stayed continuous

<p class="evidence-source">Vesper Exchange status page, Prism incident-window report</p>

<div class="excerpt" role="region" aria-label="Evidence excerpt">
<div class="log-line"><span class="line-number">01</span><pre>Vesper Exchange</pre></div>
<div class="log-line"><span class="line-number">02</span><pre>Prism service status</pre></div>
<div class="log-line"><span class="line-number">03</span><pre>Report date: 2026-10-14</pre></div>
<div class="log-line"><span class="line-number">04</span><pre>Display timezone: VST (UTC+08:00)</pre></div>
<div class="log-line"><span class="line-number">05</span><pre>Component: multicast publication</pre></div>
<div class="log-line"><span class="line-number">06</span><pre>Channels in scope: A, B</pre></div>
<div class="log-line"><span class="line-number">07</span><pre>Reviewed window: 08:59:50 to 09:03:10</pre></div>
<div class="log-line finding"><span class="line-number">08</span><pre>Finding: no incident; A/B publication continuous; publisher sequence gaps=0</pre></div>
<div class="log-line"><span class="line-number">09</span><pre>Report generated: 09:12:00</pre></div>
<div class="log-line"><span class="line-number">10</span><pre>Maintenance calendar: no scheduled publisher work in reviewed window</pre></div>
<div class="log-line"><span class="line-number">11</span><pre>Report scope: publisher egress sequence audit</pre></div>
<div class="log-line"><span class="line-number">12</span><pre>Next routine update: 09:30:00</pre></div>
</div>

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><strong>Exchange gap ruled out</strong><span>The report covers the incident window and both channels.</span></div>

</div>

<!--
Step 0: The highlighted report explicitly checks publication continuity across the incident window. This is stronger than a green status badge. Within this fictional record, it rules out the exchange-gap hypothesis.
-->

---
layout: evidence
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Membership never expired

<p class="evidence-source">Access-switch log, leaf-17</p>

<div class="excerpt" role="region" aria-label="Evidence excerpt">
<div class="log-line"><span class="line-number">01</span><pre>2026-10-14T08:59:55+08:00 leaf-17 daemon[42]: audit session=20261014</pre></div>
<div class="log-line"><span class="line-number">02</span><pre>2026-10-14T08:59:56+08:00 leaf-17 daemon[42]: site=VD-4</pre></div>
<div class="log-line"><span class="line-number">03</span><pre>2026-10-14T08:59:57+08:00 leaf-17 daemon[42]: feed=Prism</pre></div>
<div class="log-line"><span class="line-number">04</span><pre>2026-10-14T08:59:58+08:00 leaf-17 daemon[42]: group_a=239.10.4.1 vlan=104</pre></div>
<div class="log-line"><span class="line-number">05</span><pre>2026-10-14T08:59:59+08:00 leaf-17 daemon[42]: group_b=239.10.4.2 vlan=104</pre></div>
<div class="log-line"><span class="line-number">06</span><pre>2026-10-14T09:00:00+08:00 leaf-17 daemon[42]: query_interval_s=30</pre></div>
<div class="log-line"><span class="line-number">07</span><pre>2026-10-14T09:03:09+08:00 leaf-17 daemon[42]: audit window=08:59:50..09:03:10</pre></div>
<div class="log-line finding"><span class="line-number">08</span><pre>2026-10-14T09:03:10+08:00 leaf-17 daemon[42]: A/B joins intact; leaves=0 expiry=0</pre></div>
<div class="log-line"><span class="line-number">09</span><pre>2026-10-14T09:03:11+08:00 leaf-17 daemon[42]: port_a=prism-a01 port_b=prism-b01</pre></div>
<div class="log-line"><span class="line-number">10</span><pre>2026-10-14T09:03:12+08:00 leaf-17 daemon[42]: audit archived=true</pre></div>
<div class="log-line"><span class="line-number">11</span><pre>2026-10-14T09:03:13+08:00 leaf-17 daemon[42]: clock source=local</pre></div>
<div class="log-line"><span class="line-number">12</span><pre>2026-10-14T09:03:14+08:00 leaf-17 daemon[42]: collector queue_depth=0</pre></div>
</div>

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><strong>Membership loss ruled out</strong><span>Both feed subscriptions remained present throughout the window.</span></div>

</div>

<!--
Step 0: The highlighted audit covers both handler ports throughout the failure window. No membership expired or left. That rules out membership loss, while leaving other switch faults outside this test.
-->

---
layout: evidence
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Receive misses rise at the open

<p class="evidence-source">Host NIC counter snapshot and replay audit, prism-b01</p>

<div class="excerpt" role="region" aria-label="Evidence excerpt">
<div class="log-line"><span class="line-number">01</span><pre>Host: prism-b01       Site: VD-4       Interface: rx0</pre></div>
<div class="log-line"><span class="line-number">02</span><pre>Date: 2026-10-14      Timezone: VST (UTC+08:00)</pre></div>
<div class="log-line"><span class="line-number">03</span><pre>Capture: NIC counters plus controlled replay audit</pre></div>
<div class="log-line"><span class="line-number">04</span><pre>Driver: 3.8.0 -&gt; 3.9.0 during 08:42:00 maintenance</pre></div>
<div class="log-line"><span class="line-number">05</span><pre>Counter width: 64 bits; no resets in capture window</pre></div>
<div class="log-line"><span class="line-number">06</span><pre>Metric                           before open       at 09:00:00.240</pre></div>
<div class="log-line"><span class="line-number">07</span><pre>-----------------------------------------------------------------</pre></div>
<div class="log-line finding"><span class="line-number">08</span><pre>rx_missed_errors                 0                 640  [ring 4096-&gt;512; replay misses 512:640 / 4096:0]</pre></div>
<div class="log-line"><span class="line-number">09</span><pre>rx_crc_errors                    0                 0</pre></div>
<div class="log-line"><span class="line-number">10</span><pre>rx_length_errors                 0                 0</pre></div>
<div class="log-line"><span class="line-number">11</span><pre>rx_link_down_events              0                 0</pre></div>
<div class="log-line"><span class="line-number">12</span><pre>-----------------------------------------------------------------</pre></div>
<div class="log-line"><span class="line-number">13</span><pre>Replay: identical captured burst, ring capacity is the only variable</pre></div>
<div class="log-line"><span class="line-number">14</span><pre>Counter semantics: missed receives due to exhausted descriptor capacity</pre></div>
<div class="log-line"><span class="line-number">15</span><pre>Capture generated: 10:10:00; replay isolated from live strategy input</pre></div>
</div>

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><strong>Host packet loss confirmed</strong><span>512 descriptors after upgrade; replay succeeds at 4096.</span></div>

</div>

<!--
Step 0: The highlighted row's right-hand counter shows receive misses rising at the open. Replay reproduces loss with the smaller ring and clears it at the original capacity, confirming the host mechanism.
-->

---
layout: hypotheses
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# The evidence narrows the cause

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><span class='standing excluded'>RULED OUT</span><h2>Exchange publication gap</h2><p>Incident-window publication report is continuous.</p></div>

<v-click at="1">

<div class="step" :class="{ active: $clicks === 1 }" data-step="1"><span class='standing excluded'>RULED OUT</span><h2>Multicast membership loss</h2><p>Switch audit shows uninterrupted subscriptions.</p></div>

</v-click>

<v-click at="2">

<div class="step" :class="{ active: $clicks === 2 }" data-step="2"><span class='standing confirmed'>CONFIRMED</span><h2>Host receive-ring exhaustion</h2><p>Miss counters and controlled replay identify prism-b01.</p></div>

</v-click>

</div>

<!--
Step 0: The exchange-gap hypothesis is ruled out. The publication report covers the relevant interval, so missing messages at the receiver do not imply missing publication.

Step 1: The membership-loss hypothesis is ruled out. The switch retained the subscriptions. The conclusion stays narrow because this evidence addresses membership, rather than the whole network.

Step 2: Host receive loss is confirmed. The counter timing locates the failure, and changing only ring capacity in replay explains why the new default failed under a burst.
-->

---
layout: mechanism
clicks: 1
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# A default became a production limit

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><div class='ring-comparison'><div><span>Previous receive ring</span><strong>4096</strong></div><div><span>New driver default</span><strong class='danger'>512</strong></div></div><p>Descriptors available before packet processing catches up</p></div>

<v-click at="1">

<div class="step" :class="{ active: $clicks === 1 }" data-step="1"><div class='mechanism-finding'><strong>Opening burst exceeds buffer capacity</strong><p>Receive misses cause a sequence gap, stale strategy data and a protective halt.</p></div></div>

</v-click>

</div>

<!--
Step 0: The driver reduced the receive ring to one eighth of its previous capacity. Because configuration inherited that default, a routine software change silently reduced the host's tolerance for short traffic bursts.

Step 1: The open supplied the trigger. The unpinned ring size supplied the vulnerability. A quiet health check could pass both configurations, which is why the missing burst test mattered.
-->

---
layout: actions
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Make burst capacity explicit

<div class="steps">

<div class="step" :class="{ active: $clicks === 0 }" data-step="0"><span class='action-number'>01</span><div><h2>Pin 4096 descriptors</h2><p>Verify both hosts after reload and reboot.</p></div></div>

<v-click at="1">

<div class="step" :class="{ active: $clicks === 1 }" data-step="1"><span class='action-number'>02</span><div><h2>Alert on receive misses</h2><p>Trigger on a positive counter delta.</p></div></div>

</v-click>

<v-click at="2">

<div class="step" :class="{ active: $clicks === 2 }" data-step="2"><span class='action-number'>03</span><div><h2>Replay the pre-open burst</h2><p>Require zero misses and zero gaps after every driver change.</p></div></div>

</v-click>

</div>

<!--
Step 0: First, pin the ring size in configuration and verify it after reload and reboot. That makes the required capacity an explicit operating choice instead of an undocumented driver default.

Step 1: Second, alert when receive misses increase. This gives Mira a direct signal from the failing layer, shortening the investigation instead of relying only on a downstream stale-data alarm.

Step 2: Finally, make a representative burst replay part of every driver change. Together, these checks preserve the capacity we depend on and prove it before the next market open.
-->
