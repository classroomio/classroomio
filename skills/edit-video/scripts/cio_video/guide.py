"""Builds the branded posting-guide PDF from each clip's `posts` copy and the render metadata."""
import html
import json
import os
import re
import subprocess

from . import brand
from .screenshot import chrome

FILES = [
    ('*-9x16.mp4', '1080×1920 vertical: hook pre-roll, headline, video, word-by-word captions, progress bar, explainer '
                   'panels and the ClassroomIO sign-off. Captions stay clear of each app’s own buttons.',
     'YouTube Shorts, Instagram Reels, LinkedIn'),
    ('*-16x9.mp4', '1920×1080 landscape, explainer style: the screen splits when something is mentioned and the biggest '
                   'moments take over the full screen.', 'X, YouTube, LinkedIn desktop'),
    ('thumbnails/*.png', '1280×720 YouTube thumbnail from the brand’s “Pain” launch frame.', 'YouTube uploads'),
    ('captions/*.srt', 'Caption files for the edited cuts. The 9:16 file includes the hook.', 'YouTube (search)'),
    ('sign-off/*.mp4', 'The 5-second ClassroomIO sign-off on its own, silent, for the end of any recording.', 'Any video'),
]
PLATFORMS = [
    ('YouTube Shorts', '9x16', 'Vertical uploads up to 3 minutes publish as Shorts automatically.'),
    ('YouTube channel', '16x9 + thumbnail', 'Optional. Keep the series together in one playlist.'),
    ('Instagram', '9x16', 'Post as a Reel. Reels up to 3 minutes can be recommended to new audiences.'),
    ('LinkedIn', '9x16', 'Native vertical video reaches furthest. Post from a personal profile, then reshare from the page.'),
    ('X', '16x9', 'Landscape fills the timeline. Standard accounts can upload up to 2 min 20 s.'),
]
HOW_TO = {
    'YouTube Shorts': ['Studio → Create → Upload videos → the 9x16 file.', 'Paste the title and description. Add it to the playlist.',
                       'Captions are burned in, so leave auto-captions off by default.'],
    'YouTube regular video': ['Upload the 16x9 file and the thumbnail.', 'Subtitles → Upload file → the -16x9.srt (helps search).',
                              'Put the end screen over the 5-second sign-off.'],
    'Instagram Reels': ['+ → Reel → the 9x16 file. Skip Instagram’s caption stickers.',
                        'Cover: the first frame, adjusted so the headline sits in the square crop.', 'Paste the caption.'],
    'LinkedIn': ['Start a post → Video → the 9x16 file.', 'Paste the LinkedIn text.', 'Put the link in the first comment.'],
    'X': ['Upload the 16x9 file natively; don’t post a YouTube link.', 'Paste the X copy.'],
}


def esc(text):
    return html.escape(text or '').replace('\n', '<br>')


def validate(clip):
    """Returns copy problems: X over 280 characters, em/en dashes, exclamation marks (docs/content.md)."""
    posts = clip.get('posts', {})
    problems = []
    if len(posts.get('x', '')) > 280:
        problems.append(f"{clip['id']}: X copy is {len(posts['x'])} characters")
    for key, value in posts.items():
        if isinstance(value, str) and re.search(r'[—–]', value):
            problems.append(f"{clip['id']}: {key} uses an em/en dash")
        if isinstance(value, str) and '!' in value:
            problems.append(f"{clip['id']}: {key} uses an exclamation mark")
    return problems


def clock(seconds):
    return f'{int(seconds // 60)}:{int(round(seconds) % 60):02d}' if seconds else ''


def card(label, body, count=False):
    counter = f'<span class="count">{len(body)} chars</span>' if count else ''
    return f'<div class="cap"><div class="lab">{label}{counter}</div><div class="body">{esc(body)}</div></div>'


def clip_page(clip, meta, footer):
    posts = clip.get('posts', {})
    lengths = ' · '.join(filter(None, [clock(meta.get('duration_16x9')), clock(meta.get('duration_9x16'))]))
    return f'''<section class="clip">
  <div class="eyebrow">{esc(posts.get('date', '').upper())} · EP {clip['number']:02d} · {lengths}</div>
  <h2>{esc(posts.get('youtube_title', clip['title']))}</h2>
  <div class="files">{clip['id']}-9x16.mp4 · {clip['id']}-16x9.mp4 · thumbnails/{clip['id']}-thumbnail.png · captions/{clip['id']}-*.srt</div>
  <div class="grid">
    {card('YOUTUBE · TITLE', posts.get('youtube_title', clip['title']), True)}
    {card('YOUTUBE · DESCRIPTION', posts.get('youtube_description', '') + footer)}
    {card('X', posts.get('x', ''), True)}
    {card('INSTAGRAM REELS', posts.get('instagram', ''))}
  </div>
  {card('LINKEDIN', posts.get('linkedin', ''))}
</section>'''


STYLE = '''@font-face { font-family: Geist; src: url('file://FONTS/Geist-Variable-latin.woff2') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'Geist Mono'; src: url('file://FONTS/GeistMono-latin.woff2') format('woff2'); font-weight: 100 900; }
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: Geist; color: #2A251D; font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1 { font-size: 40pt; font-weight: 700; letter-spacing: -0.05em; line-height: 0.98; color: #17140F; margin: 18px 0 14px; }
h2 { font-size: 17pt; font-weight: 700; letter-spacing: -0.035em; line-height: 1.1; color: #17140F; margin: 4px 0 6px; }
h3 { font-size: 12.5pt; font-weight: 700; color: #17140F; margin: 18px 0 4px; }
.eyebrow, .lab, .mono, .files { font-family: 'Geist Mono'; }
.eyebrow { font-size: 8pt; letter-spacing: 0.12em; color: #0233BD; margin-top: 22px; }
.lede { font-size: 12.5pt; max-width: 150mm; }
.cover { background: #17140F; color: #FDFBF7; margin: -18mm -16mm 0; padding: 26mm 16mm 16mm; page-break-after: always; min-height: 120mm; }
.cover h1 { color: #FDFBF7; } .cover .eyebrow { color: #ADC3FF; margin-top: 0; } .cover .lede { color: #E3DACA; }
.cover .band { background: #0233BD; color: #fff; margin: 14mm -16mm 0; padding: 6mm 16mm; font-family: 'Geist Mono'; font-size: 9pt; letter-spacing: 0.1em; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
td, th { text-align: left; padding: 6px 8px 6px 0; border-bottom: 1px solid #E3DACA; vertical-align: top; }
th { font-family: 'Geist Mono'; font-weight: 500; font-size: 7.5pt; letter-spacing: 0.1em; color: #6B6152; }
td.mono { font-size: 8.5pt; white-space: nowrap; }
ul { padding-left: 16px; margin: 4px 0; } li { margin: 2px 0; }
.note { background: #F1EEE7; padding: 10px 14px; margin: 12px 0; } .note b { color: #17140F; }
section.clip, section.break { page-break-before: always; }
.files { font-size: 7.5pt; color: #6B6152; margin-bottom: 10px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
.cap { border-top: 1px solid #E3DACA; padding: 7px 0 9px; break-inside: avoid; }
.lab { font-size: 7.5pt; letter-spacing: 0.1em; color: #6B6152; margin-bottom: 3px; display: flex; justify-content: space-between; }
.count { color: #8C8272; } .body { font-size: 9.5pt; color: #17140F; }'''


def build(project, clips):
    """Writes <output>/<name>-posting-guide.pdf. Returns (pdf_path, copy_problems)."""
    settings = project.data.get('guide', {})
    metas = {}
    for clip in clips:
        path = os.path.join(project.clip_work(clip), 'meta.json')
        metas[clip['id']] = json.load(open(path)) if os.path.exists(path) else {}
    problems = [problem for clip in clips for problem in validate(clip)]
    footer = settings.get('youtube_footer', '\n\nClassroomIO is customer training that plugs into your business: https://classroomio.com')
    ordered = sorted(clips, key=lambda clip: clip.get('posts', {}).get('order', clip['number']))
    schedule = ''.join(
        f"<tr><td class='mono'>{esc(clip.get('posts', {}).get('date', ''))}</td>"
        f"<td>{esc(clip.get('posts', {}).get('youtube_title', clip['title']))}</td><td class='mono'>{clip['number']:02d}</td>"
        f"<td class='mono'>{clock(metas[clip['id']].get('duration_16x9'))} · {clock(metas[clip['id']].get('duration_9x16'))}</td></tr>"
        for clip in ordered)
    files = ''.join(f"<tr><td class='mono'>{a}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>" for a, b, c in FILES)
    platforms = ''.join(f"<tr><td><b>{a}</b></td><td class='mono'>{b}</td><td>{esc(c)}</td></tr>" for a, b, c in PLATFORMS)
    how_to = ''.join(f"<h3>{name}</h3><ul>{''.join(f'<li>{esc(step)}</li>' for step in steps)}</ul>" for name, steps in HOW_TO.items())
    notes = ''.join(f"<li><b>{esc(note['title'])}.</b> {esc(note['text'])}</li>" for note in settings.get('notes', []))
    title = settings.get('title', f'{len(clips)} clips. Four platforms. One schedule.')
    doc = f'''<!doctype html><html><head><meta charset="utf-8"><title>{esc(project.series.title())} posting guide</title>
<style>{STYLE.replace('FONTS', os.path.join(brand.DESIGN_DIR, 'fonts'))}</style></head><body>
<div class="cover"><div class="eyebrow">CLASSROOMIO · {esc(project.series)} · POSTING GUIDE</div><h1>{esc(title)}</h1>
<p class="lede">{esc(settings.get('lede', 'How to post each clip on YouTube, X, LinkedIn and Instagram, with copy for every platform, ready to paste.'))}</p>
<div class="band">{esc(settings.get('band', ''))}</div></div>
<div class="eyebrow">01 · WHAT’S IN THE FOLDER</div><h2>{esc(project.output)}</h2>
<table><tr><th>FILE</th><th>WHAT IT IS</th><th>USE ON</th></tr>{files}</table>
<div class="eyebrow">02 · WHICH FILE GOES WHERE</div>
<table><tr><th>PLATFORM</th><th>FILE</th><th>WHY</th></tr>{platforms}</table>
<div class="eyebrow">03 · SCHEDULE</div><p>{esc(settings.get('schedule_intro', ''))}</p>
<table><tr><th>DATE</th><th>CLIP</th><th>#</th><th>16:9 · 9:16</th></tr>{schedule}</table>
<section class="break"><div class="eyebrow">04 · HOW TO POST</div>{how_to}
{f'<div class="note"><b>Before you post</b><ul>{notes}</ul></div>' if notes else ''}</section>
{''.join(clip_page(clip, metas[clip['id']], footer) for clip in ordered)}
</body></html>'''
    name = re.sub(r'[^a-z0-9]+', '-', project.series.lower()).strip('-')
    html_path = os.path.join(project.work, 'guide.html')
    open(html_path, 'w').write(doc)
    pdf = os.path.join(project.output, f'classroomio-{name}-posting-guide.pdf')
    subprocess.run([chrome(), '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
                    f'--print-to-pdf={pdf}', f'file://{html_path}'], check=True, capture_output=True)
    return pdf, problems
