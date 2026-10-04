"""Loads a project file and fills in defaults. See references/project-file.md for the schema."""
import copy
import json
import os

from . import brand

DEFAULTS = {
    'series': 'CLASSROOMIO',
    'kind': 'talking-head',
    'output': 'edited',
    'work': 'work',
    'formats': ['16x9', '9x16'],
    'fps': 30,
    'drop_words': ['um', 'uh', 'erm', 'hmm'],
    'corrections': {},
    'phrase_corrections': {'classroom io': 'ClassroomIO', 'classroom.io': 'ClassroomIO', 'class room io': 'ClassroomIO'},
    'audio': {'denoise': True, 'trim_pauses': True, 'pause_db': -35, 'pause_min': 0.4, 'pad_before': 0.12,
              'pad_after': 0.08, 'loudness': -14},
    'sign_off': {'enabled': True, 'headline': ['Set up training', 'once.'], 'swipe': 'once.', 'url': 'CLASSROOMIO.COM',
                 'file': None},
    'thumbnail': {'label': 'Watch the full clip', 'url': 'classroomio.com'},
    'url': 'CLASSROOMIO.COM',
}

FRAMING = {
    'talking-head': {'cx': 0.25, 'vx': 120, 'zoom': True, 'vertical_crop': '4:3', 'split': 'crop'},
    'screen': {'cx': 0.5, 'vx': 240, 'zoom': False, 'vertical_crop': '16:9', 'split': 'fit'},
}


def merge(base, override):
    result = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge(result[key], value)
        else:
            result[key] = value
    return result


class Project:
    def __init__(self, path):
        self.path = os.path.abspath(path)
        self.root = os.path.dirname(self.path)
        raw = json.load(open(self.path))
        self.data = merge(DEFAULTS, raw)
        self.fps = self.data['fps']
        self.series = self.data['series']
        self.source = self.resolve(self.data['source'])
        self.transcript = self.resolve(self.data['transcript'])
        self.output = self.resolve(self.data['output'])
        self.work = self.resolve(self.data['work'])
        self.audio = self.data['audio']
        self.sign_off = self.data['sign_off']
        self.clips = [self.clip(index, entry) for index, entry in enumerate(self.data['clips'], 1)]
        os.makedirs(self.output, exist_ok=True)
        os.makedirs(self.work, exist_ok=True)

    def resolve(self, value):
        """Project-relative path, or a design-system asset when prefixed with 'design:'."""
        if value is None:
            return None
        if value.startswith('design:'):
            return brand.design_asset(value[len('design:'):])
        return value if os.path.isabs(value) else os.path.normpath(os.path.join(self.root, os.path.expanduser(value)))

    def clip(self, number, entry):
        clip = copy.deepcopy(entry)
        clip['number'] = clip.get('number', number)
        clip['framing'] = merge(FRAMING[self.data['kind']], clip.get('framing'))
        clip['corrections'] = merge(self.data['corrections'], clip.get('corrections'))
        clip['phrase_corrections'] = merge(self.data['phrase_corrections'], clip.get('phrase_corrections'))
        clip.setdefault('title', clip['id'])
        clip.setdefault('thumbnail', clip['title'])
        clip.setdefault('explainers', [])
        if clip.get('file'):
            clip['file'] = self.resolve(clip['file'])
        for event in clip['explainers']:
            props = event.setdefault('props', {})
            for key in ('image',):
                if props.get(key):
                    props[key] = self.resolve(props[key])
            mode = event.get('mode', 'split')
            event['mode'] = mode if isinstance(mode, dict) else {'16x9': mode, '9x16': mode}
        return clip

    def clip_work(self, clip):
        path = os.path.join(self.work, clip['id'])
        os.makedirs(path, exist_ok=True)
        return path

    def select(self, ids):
        if not ids:
            return self.clips
        return [clip for clip in self.clips if any(clip['id'] == key or clip['id'].startswith(key) for key in ids)]
