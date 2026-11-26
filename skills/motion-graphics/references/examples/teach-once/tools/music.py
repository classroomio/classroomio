"""Original music bed for teach-once: warm electric piano, soft pad, plucked arpeggio, light drums, round bass.

Usage: music.py <out.wav>
Times are on the final film, which starts at her first word (1.3 s into the cut). The bar is set so bar 12 lands
exactly on "once." (27.86 s); bar 7 (16.25 s, "break that circle?") is the drum drop and bar 8 brings the beat back on "knowledge". Bars 0–1 are an intro, the chords resolve to C major on "once.", and it rings out over the end screen.
Everything is synthesised here, so there is nothing to license.
"""
import sys
import wave

import numpy as np

RATE = 48000
LENGTH = 33.267
BAR = 27.86 / 12
BEAT = BAR / 4
rng = np.random.default_rng(11)

PROGRESSION = [
    {'bass': 41, 'notes': [53, 57, 60, 64]},
    {'bass': 43, 'notes': [55, 59, 62, 64]},
    {'bass': 40, 'notes': [52, 55, 59, 62]},
    {'bass': 45, 'notes': [57, 60, 64, 67]},
]
RESOLVE = {'bass': 36, 'notes': [60, 64, 67, 71, 74]}
INTRO_BARS = 2
DROP_BAR = 7
LAST_BAR = 12


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def chord_at(bar):
    return RESOLVE if bar >= LAST_BAR else PROGRESSION[bar % 4]


def one_pole(signal, cutoff):
    alpha = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    out = np.empty_like(signal)
    level = 0.0
    for index, value in enumerate(signal):
        level += alpha * (value - level)
        out[index] = level

    return out


def lowpass(signal, cutoff):
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1 / RATE)
    spectrum *= 1 / np.sqrt(1 + (freqs / cutoff) ** 4)

    return np.fft.irfft(spectrum, len(signal))


def highpass(signal, cutoff):
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1 / RATE)
    spectrum *= 1 / np.sqrt(1 + (cutoff / np.maximum(freqs, 1)) ** 4)

    return np.fft.irfft(spectrum, len(signal))


class Bus:
    def __init__(self):
        self.dry = np.zeros((int(LENGTH * RATE) + RATE * 3, 2))
        self.send = np.zeros_like(self.dry)

    def add(self, at, mono, gain=1.0, pan=0.0, reverb=0.2):
        start = int(at * RATE)
        if start >= len(self.dry):
            return

        end = min(len(self.dry), start + len(mono))
        piece = mono[: end - start] * gain
        left, right = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        self.dry[start:end, 0] += piece * left
        self.dry[start:end, 1] += piece * right
        self.send[start:end, 0] += piece * left * reverb
        self.send[start:end, 1] += piece * right * reverb


def times(duration):
    return np.arange(int(duration * RATE)) / RATE


def electric_piano(midi, duration, velocity=1.0):
    """Two-operator FM, Rhodes-like: a bell-ish attack that mellows into a sine."""
    time = times(duration)
    freq = hz(midi)
    index = 1.6 * velocity * np.exp(-time * 4.0) + 0.25
    tine = 0.35 * velocity * np.exp(-time * 30) * np.sin(2 * np.pi * freq * 14 * time)
    tone = np.sin(2 * np.pi * freq * time + index * np.sin(2 * np.pi * freq * time) + tine)
    envelope = np.minimum(time / 0.004, 1) * np.exp(-time * (0.9 + freq / 900))
    release = np.clip((duration - time) / 0.12, 0, 1)

    return tone * envelope * release * velocity


def pluck(midi, duration=0.9):
    """Karplus-Strong string, softened."""
    freq = hz(midi)
    period = int(RATE / freq)
    total = int(duration * RATE)
    buffer = lowpass(rng.standard_normal(period), 3000)
    out = np.empty(total)
    for index in range(total):
        value = buffer[index % period]
        out[index] = value
        buffer[index % period] = 0.996 * 0.5 * (value + buffer[(index + 1) % period])

    return out / (np.max(np.abs(out)) or 1) * np.exp(-times(duration) * 2.2)


def pad(notes, duration):
    time = times(duration)
    tone = np.zeros(len(time))
    for midi in notes:
        for detune in (-0.0045, 0.0, 0.0045):
            freq = hz(midi) * (1 + detune)
            phase = rng.uniform(0, 2 * np.pi)
            tone += sum(np.sin(2 * np.pi * freq * harmonic * time + phase * harmonic) / harmonic for harmonic in range(1, 9))
    tone = lowpass(tone, 1100)
    envelope = np.minimum(time / 0.7, 1) * np.clip((duration - time) / 0.6, 0, 1)

    return tone * envelope / (np.max(np.abs(tone)) or 1)


def bass(midi, duration):
    time = times(duration)
    freq = hz(midi)
    tone = np.tanh(1.6 * (np.sin(2 * np.pi * freq * time) + 0.25 * np.sin(4 * np.pi * freq * time)))
    envelope = np.minimum(time / 0.01, 1) * np.exp(-time * 1.2) * np.clip((duration - time) / 0.06, 0, 1)

    return tone * envelope


def kick():
    time = times(0.4)
    pitch = 46 + 70 * np.exp(-time * 32)
    body = np.sin(2 * np.pi * np.cumsum(pitch) / RATE) * np.exp(-time * 8)
    click = highpass(rng.standard_normal(len(time)), 2500) * np.exp(-time * 300) * 0.15

    return body + click


def hat(length=0.06):
    time = times(length)

    return highpass(rng.standard_normal(len(time)), 7500) * np.exp(-time * 70)


def snap():
    time = times(0.18)
    noise = highpass(lowpass(rng.standard_normal(len(time)), 5000), 1200) * np.exp(-time * 28)
    knock = np.sin(2 * np.pi * 820 * time) * np.exp(-time * 60) * 0.4

    return noise + knock


def swell(duration):
    time = times(duration)
    raw = highpass(rng.standard_normal(len(time)), 600)
    opening = (time / duration) ** 2
    noise = lowpass(raw, 900) * (1 - opening) + lowpass(raw, 6000) * opening

    return noise * (time / duration) ** 2.5


def reverb_ir(seconds=2.2):
    time = times(seconds)
    channels = []
    for _ in range(2):
        tail = lowpass(rng.standard_normal(len(time)), 5200) * np.exp(-time / 0.55)
        tail[: int(0.012 * RATE)] = 0
        channels.append(tail / np.sqrt(np.sum(tail ** 2)))

    return channels


def convolve(signal, ir):
    size = len(signal) + len(ir)
    return np.fft.irfft(np.fft.rfft(signal, size) * np.fft.rfft(ir, size), size)[: len(signal)]


def compose():
    bus = Bus()
    total_bars = int(np.ceil(LENGTH / BAR))
    arp_pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    for bar in range(total_bars):
        start = bar * BAR
        chord = chord_at(bar)
        is_end = bar >= LAST_BAR
        drums = INTRO_BARS <= bar < LAST_BAR and bar != DROP_BAR
        lift = bar >= DROP_BAR + 1 and not is_end

        if bar <= LAST_BAR:
            hold = BAR * (2.4 if is_end else 1.0)
            bus.add(start, pad(chord['notes'], hold + 0.5), 0.11, 0, 0.45)
            for order, midi in enumerate(chord['notes']):
                strum = order * 0.012
                bus.add(start + strum, electric_piano(midi, hold if is_end else BEAT * 2.2, 0.85), 0.085, -0.15 + order * 0.1, 0.3)
                if not is_end:
                    bus.add(start + BEAT * 2.5 + strum, electric_piano(midi, BEAT * 1.4, 0.5), 0.06, -0.15 + order * 0.1, 0.3)

        if bar >= 1 and not is_end:
            for step, note_index in enumerate(arp_pattern):
                notes = chord['notes']
                midi = notes[note_index % len(notes)] + 12
                gain = 0.05 if bar != DROP_BAR else 0.035
                bus.add(start + step * BEAT / 2, pluck(midi, 0.8), gain, 0.45 if step % 2 else -0.35, 0.4)
                if lift and step % 2 == 0:
                    bus.add(start + step * BEAT / 2 + BEAT / 4, pluck(midi + 12, 0.5), 0.022, 0.6, 0.5)

        if bar >= INTRO_BARS and bar != DROP_BAR and not is_end:
            bus.add(start, bass(chord['bass'], BEAT * 1.5), 0.16, 0, 0.0)
            bus.add(start + BEAT * 2.5, bass(chord['bass'] + (7 if bar % 2 else 12), BEAT * 1.2), 0.12, 0, 0.0)

        if drums:
            for beat in range(4):
                if beat in (0, 2):
                    bus.add(start + beat * BEAT, kick(), 0.2, 0, 0.02)
                if beat in (1, 3):
                    bus.add(start + beat * BEAT, snap(), 0.07, 0.1, 0.35)
                bus.add(start + beat * BEAT + BEAT / 2, hat(), 0.05, 0.3, 0.1)
                if lift:
                    bus.add(start + beat * BEAT + BEAT * 0.75, hat(0.03), 0.025, -0.3, 0.1)

    bus.add((DROP_BAR + 1) * BAR - 1.4, swell(1.4), 0.05, 0, 0.5)
    bus.add(LAST_BAR * BAR - 1.2, swell(1.2), 0.04, 0, 0.6)
    bus.add(LAST_BAR * BAR, pluck(RESOLVE['notes'][-1] + 12, 2.5), 0.06, 0.2, 0.7)
    bus.add(LAST_BAR * BAR, bass(RESOLVE['bass'] + 12, BAR * 1.8), 0.13, 0, 0.0)

    ir = reverb_ir()
    wet = np.stack([convolve(bus.send[:, channel], ir[channel]) for channel in range(2)], -1)
    mix = bus.dry + wet * 0.9
    mix = mix[: int(LENGTH * RATE)]
    mix = np.tanh(mix * 1.4) / 1.4
    fade = np.clip((LENGTH - 0.05 - np.arange(len(mix)) / RATE) / 2.0, 0, 1)[:, None]

    return mix * fade


def write(path, stereo):
    peak = np.max(np.abs(stereo))
    stereo = stereo / peak * 10 ** (-1 / 20)
    pcm = (stereo * 32767).astype('<i2')
    with wave.open(path, 'wb') as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(pcm.tobytes())


if __name__ == '__main__':
    write(sys.argv[1], compose())
