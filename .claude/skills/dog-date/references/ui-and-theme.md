# UI and theme

Read this when you're restyling, adding a component, debugging the swipe deck, or touching anything visual.

## The aesthetic — photo-first, single hot accent

The app went through a deliberate design pivot. The current direction is **"the dog is the design."** Photos and AI videos dominate every screen; type retreats to corners; one yellow accent earns its presence.

Why this matters: an agent that doesn't know the history will look at the dark surfaces and add helpful little flourishes — italic captions, mono-caps eyebrows, decorative dividers — and unwind the design. **Don't.** The minimalism is the design.

### Rules of the road

- **Pure typographic, no decoration.** No emojis (`🐾`, `✨`, `💬`, `📍`, `✶` outside the AI badge), no italic, no serif, no curly quotes (`"…"` not `“…”`), no em-dash separators, no "VOL XII / ISSUE №" filler chrome, no decorative hairline rules.
- **Allowed glyphs only:** `←`, `→`, `↑`, `↳`, `⋯`, `×`, and the AI badge's `AI` text (mono caps, no `✶`).
- **Single accent color.** Sodium yellow `#F7E14C` (`colors.accent`). It appears at most twice per visible viewport and ONLY on actionable elements: primary CTAs, the AI badge, the matches count, the chat send button. Never decorative.
- **Plus Jakarta Sans for UI.** JetBrains Mono only for *data* (timestamps, distances, counts, ages, IDs).
- **No hardcoded hex literals.** Every color/font/spacing value comes from `lib/theme.ts`. If a value isn't there and you need it, add a token first.

If your change adds an emoji, an italic, a serif, a yellow background-fill that's not a button, or any "VOL/ISSUE/EST." chrome, stop and reconsider. That's the wrong direction.

## Theme tokens (`lib/theme.ts`)

```ts
colors:
  bg              #0A0A0A   page background
  surface         #141414   cards, elevated panels
  surfaceElevated #1F1F1F   own chat bubbles (NOT an accent)
  surfaceHover    #262626   disabled button bg
  text            #F8F8F8   primary text
  textSoft        #A8A8A8   secondary
  textMute        #5C5C5C   tertiary, mono captions
  divider         #2A2A2A   hairlines
  dividerSoft     #1A1A1A   subtle dividers
  accent          #F7E14C   yellow — actionable only
  accentInk       #0A0A0A   text on accent buttons
  accentSoft      #28220A   subtle accent washes (rare)
  like            #9CFF6F   green — affordance only (LIKE drag badge)
  pass            #FF6B6B   red — affordance only (PASS drag badge, sign-out, errors)
  scrim           rgba(0,0,0,0.88)  modal backdrop

fonts:
  display         PlusJakartaSans_700Bold
  displayHeavy    PlusJakartaSans_800ExtraBold
  body            PlusJakartaSans_400Regular
  bodyMedium      PlusJakartaSans_500Medium
  bodyBold        PlusJakartaSans_600SemiBold
  mono            JetBrainsMono_500Medium
  monoBold        JetBrainsMono_600SemiBold

tracking (letterSpacing):
  tightDisplay    -0.6   for huge display headings
  display         -0.3   for medium headlines
  body             0     default
  loose            0.4   uppercased small labels (no tracking otherwise)
  monoLoose        1.6   mono caps eyebrows / labels
  mono             1.0   mono numerals
  monoTight        0.5   tight mono

radii:
  card            20
  cardLarge       28     match modal, video preview modal
  pill           999     small pills (AI badge, distance pill)
  frame            4     buttons, framed text inputs
  bubble          20     chat bubbles
  small           10     small chips
  tile            14     match list avatars
```

If you're adding a new screen, the layout pattern is:

```tsx
import { colors, fonts, tracking, radii } from '@/lib/theme';

<SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
  {/* header: ← Back left, display title center, spacer right */}
  {/* body: ScrollView or FlatList */}
</SafeAreaView>
```

Header pattern (consistent across matches/chat/dog detail/profile):

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
  <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/<fallback>'))}
             hitSlop={12}>
    <Text style={{ color: colors.textSoft, fontSize: 14, fontFamily: fonts.bodyMedium }}>← Back</Text>
  </Pressable>
  <Text style={{ color: colors.text, fontSize: 22, fontFamily: fonts.displayHeavy,
                 letterSpacing: tracking.tightDisplay }}>{title}</Text>
  <View style={{ width: 60 }} />
</View>
```

The `canGoBack()` fallback matters: direct URL loads in the web preview have empty navigation history, and `router.back()` warns "GO_BACK was not handled by any navigator." Always pair `router.back()` with a `replace` fallback to a sensible parent route.

## DogCard — the centerpiece

`components/DogCard.tsx` is the most-touched component. Three things to know:

### 1. Photo / video layering

```
<View style={card}>
  <View pointerEvents="none">  <Image fill cover />               </View>   ← bottom
  {videoUrl && (
    <View pointerEvents="none">  <VideoView fill cover />          </View>   ← over photo
  )}
  <LinearGradient style={fill} pointerEvents="none" />                       ← bottom darkening
  {videoUrl && <View aiBadge />}                                             ← top-left pill
  {distanceMiles > 0 && <View distancePill />}                               ← top-right pill
  <View contentOverlay pointerEvents="none">name + meta + bio</View>         ← bottom overlay
</View>
```

The pointer-events:none wrappers around media are non-negotiable — see the gesture trap below. The gradient and content overlay also use pointerEvents="none" so they don't block drags either.

### 2. The video-doesn't-play bug

`useVideoPlayer(url, init)`'s `init` callback fires only on first creation. When the deck advances to a new dog, the URL prop changes but the video sits paused on its first frame (which often *looks* like the static photo). Fix already in code:

```tsx
useEffect(() => {
  if (dog.videoUrl) {
    player.loop = true;
    player.muted = true;
    player.play();
  }
}, [dog.videoUrl, player]);
```

If you ever rewrite DogCard, keep this useEffect. Without it, every other card looks "broken" to users who can't tell a paused video from a still image.

### 3. The aspect ratio crop

Fal videos are 9:16 (720×1280 intrinsic). The card aspect is closer to 0.7. With `contentFit="cover"`, the video fills the card width and crops top+bottom — which on portrait video means cropping the dog itself. The current behavior accepts this; if you want full-bleed video you'd need to lock the card aspect to 9:16 (very tall on web preview) or letterbox with `contain` against a blurred-photo background. The blurred-photo experiment is already in git history; it overflowed without the explicit `width: '100%'; height: '100%'` style on VideoView, which leads to:

## The web `<video>` and `<img>` pointer-events trap

Two facts conspire to break drag gestures on web:

1. `inset: 0` does **not** size replaced elements (`<video>`, `<img>`) — they keep their intrinsic dimensions (e.g. 720×1280) unless you also set `width: 100%; height: 100%` explicitly.
2. Replaced elements default to `pointer-events: auto`, intercepting `pointerdown` *before* it bubbles to the SwipeDeck's GestureDetector. Programmatic `dispatchEvent` to the parent div appears to work because it skips the normal capture phase — but real mouse drag is dead.

Both fixes already in place:
- VideoView style includes `{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }`.
- Image and VideoView are wrapped in `<View pointerEvents="none">` so the gesture handler receives drags.

If you add a new media element on top of a gesture-receiving area (e.g. a video preview inside a swipeable card), wrap it the same way.

## SwipeDeck — gesture deck with imperative handle

`components/SwipeDeck.tsx` is a `forwardRef` component. It exposes:

```ts
type SwipeDeckHandle = {
  swipe: (direction: 'like' | 'pass') => void;
};
```

Used by `app/swipe.tsx` to wire the Pass / Like buttons:

```tsx
const deckRef = useRef<SwipeDeckHandle>(null);
<SwipeDeck ref={deckRef} dogs={...} onSwiped={handleSwiped} />
<Pressable onPress={() => deckRef.current?.swipe('like')}>...
```

Why buttons exist: real mouse drag in the web preview is unreliable for users who don't know to drag. Click affordances are 100% reliable. On native (iOS/Android), drag still works perfectly.

The `SWIPE_THRESHOLD` is `SCREEN_WIDTH * 0.18` (was 0.28; lowered for forgiveness on web). Don't raise it back without a reason.

## Match flow

When a user swipes right (drag or button), `app/swipe.tsx`'s `handleSwiped` runs:

1. `insertSwipe.mutateAsync({ swiperDogId, targetDogId, direction })` — inserts the swipe.
2. The `create_match_on_mutual_like` Postgres trigger fires; if mutual, a row is added to `matches`.
3. The mutation runs a follow-up `select` on `matches` with canonical ordering and returns `{ matched, matchId }`.
4. If `matched`, swipe.tsx stores both `matchedDog` and `matchedMatchId` in state and shows MatchModal after a 250ms delay (lets the card animation finish).
5. MatchModal's "Say hi to {ownerName}" button calls `onSayHi`, which `router.push('/chat/' + matchId)`.

If you change the match flow (e.g., adding a "super like" that creates a different state), preserve the `matchId` propagation — it's the only way the chat navigation works.

## Common UI tasks — the recipe

### Add a button

```tsx
<Pressable
  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
  onPress={handler}
>
  <Text style={styles.primaryText}>Action label</Text>
</Pressable>

// styles
primaryButton: {
  backgroundColor: colors.accent,
  paddingVertical: 14,
  alignItems: 'center',
  borderRadius: radii.frame,
},
primaryText: {
  fontFamily: fonts.bodyBold,
  fontSize: 15,
  color: colors.accentInk,
  letterSpacing: tracking.body,
},
pressed: { opacity: 0.75 },
```

For a secondary button, swap `backgroundColor: colors.surface` + `borderWidth: 1, borderColor: colors.divider`, text color `colors.text`, font `bodyMedium`.

### Add a screen

1. Create `app/<route>.tsx`.
2. Mirror the header pattern above.
3. Use `useAuth` for session redirect, TanStack hooks for data, `colors`/`fonts` from theme.
4. If it's a dynamic route, the directory + `[param].tsx` filename does the routing automatically — no need to register in `_layout.tsx`.
5. Verify with `mcp__Claude_Preview__preview_screenshot` before declaring done. Type-check passing isn't proof.

### Restyle an existing screen

1. Read it first to understand current state.
2. Replace any hardcoded hex with theme tokens.
3. Preserve all hooks/queries/navigation behavior. Restyle only.
4. Single yellow accent rule. Count occurrences in the rendered viewport.
5. Re-verify in the preview after each change.

### Add a media element

Wrap in `<View pointerEvents="none">` if it's inside a gesture-receiving region. Set `width: '100%', height: '100%'` on `<VideoView>` style if it's positioned absolutely (don't rely on `inset: 0` alone).

## Onboarding flow gotchas

`app/onboarding.tsx` lets the user pick a photo, fill name/breed/size/energy/notes, and submit. On submit it:

1. Tries to capture location (best-effort, doesn't block on permission denial).
2. Uploads the photo to Supabase Storage via `lib/storage.ts`.
3. Upserts a `dogs` row.

The upsert pattern is non-trivial because the `dogs` table has `unique (owner_id)` — we need INSERT-or-UPDATE semantics. Handled via `.upsert(..., { onConflict: 'owner_id' })`. Don't change to plain `.insert()` or signup-twice scenarios will throw.

If you add a field to onboarding, write it into both the `INSERT` shape and any UPDATE follow-ups.

## What "done" looks like

For visible changes:
1. Type-check passes.
2. `mcp__Claude_Preview__preview_screenshot` confirms the change rendered.
3. No new console errors (`mcp__Claude_Preview__preview_console_logs --level=error`).
4. `npm run check:web` still passes (no new ESM-only imports).
5. Demo flow still works end-to-end (sign-in → onboard → swipe → match → chat).

If any of those fail, you're not done.
