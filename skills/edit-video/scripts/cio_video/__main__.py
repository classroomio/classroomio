import argparse
import json
import os
import shutil
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor

from . import captions, compose, config, guide, prepare, qa, screenshot, signoff, thumbnail, timeline, transcript


def check(_args):
    problems = []
    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool):
            problems.append(f'{tool} is not on PATH (install ffmpeg 6+ built with arnndn)')
    if shutil.which('ffmpeg'):
        filters = subprocess.run(['ffmpeg', '-hide_banner', '-filters'], capture_output=True, text=True).stdout
        for name in ('arnndn', 'afftdn', 'silencedetect', 'loudnorm', 'ebur128'):
            if f' {name} ' not in filters:
                problems.append(f'ffmpeg lacks the {name} filter')
    for module in ('numpy', 'PIL', 'fontTools', 'brotli'):
        try:
            __import__(module)
        except ImportError:
            problems.append(f'Python module {module} missing (pip install -r requirements.txt)')
    try:
        screenshot.chrome()
    except RuntimeError as error:
        problems.append(f'{error} (needed for screenshots and the guide PDF)')
    print('\n'.join(problems) if problems else 'ok: ffmpeg, filters, Python modules and Chrome are available')
    return 1 if problems else 0


def words(args):
    project = config.Project(args.project)
    for t, word in transcript.load_words(project.transcript, project.work):
        if args.start <= t <= args.end:
            print(f'{t:9.2f}  {word}')


def plan(args):
    project = config.Project(args.project)
    for clip in project.select(args.clip):
        info = prepare.prepare(project, clip)
        print(f"\n{clip['id']}  source {clip['start']:.2f}–{clip['end']:.2f}  "
              f"{info['raw_duration']:.1f}s → {info['duration']:.1f}s after {len(info['removed'])} pause cuts")
        if args.transcript:
            print('  ' + ' '.join(f'[{t:.1f}] {w}' for t, w in info['tokens']))
        for event in timeline.resolve_events(clip, info['tokens'], info['duration']):
            modes = event['spec']['mode']
            print(f"  {event['start']:6.1f}–{min(event['end'], info['duration']):5.1f}  {event['spec']['kind']:<9} "
                  f"16x9:{modes['16x9']:<5} 9x16:{modes['9x16']:<5} \"{event['spec']['trigger']}\"")
        hook = timeline.resolve_hook(clip, info['tokens'], info['duration'])
        if hook:
            print(f"  hook {hook['end'] - hook['start']:.1f}s: \"{' '.join(w for _, w in hook['words'])}\"")


def render(args):
    project = config.Project(args.project)
    clips = project.select(args.clip)
    formats = args.format or project.data['formats']
    if project.sign_off.get('enabled', True):
        signoff.ensure(project)
    with ProcessPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futures = [pool.submit(compose.render_by_id, project.path, clip['id'], formats, args.out) for clip in clips]
        for future in futures:
            clip_id, landscape, vertical = future.result()
            print(f'rendered {clip_id}  16x9 {landscape or "-"}s  9x16 {vertical or "-"}s', flush=True)


def make_sign_off(args):
    project = config.Project(args.project)
    for fmt, path in signoff.ensure(project, force=args.force).items():
        print(fmt, path)


def thumbnails(args):
    project = config.Project(args.project)
    folder = os.path.join(project.output, 'thumbnails')
    os.makedirs(folder, exist_ok=True)
    for clip in project.select(args.clip):
        info = prepare.prepare(project, clip)
        print(thumbnail.render(project, clip, info['trimmed'], info['duration'],
                               os.path.join(folder, f"{clip['id']}-thumbnail.png")))


def write_captions(args):
    project = config.Project(args.project)
    folder = os.path.join(project.output, 'captions')
    os.makedirs(folder, exist_ok=True)
    for clip in project.select(args.clip):
        meta_path = os.path.join(project.clip_work(clip), 'meta.json')
        if not os.path.exists(meta_path):
            print(f"skip {clip['id']}: render it first")
            continue
        meta = json.load(open(meta_path))
        tokens = [tuple(token) for token in meta['tokens']]
        captions.write_srt(os.path.join(folder, f"{clip['id']}-16x9.srt"), tokens, meta['video_duration'])
        hook = meta.get('hook')
        captions.write_srt(os.path.join(folder, f"{clip['id']}-9x16.srt"), tokens, meta['video_duration'],
                           meta.get('hook_lead', 0.0), hook['text'] if hook else None)
        print(f"captions {clip['id']}")


def run_qa(args):
    project = config.Project(args.project)
    report = qa.check(project, project.select(args.clip), args.format or project.data['formats'])
    for row in report:
        if 'error' in row:
            print(f"{row['clip']}: {row['error']}")
            continue
        flags = []
        if row['lufs'] is None or abs(row['lufs'] - project.audio['loudness']) > 1.0:
            flags.append('LOUDNESS')
        if row['words_on_speech'] < 0.9:
            flags.append('CAPTION SYNC')
        print(f"{row['clip']} {row['format']}  {row['duration']}s  {row['lufs']} LUFS  words on speech "
              f"{row['words_on_speech']:.0%}  cuts {row['cuts']}  {' '.join(flags) or 'ok'}\n  sheet: {row['sheet']}")


def make_guide(args):
    project = config.Project(args.project)
    pdf, problems = guide.build(project, project.select(args.clip))
    for problem in problems:
        print(f'! {problem}')
    print(pdf)


def take_screenshot(args):
    path = screenshot.capture(args.url, args.out, args.width, args.height, scripts=not args.no_js)
    if args.crop:
        screenshot.crop(path, [float(v) for v in args.crop.split(',')], args.out)
    print(screenshot.preview(args.out, args.out.rsplit('.', 1)[0] + '-preview.png'))


def main():
    parser = argparse.ArgumentParser(prog='cio_video', description='ClassroomIO video editing pipeline')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('check').set_defaults(func=check)

    command = sub.add_parser('words', help='print source transcript words between two times')
    command.add_argument('project')
    command.add_argument('--start', type=float, default=0.0)
    command.add_argument('--end', type=float, default=1e9)
    command.set_defaults(func=words)

    command = sub.add_parser('plan', help='trim, denoise and print each clip timeline with explainer timings')
    command.add_argument('project')
    command.add_argument('--clip', nargs='*')
    command.add_argument('--transcript', action='store_true', help='also print the cleaned, trimmed transcript')
    command.set_defaults(func=plan)

    command = sub.add_parser('render', help='render clips')
    command.add_argument('project')
    command.add_argument('--clip', nargs='*')
    command.add_argument('--format', nargs='*', choices=['16x9', '9x16'])
    command.add_argument('--jobs', type=int, default=3)
    command.add_argument('--out', help='render somewhere other than the project output (previews)')
    command.set_defaults(func=render)

    command = sub.add_parser('sign-off', help='render the standalone sign-off clips')
    command.add_argument('project')
    command.add_argument('--force', action='store_true')
    command.set_defaults(func=make_sign_off)

    for name, func in (('thumbnails', thumbnails), ('captions', write_captions), ('qa', run_qa), ('guide', make_guide)):
        command = sub.add_parser(name)
        command.add_argument('project')
        command.add_argument('--clip', nargs='*')
        if name == 'qa':
            command.add_argument('--format', nargs='*', choices=['16x9', '9x16'])
        command.set_defaults(func=func)

    command = sub.add_parser('screenshot', help='capture and crop a web page for a browser explainer')
    command.add_argument('url')
    command.add_argument('out')
    command.add_argument('--crop', help='x0,y0,x1,y1 in CSS pixels')
    command.add_argument('--no-js', action='store_true')
    command.add_argument('--width', type=int, default=1280)
    command.add_argument('--height', type=int, default=1400)
    command.set_defaults(func=take_screenshot)

    args = parser.parse_args()
    sys.exit(args.func(args) or 0)


if __name__ == '__main__':
    main()
