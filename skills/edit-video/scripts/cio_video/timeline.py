"""Turns spoken phrases into timed explainer events, hooks, punch-in windows and caption pages."""
from .brand import wrap
from .transcript import find_phrase

MIN_SPEAKER_GAP = 1.6
MAX_EVENT = 16.0
ITEM_LISTS = ('rows', 'items', 'nodes', 'blocks', 'lines')


def word_end(tokens, index, duration):
    following = tokens[index + 1][0] if index + 1 < len(tokens) else duration
    return min(following, tokens[index][0] + 0.7)


def item_phrases(props):
    phrases = [item['at'] for key in ITEM_LISTS for item in props.get(key, []) if isinstance(item, dict) and item.get('at')]
    if props.get('swipe_at'):
        phrases.append(props['swipe_at'])
    return phrases


def resolve_events(clip, tokens, duration, warn=print):
    """Explainer specs → [{spec, start, end, item_times}] with speaker gaps and length caps enforced."""
    events = []
    for spec in clip['explainers']:
        start, _ = find_phrase(tokens, spec['trigger'])
        if start is None:
            warn(f"  ! {clip['id']}: trigger not found: \"{spec['trigger']}\"")
            continue
        start = max(0.0, start - 0.25)
        if spec.get('until'):
            _, until_index = find_phrase(tokens, spec['until'], start)
            if until_index is None:
                warn(f"  ! {clip['id']}: until not found: \"{spec['until']}\"")
                end = start + spec.get('duration', 6.0)
            else:
                end = word_end(tokens, until_index, duration) + spec.get('hold', 1.0)
        else:
            end = start + spec.get('duration', 5.0)
        end = min(end, start + MAX_EVENT, duration)
        if end > duration - 1.2:
            end = duration + 1.0
        item_times = {}
        for phrase in item_phrases(spec['props']):
            at, _ = find_phrase(tokens, phrase, start - 0.5)
            if at is None:
                warn(f"  ! {clip['id']}: item phrase not found: \"{phrase}\"")
            item_times[phrase] = None if at is None else at - start
        events.append({'spec': spec, 'start': start, 'end': end, 'item_times': item_times})
    events.sort(key=lambda event: event['start'])
    resolved = []
    for event in events:
        if resolved and event['start'] - resolved[-1]['end'] < MIN_SPEAKER_GAP:
            resolved[-1]['end'] = event['start'] - MIN_SPEAKER_GAP
            if resolved[-1]['end'] - resolved[-1]['start'] < 2.5:
                warn(f"  ! {clip['id']}: dropped \"{resolved[-1]['spec']['trigger']}\" (no room before the next visual)")
                resolved.pop()
        resolved.append(event)
    for event in resolved:
        length = event['end'] - event['start']
        late = [phrase for phrase, at in event['item_times'].items() if at is not None and at > length - 0.8]
        if late:
            warn(f"  ! {clip['id']}: \"{event['spec']['trigger']}\" ends before {late} is shown; move the trigger or until")
    return resolved


def resolve_hook(clip, tokens, duration, warn=print):
    if not clip.get('hook'):
        return None
    start, last = find_phrase(tokens, clip['hook'])
    if start is None:
        warn(f"  ! {clip['id']}: hook not found: \"{clip['hook']}\"")
        return None
    first = next(index for index, (t, _) in enumerate(tokens) if t == start)
    hook = {'start': max(0.0, start - 0.08), 'end': word_end(tokens, last, duration) + 0.05, 'words': tokens[first:last + 1]}
    if hook['end'] - hook['start'] > 5.5:
        warn(f"  ! {clip['id']}: hook is {hook['end'] - hook['start']:.1f}s; aim for 2–5s")
    return hook


def zoom_windows(tokens, duration, cut_points=()):
    """Alternating punch-in windows that switch at sentence starts and at pause cuts (hides the jump)."""
    sentence_starts = [tokens[i][0] for i in range(1, len(tokens)) if tokens[i - 1][1][-1] in '.?!']
    cut_set = {round(t, 3) for t in cut_points}
    candidates = sorted({round(t, 3) for t in sentence_starts} | cut_set)
    windows, last_switch, zoomed, zoom_start = [], 0.0, False, 0.0
    for t in candidates:
        minimum = 2.0 if t in cut_set else 3.0
        if t - last_switch >= minimum and duration - t > 2.5:
            if zoomed:
                windows.append((zoom_start, t))
            else:
                zoom_start = t
            zoomed = not zoomed
            last_switch = t
    if zoomed:
        windows.append((zoom_start, duration))
    return windows or [(duration * 0.45, duration)]


def build_pages(tokens, font, tracking, max_width, max_lines, duration):
    """Groups words into caption pages. Returns [(page_tokens, word_ends, page_end)]."""
    pages, current = [], []

    def fits(candidate):
        return len(wrap([w for _, w in candidate], font, tracking, max_width)) <= max_lines

    for t, w in tokens:
        if current:
            gap = t - current[-1][0]
            sentence_end = current[-1][1][-1] in '.?!'
            if (sentence_end and len(current) >= 3) or gap > 1.2 or not fits(current + [(t, w)]):
                pages.append(current)
                current = []
        current.append((t, w))
    if current:
        pages.append(current)

    timed = []
    for index, page in enumerate(pages):
        next_page_start = pages[index + 1][0][0] if index + 1 < len(pages) else duration
        ends = []
        for position, (t, _) in enumerate(page):
            following = page[position + 1][0] if position + 1 < len(page) else next_page_start
            ends.append(min(following, t + 0.9))
        page_end = min(next_page_start, max(ends[-1], page[-1][0] + 0.6))
        if next_page_start - page_end < 0.35:
            page_end = next_page_start
        timed.append((page, ends, page_end))
    return timed
