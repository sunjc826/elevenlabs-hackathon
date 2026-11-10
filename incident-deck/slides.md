---
theme: default
title: "Opening-burst packet loss"
info: Fictional narrated incident review
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 1280
transition: none
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

<IncidentVisual :slide-index="0" :step-index="$clicks" />

<!--
Step 0: This fictional Larkspur Trading review follows three minutes of interrupted trading. We will track feed traffic, receive misses, and strategy state, then locate the loss along the packet path.
-->

---
layout: timeline
clicks: 4
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# The opening burst

<IncidentVisual :slide-index="1" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="3"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="4"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: At eight forty-two, the driver upgrade passed quiet checks; the strategy kept running.

Step 1: Eighteen minutes later, the market opens. The top trace spikes with incoming feed traffic.

Step 2: A quarter-second later, the middle trace steps to six hundred forty receive misses.

Step 3: Another quarter-second later, the bottom band turns red: stale data triggers the risk halt.

Step 4: Three minutes later, Mira switches to the A channel. The bottom band returns to running.
-->

---
layout: hypotheses
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Where could packets disappear?

<IncidentVisual :slide-index="2" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Follow the path: Vesper Exchange, leaf-seventeen, the prism B host ring, the handler, then Kestrel. The highlighted exchange could have omitted messages; that possibility could not be excluded.

Step 1: The highlighted leaf-seventeen could have lost multicast membership. That possibility also could not be excluded.

Step 2: The host ring now lights up. Packet loss here could not be excluded after the driver change.
-->

---
layout: evidence
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Handler sequence log

<IncidentVisual :slide-index="3" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Look at the B-channel handler log. We need to establish the symptom before locating the loss.

Step 1: The highlighted line compares the expected sequence with the next arrival. The difference is six hundred forty missing messages. That confirms a discontinuity at the receiver, but it does not identify where packets disappeared. The other log lines simply establish the surrounding capture context.

Step 2: The miniature confirms the handler symptom. Exchange, switch membership, and host loss still could not be excluded.
-->

---
layout: evidence
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Exchange publication audit

<IncidentVisual :slide-index="4" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Look at the exchange status report. We need publication evidence covering the incident window.

Step 1: The highlighted finding reports continuous publication on both channels across the reviewed window. This is an explicit sequence audit, not just a green service badge. Within this fictional record, it rules out an exchange publication gap. The surrounding report identifies the window and audit scope.

Step 2: The miniature crosses out the exchange. Its publication-gap hypothesis is ruled out; downstream candidates remain open.
-->

---
layout: evidence
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Switch membership audit

<IncidentVisual :slide-index="5" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Look at leaf-seventeen’s membership audit. We need to know whether the subscriptions survived the open.

Step 1: The highlighted audit shows both memberships stayed present across the failure window. There were no departures or expirations to interrupt multicast delivery. That rules out the membership-loss hypothesis specifically. It does not clear every possible switch fault; the surrounding lines define the ports and audit window.

Step 2: The miniature crosses out membership loss at leaf-seventeen. Host receive loss remains the unresolved candidate.
-->

---
layout: evidence
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Host receive-miss replay

<IncidentVisual :slide-index="6" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Compare the two receive-miss traces under the same replay burst. Only ring capacity changes.

Step 1: The orange trace climbs to six hundred forty misses with five hundred twelve slots. The green trace stays at zero with four thousand ninety-six. The step aligns with the open; replay isolates ring capacity as the cause. The collapsed raw counters preserve the underlying snapshot.

Step 2: The miniature marks the host ring confirmed. The receive misses and controlled replay locate the loss here.
-->

---
layout: hypotheses
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# The evidence narrows the cause

<IncidentVisual :slide-index="7" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Cross out the exchange publication gap: the incident-window report shows continuous publication.

Step 1: Cross out membership loss at leaf-seventeen: the switch retained both subscriptions.

Step 2: Confirm the host ring: receive misses and the controlled replay identify exhausted capacity.
-->

---
layout: mechanism
clicks: 0
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# The same burst, two receive rings

<IncidentVisual :slide-index="8" :step-index="$clicks" />

<!--
Step 0: Both buffers receive the same burst. On the left, four thousand ninety-six slots absorb it, then drain as processing catches up. On the right, five hundred twelve slots fill first; overflow counts up to six hundred forty dropped packets. The new driver silently chose that smaller default. A quiet check never exercised this limit.
-->

---
layout: actions
clicks: 2
---

<!-- GENERATED from manifest.yaml. Do not edit. -->

# Make burst capacity explicit

<IncidentVisual :slide-index="9" :step-index="$clicks" />

<v-click at="1"><span class="click-registration" aria-hidden="true"></span></v-click>

<v-click at="2"><span class="click-registration" aria-hidden="true"></span></v-click>

<!--
Step 0: Pin four thousand ninety-six descriptors in configuration, then verify both hosts after reload and reboot.

Step 1: Alert on any increase in receive misses, giving Mira a direct signal from the failing layer.

Step 2: After every driver change, replay a pre-open burst. Require zero misses and zero handler gaps before promotion.
-->
