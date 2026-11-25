# Website redesign walkthrough: 5-minute video script

**How to use this script**

- It's about 820 spoken words, which comes to about 5 minutes at a natural pace.
- **[Screen]** lines tell you what to show or do. Everything else is what you say.
- The design notes at the end aren't meant to be read out. Use them as backup for questions.

---

## 1. The feel (0:00 – 0:40)

**[Screen]** Homepage, at the very top. Don't scroll yet.

Hi everyone. I want to walk you through the ClassroomIO website redesign. I'll cover what each part looks like, but mostly why it looks and moves the way it does.

I started with the feel. We sell to teams who will trust us with their customers, so the site has to feel calm, clear and confident. That's why the system is small on purpose:

- One typeface: Geist.
- Four colours: our blue, a deep navy, a soft light blue and white.
- The same 10-pixel corner on every card and button.
- No drop shadows anywhere. Depth comes from colour and layering, not effects.

Motion follows one rule: **it only moves if it explains something.** Big movements glide. Small things, like a button or a toggle, have a slight spring, so the page feels alive without being loud.

## 2. Homepage hero (0:40 – 1:30)

**[Screen]** Scroll slowly through the hero.

The headline is the outcome we deliver: "Help customers get more value from your product."

Now watch what happens when I scroll. The headline softly blurs away, and pieces of a real ClassroomIO dashboard fly in from around the screen and click together into one view. The idea is that you're watching the product assemble. We're not describing it, we're showing it.

Once it settles, the dashboard comes to life:

- The numbers count up.
- The chart tooltip steps through the weeks.
- A cursor moves around clicking date ranges and filters, like someone is giving you a tour.

At the bottom, an AI bar types real prompts, like "Translate this course into Spanish." That tells you we're AI-native before you've read a single feature.

## 3. Proof and the "why" (1:30 – 2:05)

**[Screen]** Continue down past the facts row and the logo strip, then into the floating section.

Next is a quick facts row: open source, cloud or self-hosted, a free plan, and works with Claude and Cursor. Then a logo strip that scrolls on its own and pauses when you hover, so you can actually read a name.

This next section is my favourite. Three short lines change as you scroll:

1. "Every SaaS product has to be learned."
2. "Most customers learn it alone."
3. "ClassroomIO teaches them for you."

Around them, the things a learner actually sees orbit in 3D: a course card, a quiz, a certificate, an AI Tutor reply and a progress ring. So the problem comes in words, and the answer comes in pictures.

## 4. Features you can touch (2:05 – 2:40)

**[Screen]** On the feature cards, click a plugin tile, then a brand colour swatch.

Each feature card is a small working demo, not a static illustration:

- On the SCORM card, a package flows in and the progress, score and completion values fill up.
- On the custom domain card, you can click a colour and the sign-in screen rebrands itself.
- On the Zapier card, you can click an app and watch the event travel to it.

The reason is simple. People believe what they can try.

## 5. AI that shows its work (2:40 – 3:10)

**[Screen]** Hover over each of the four AI cards.

The four AI cards follow the same idea. Each one plays a short loop of the feature actually working:

- A course plan gets drafted from one sentence.
- A video gets a timestamped transcript.
- A terminal connects Claude and publishes a course.
- A learner asks the Tutor a question and the answer is pulled from the lesson.

The bar at the top shows how far through each demo you are, and hovering lets you pick one.

## 6. Journey, developers and stories (3:10 – 3:40)

**[Screen]** Drag the journey carousel, pause on the developer steps, then scroll to the final section.

Then the page goes dark for the customer journey, which signals a change of chapter. The carousel shows each stage, from prospect, to demo, to onboarding, to launch, to tracking. Small UI cards float on each slide, and you can drag or swipe through them.

For developers, there's a four-step walkthrough of API key, REST API, webhooks and MCP, with a little pointer that follows the active step.

Every page ends the same way: content like videos, slides, SCORM and AI tools flows into ClassroomIO and comes out as courses, academies and certificates. That's our whole product in one picture.

## 7. About (3:40 – 4:20)

**[Screen]** Open the About page and let the hero play. Then hover over a tab, move the mouse across the mission cards, and drag the team row.

About is more human, so it opens on full-bleed photos. Three tabs (customer education, open source and built with customers) take turns every six seconds. Each photo crossfades in with a slow zoom, and the tab fills up to show how long until the next one. Hovering pauses it, because if you're reading, you shouldn't be rushed.

The mission cards tilt gently toward your mouse with a light glare, so they feel physical. "Who uses ClassroomIO" used to be a plain list. Now it's a set of cards, and the ones with real customers link straight to their story. The team row scrolls sideways and snaps neatly into place.

## 8. Customers (4:20 – 4:40)

**[Screen]** Open Customers and hover over the faces in the headline.

On Customers, the real faces sit right inside the headline. Hovering fans them out, they lean toward your cursor, and clicking one opens that person's story. Every quote on the page is real. We didn't invent any.

## 9. Pricing and close (4:40 – 5:00)

**[Screen]** Open Pricing, toggle between Monthly and Yearly, then hover over a plan.

Pricing has to feel honest. Flip the toggle and the knob springs across while every price ticks to its new value, so you can see exactly what changed. The plans lift slightly when you hover, and Growth is marked as the most popular.

**[Screen]** Scroll to the final call to action.

One last thing: if someone has reduced motion turned on, every animation stops and the page still works. So it's calm, clear and honest, and everything moves for a reason. It's still a prototype, nothing is live yet, and I'd love your feedback. Thanks!

---

## Design notes for questions (not read out)

**Design system**

- **Typeface:** Geist.
- **Colours:** `#0542cc` (blue), `#0b1233` (navy), `#cddcfc` (light blue) and white.
- **Shape:** 10px radius everywhere. No shadows.
- **Buttons:** primary blue, a white outline variant, and a 97% press-down when clicked.
- **Two easings:**
  - A smooth ease-out for large movements.
  - A spring with slight overshoot for small controls: buttons, knobs and arrows.

**Scroll reveals**

- Headlines appear word by word as they enter the screen.
- Cards fade up as they come into view.
- The nav bar gets a border only once you start scrolling, so it stays invisible at the top.

**Homepage hero**

- The hero is pinned while you scroll.
- The headline fades, lifts and blurs out as the dashboard pieces assemble.
- The demo cursor tour waits until the dashboard has finished assembling.

**Looping demos**

- Feature cards, AI cards and the developer steps only animate while they're on screen.
- They restart when you scroll back to them.
- The AI cards each run for 12.5 to 14 seconds.
- The developer steps change every 3.6 seconds.

**Stories and logos**

- **Story tabs:** a progress bar fills under each tab, they advance automatically, and they pause on hover.
- **Logo strip:** it loops seamlessly, the edges fade out, and it pauses on hover.

**About**

- The photo hero changes every 6 seconds and has a vertical progress meter.
- The arrow button rotates 45° on hover.
- The vision card has a colour "lens" that follows the cursor, and its "I want to…" prompt types itself.

**Customers**

- The face of the current story lifts and draws a progress ring around itself.
- Each face has a name tooltip.
- Clicking a face gives a small burst ring.

**Pricing**

- The hero background is a soft tiled plane with tiles that glow slowly, fading out toward the bottom.
- The yearly toggle shows "2 months free".

**FAQ**

- Accordion items turn light blue when open, and the chevron flips.

**Mobile and accessibility**

- **Mobile:** the pinned hero turns off and everything stacks into single columns, with no sideways scrolling.
- **Reduced motion:** every loop, typing effect and scroll effect stops, and content shows in its final state.

---

## Recording tips

- **Hard-refresh** each page before recording so the intro animations play.
- **Scroll slowly through the homepage hero.** The assembly effect depends on scroll speed.
- **Watch the FAQ.** It still shows the old "$35 Early Adopter" plan, which contradicts the Pricing section, so don't scroll to it on camera.
- **If you run long,** cut section 6 down to just the final illustration.
