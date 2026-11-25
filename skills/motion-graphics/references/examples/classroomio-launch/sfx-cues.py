"""Synthesises the sound-effects stem for the launch film, timed to the graphics.

Every sound is generated here (filtered noise, sines, simple reverb), so there is nothing to license.
The stem is a separate track: the original voice/audio is never processed or re-levelled.
Usage: sfx.py <out.wav>
"""
import sys
import wave

import numpy as np

RATE = 44100
LENGTH = 109.1
rng = np.random.default_rng(7)
bus = np.zeros((int(LENGTH * RATE) + RATE, 2), dtype=np.float64)


def db(value):
    return 10 ** (value / 20)


def seconds(duration):
    return np.arange(int(duration * RATE)) / RATE


def one_pole(signal, cutoff):
    """Time-varying one-pole low-pass; `cutoff` may be a scalar or an array (Hz)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), signal.shape)
    alpha = (1 - np.exp(-2 * np.pi * cutoff / RATE)).tolist()
    values = signal.tolist()
    out = [0.0] * len(values)
    state = 0.0
    for index, value in enumerate(values):
        state += alpha[index] * (value - state)
        out[index] = state

    return np.asarray(out)


def highpass(signal, cutoff):
    return signal - one_pole(signal, cutoff)


TAILS = {}


def reverb_tail(decay):
    if decay not in TAILS:
        length = int(decay * RATE)
        tail = rng.standard_normal(length) * np.exp(-6.9 * seconds(decay) / decay)
        TAILS[decay] = one_pole(tail, 5000) / np.sqrt(length) * 6

    return TAILS[decay]


def reverb(signal, decay=1.2, mix=0.25):
    tail = reverb_tail(decay)
    length = len(tail)
    size = len(signal) + length
    wet = np.fft.irfft(np.fft.rfft(signal, size) * np.fft.rfft(tail, size), size)[:size]
    dry = np.concatenate([signal, np.zeros(length)])

    return dry + mix * wet


def place(at, mono, gain_db, pan=0.0, width=0.0):
    """Adds a mono sound at `at` seconds, panned (-1..1); `width` decorrelates the channels slightly."""
    start = int(at * RATE)
    sound = mono * db(gain_db)
    left = sound * np.sqrt(0.5 * (1 - pan))
    right = sound * np.sqrt(0.5 * (1 + pan))
    if width:
        shift = int(width * 0.012 * RATE)
        right = np.concatenate([np.zeros(shift), right[: len(right) - shift]]) if shift else right
    end = min(len(bus), start + len(sound))
    bus[start:end, 0] += left[: end - start]
    bus[start:end, 1] += right[: end - start]


def normalise(signal):
    peak = np.max(np.abs(signal)) or 1

    return signal / peak


def envelope(duration, attack, release, curve=2.0):
    time = seconds(duration)
    rise = np.clip(time / max(attack, 1e-4), 0, 1) ** curve
    fall = np.clip((duration - time) / max(release, 1e-4), 0, 1) ** curve

    return rise * fall


def whoosh(duration, low=300, high=4000, peak=0.6, rising=False):
    noise = rng.standard_normal(int(duration * RATE))
    time = seconds(duration) / duration
    shape = np.exp(-((time - peak) ** 2) / 0.05) if not rising else time ** 3
    cutoff = low + (high - low) * shape
    body = one_pole(noise, cutoff) - one_pole(noise, cutoff * 0.25)

    return normalise(body * shape)


def riser(duration, start=120, end=900):
    time = seconds(duration)
    phase = 2 * np.pi * np.cumsum(start * (end / start) ** (time / duration)) / RATE
    tone = 0.5 * np.sin(phase) + 0.25 * np.sin(2 * phase + 0.3)
    air = whoosh(duration, 400, 7000, rising=True)

    return normalise((tone * 0.5 + air) * (time / duration) ** 2.5)


def impact(size=1.0, low=58):
    duration = 1.6 * size
    time = seconds(duration)
    pitch = low + 70 * np.exp(-time * 18)
    sub = np.sin(2 * np.pi * np.cumsum(pitch) / RATE) * np.exp(-time * 3.2 / size)
    crack = highpass(rng.standard_normal(len(time)), 1800) * np.exp(-time * 60)
    body = one_pole(rng.standard_normal(len(time)), 900) * np.exp(-time * 9)

    return normalise(reverb(sub + 0.35 * crack + 0.8 * body, 1.6 * size, 0.3))


def tick(pitch=2400, length=0.03):
    time = seconds(length)
    blip = np.sin(2 * np.pi * pitch * time) * np.exp(-time * 160)
    click = highpass(rng.standard_normal(len(time)), 3000) * np.exp(-time * 400)

    return normalise(blip + 0.4 * click)


def pop(start=380, end=980, length=0.09):
    time = seconds(length)
    pitch = start * (end / start) ** (time / length)
    tone = np.sin(2 * np.pi * np.cumsum(pitch) / RATE) * np.exp(-time * 38)

    return normalise(reverb(tone, 0.4, 0.15))


def chime(base=1046.5, length=1.4, partials=(1, 2.01, 2.99, 4.2), wet=True):
    time = seconds(length)
    tone = sum(np.sin(2 * np.pi * base * ratio * time) * np.exp(-time * (2.5 + ratio * 1.5)) / ratio for ratio in partials)
    tone = tone * np.clip(time / 0.004, 0, 1)

    return normalise(reverb(tone, 1.2, 0.3) if wet else tone)


def shimmer(duration, density=140, low=2500, high=9000):
    out = np.zeros(int(duration * RATE) + RATE)
    for _ in range(int(duration * density)):
        at = int(rng.uniform(0, duration) * RATE)
        grain = chime(rng.uniform(low, high), 0.25, (1, 2.4), wet=False)
        out[at : at + len(grain)] += grain * rng.uniform(0.2, 1)
    out = out[: int(duration * RATE)] * envelope(duration, duration * 0.2, duration * 0.5, 1)

    return normalise(reverb(out, 1.0, 0.3)[: int(duration * RATE) + RATE // 2])


def glitch(duration):
    time = seconds(duration)
    tone = np.sign(np.sin(2 * np.pi * 220 * time * (1 + 3 * (rng.random(len(time)) > 0.995).cumsum() % 4)))
    gate = (np.floor(time * 38) % 3 != 0).astype(float)
    crushed = np.round(tone * gate * 4) / 4 + 0.3 * rng.standard_normal(len(time)) * gate

    return normalise(highpass(crushed, 500))


def shatter():
    duration = 0.9
    out = np.zeros(int(duration * RATE))
    for _ in range(40):
        at = int(rng.uniform(0, 0.25) ** 1.5 * RATE)
        grain = chime(rng.uniform(2800, 7500), 0.3, (1, 2.7, 5.1), wet=False)
        out[at : at + len(grain)] += grain[: len(out) - at] * rng.uniform(0.2, 1)
    crash = highpass(rng.standard_normal(len(out)), 2500) * np.exp(-seconds(duration) * 12)

    return normalise(out + 0.7 * crash)


def stamp():
    time = seconds(1.2)
    thud = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-time * 30)) / RATE) * np.exp(-time * 9)
    slap = one_pole(highpass(rng.standard_normal(len(time)), 700), 3500) * np.exp(-time * 45)

    return normalise(reverb(thud + 1.1 * slap, 0.7, 0.2))


def keys(count, duration):
    out = np.zeros(int(duration * RATE) + RATE // 10)
    for index in range(count):
        at = int((index / max(count, 1)) * duration * RATE + rng.uniform(-0.008, 0.008) * RATE)
        at = max(0, at)
        click = tick(rng.uniform(1700, 2600), 0.025) * rng.uniform(0.5, 1)
        out[at : at + len(click)] += click

    return out


def hangup():
    time = seconds(0.5)
    first = np.sin(2 * np.pi * 660 * time) * (time < 0.18)
    second = np.sin(2 * np.pi * 440 * time) * (time >= 0.2)

    return normalise(reverb((first + second) * np.exp(-((time % 0.2) * 6)), 0.5, 0.15))


def swell(duration, notes=(196.0, 293.7, 392.0, 587.3)):
    time = seconds(duration)
    pad = sum(np.sin(2 * np.pi * note * time + index) for index, note in enumerate(notes))

    return normalise(one_pole(pad, 2200) * envelope(duration, duration * 0.6, duration * 0.4, 1.6))


def rewind(duration):
    time = seconds(duration)
    rate = 18 + 40 * (time / duration)
    chirps = np.sin(2 * np.pi * np.cumsum(900 * (1 - 0.6 * (time * rate % 1))) / RATE)

    return normalise(highpass(chirps, 400) * envelope(duration, 0.05, 0.2, 1))


def drone(duration):
    time = seconds(duration)
    tone = np.sin(2 * np.pi * 55 * time) + 0.5 * np.sin(2 * np.pi * 82.4 * time) + 0.3 * one_pole(rng.standard_normal(len(time)), 300)

    return normalise(tone * envelope(duration, 0.25, 0.05, 1))


def thunk(pitch=110):
    time = seconds(0.35)
    body = np.sin(2 * np.pi * pitch * time) * np.exp(-time * 16)
    hum = np.sin(2 * np.pi * 120 * time) * 0.2 * np.clip(time / 0.05, 0, 1) * np.exp(-time * 4)

    return normalise(body + hum)


def flash_whoosh(at):
    place(at - 0.35, whoosh(0.55, 600, 9000, rising=True), -22, 0, 1)


# A. Opening wall
place(5.85, whoosh(2.3, 150, 2500, peak=0.55), -27, -0.2, 1)
place(7.0, riser(1.08, 140, 760), -24, 0, 1)
place(8.08, impact(1.1), -11)
place(8.08, shimmer(1.2), -28, 0.3, 1)
place(8.40, whoosh(0.4, 900, 6000, peak=0.4), -28, 0.4)
flash_whoosh(8.866)

# E. The week fills up
place(12.8, whoosh(0.7, 200, 2000, peak=0.4), -31, -0.6)
for at in [13.1, 14.34, 15.17, 15.23, 15.29]:
    place(at, tick(1900), -27, -0.5)
for index in range(7):
    place(15.66 + index * 0.04, tick(1700 + index * 90), -31, -0.5)
for index in range(9):
    place(16.24 + index * 0.035, tick(1800 + index * 80), -31, -0.4)
place(15.76, pop(200, 420, 0.12), -26, -0.5)
place(16.54, pop(200, 420, 0.12), -26, -0.4)
place(17.36, pop(300, 700), -26, -0.3)
place(17.69, impact(0.5, 50), -22)

# F. The call ends and turns to dust
place(18.733, drone(4.58), -31)
place(19.6, hangup(), -24)
place(20.0, whoosh(1.6, 300, 6000, peak=0.35), -25, 0.5, 1)
place(20.0, shimmer(1.6, 220, 3000, 10000), -27, 0.6, 1)
place(20.55, swell(2.6, (110.0, 164.8, 220.0, 329.6)), -26)

# G. The fake "got it"s, then the truth
for index, at in enumerate([23.45, 23.72, 24.05, 24.4, 24.75, 25.15, 25.55]):
    place(at, pop(420 + index * 30, 1000 + index * 40), -24, -0.6 if index % 2 else 0.6)
place(26.46, glitch(0.36), -27, 0, 1)
place(27.12, shatter(), -22, 0, 1)

# B. Trainer corridor
place(28.0, impact(0.8, 52), -16)
for at in [28.89, 29.57, 30.01, 30.59, 31.23, 31.68]:
    place(at - 0.05, whoosh(0.5, 400, 5000, peak=0.25), -24, 0, 1)
    place(at, impact(0.35, 70), -24)
flash_whoosh(32.3)

# C. Teach it once
place(39.3, whoosh(0.5, 300, 4000, peak=0.5), -28)
place(39.45, riser(0.55, 200, 1200), -22, 0, 1)
place(40.0, impact(1.3, 48), -10)
place(40.0, whoosh(1.0, 2000, 12000, peak=0.08), -24, 0, 1)
for index in range(6):
    place(42.22 + index * 0.13 + 0.15, pop(700 + index * 60, 300, 0.1), -27, 0)
for index in range(5):
    place(43.6 + index * 0.16 + 0.12, thunk(140 + index * 20), -22)
place(44.76, shimmer(0.9), -28, 0, 1)
place(46.37, shimmer(1.0, 200, 3500, 9000), -26, 0, 1)
flash_whoosh(47.27)

# H. Your domain, name and logo
place(49.3, whoosh(0.5, 300, 4000, peak=0.5), -28)
place(50.61, keys(19, 0.8), -27, 0.3)
for at in [51.41, 52.49, 53.35]:
    place(at, chime(1318.5, 0.9), -27, -0.5)
place(52.27, glitch(0.3) * 0.5, -32, 0.3)
place(53.18, pop(250, 900, 0.14), -22, -0.2)
place(53.2, shimmer(0.6), -28, 0.3)
flash_whoosh(53.84)

# I. The test
place(54.0, whoosh(0.45, 400, 4000, peak=0.5), -29, 0.6)
for at in [55.5, 56.7, 57.62]:
    place(at - 0.1, whoosh(0.25, 1000, 7000, peak=0.5), -30, 0.6)
for index, at in enumerate([55.0, 56.35, 57.32]):
    place(at, chime(1046.5 * (1.125 ** index), 0.8, (1, 2, 3)), -24, 0.6)
place(58.05, riser(0.85, 300, 1300), -28, 0.6)
place(58.96, chime(1568.0, 1.3), -23, 0.6)
place(58.96, chime(2093.0, 1.3), -27, 0.6)
place(59.3, whoosh(1.15, 150, 6000, rising=True), -21, 0, 1)

# D. Certificate, stamp, systems
place(60.45, whoosh(0.6, 200, 2500, peak=0.3), -26)
place(61.0, shimmer(0.8, 120), -29, 0.2)
place(62.26, whoosh(0.2, 800, 6000, rising=True), -26)
place(62.46, stamp(), -12)
place(63.35, whoosh(0.75, 200, 3000, peak=0.5), -28, -0.5)
place(64.06, whoosh(0.6, 1500, 8000, peak=0.6), -29, 0.2)
place(64.65, impact(0.4, 80), -24)
for index in range(3):
    place(66.54 + index * 0.16, whoosh(0.5, 1500, 8000, peak=0.7), -30, 0.6)
    place(66.54 + index * 0.16 + 0.5, pop(500, 300, 0.1), -27, 0.7)
for index in range(3):
    place(68.96 + index * 0.12, chime(1318.5 * (1.26 ** index), 1.0), -25, 0.7)

# J. The whole team at once
place(70.2, pop(700, 1200), -26)
place(71.3, pop(300, 800), -23)
for index in range(47):
    place(71.9 + index * 0.0125, pop(500 + rng.uniform(0, 600), 1100 + rng.uniform(0, 500), 0.06), -34, rng.uniform(-0.7, 0.7))
place(72.72, impact(1.2, 50), -12)
place(72.72, swell(1.6, (220.0, 277.2, 329.6, 440.0)), -24)
flash_whoosh(73.3)

# K. Public API
place(76.45, whoosh(0.45, 300, 4000, peak=0.5), -28)
place(76.55, keys(60, 0.9), -29, -0.4)
place(77.52, tick(3000, 0.06), -24, -0.4)
place(77.62, keys(7, 0.5) * 0.7, -30, -0.4)
for index in range(5):
    place(78.65 + index * 0.11, whoosh(0.45, 1500, 9000, peak=0.7), -30, 0.6)
    place(78.65 + index * 0.11 + 0.45, pop(600 + index * 80, 400, 0.08), -27, 0.7)
place(79.76, impact(0.5, 70), -22)
place(79.76, chime(784.0, 1.0, (1, 1.5, 2, 3)), -26, 0.5)
flash_whoosh(80.45)

# L. Self-host and open source
place(83.467, impact(0.5, 50), -22)
place(84.3, keys(55, 0.75), -28)
place(85.2, keys(12, 0.35) * 0.6, -32)
place(85.7, keys(40, 0.55), -28)
place(86.4, chime(1318.5, 0.6, (1, 2)), -27)
place(86.4, whoosh(1.2, 120, 3000, peak=0.4), -22, 0, 1)
for index in range(13):
    place(86.55 + index * 0.055, thunk(90 + index * 9), -28 - index * 0.6, -0.6 if index % 2 else 0.6)
place(87.63, impact(1.0, 55), -13)
place(87.63, shimmer(0.9), -27, 0, 1)
flash_whoosh(88.4)

# M. Approved
place(88.6, pop(500, 1300), -23, 0.5)
place(88.65, shimmer(0.5, 80), -30, 0.5)
place(89.81, pop(700, 1400, 0.07), -26, 0.5)

# N. Stop repeating → unique
place(90.3, impact(0.7, 50), -19)
place(91.72, rewind(0.9), -26, 0, 1)
place(91.8, whoosh(0.85, 2000, 300, peak=0.2), -28)
place(92.6, impact(0.4, 60), -24)
for index in range(8):
    place(93.44 + (index + 1) * 0.09, chime([523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5][index], 1.1), -31, -0.6 + index * 0.17)
place(94.6, swell(1.6, (261.6, 329.6, 392.0, 523.3)), -27)
place(94.85, whoosh(1.1, 150, 3500, rising=True), -24, 0, 1)

# O. academy.new → into the end card
place(100.75, whoosh(0.5, 300, 3500, peak=0.5), -28)
place(101.2, whoosh(0.35, 800, 5000, peak=0.5), -31)
for index in range(11):
    place(101.28 + index * (0.7 / 11), tick(rng.uniform(1700, 2500), 0.03), -27 + rng.uniform(-2, 1), 0.1)
place(102.21, thunk(95), -20)
place(102.21, impact(0.6, 60), -21)
place(102.26, shimmer(1.0, 110), -27, 0, 1)
for index in range(8):
    place(102.3 + index * 0.06, pop(400 + index * 70, 900 + index * 60, 0.06), -33, -0.6 + index * 0.17)
place(102.51, pop(500, 1200), -24)
place(103.2, tick(2800, 0.04), -22)
place(103.22, swell(0.85, (392.0, 523.3, 659.3, 784.0)), -27)
place(103.25, whoosh(0.75, 1500, 11000, rising=True), -28, 0, 1)

stem = bus[: int(LENGTH * RATE)]
peak = np.max(np.abs(stem))
if peak > db(-6):
    stem *= db(-6) / peak
pcm = (np.clip(stem, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as handle:
    handle.setnchannels(2)
    handle.setsampwidth(2)
    handle.setframerate(RATE)
    handle.writeframes(pcm.tobytes())
print('peak dBFS', round(20 * np.log10(max(peak, 1e-9)), 1))
