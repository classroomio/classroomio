"""Captures a web page with headless Chrome and crops it to the part an explainer should show."""
import os
import shutil
import subprocess

from PIL import Image

CHROME_NAMES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']
CHROME_APP_PATHS = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
]
USER_AGENT = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
              'Chrome/140.0.0.0 Safari/537.36')


def chrome():
    """CIO_VIDEO_CHROME, then Chrome/Chromium on PATH, then the default app install locations."""
    configured = os.environ.get('CIO_VIDEO_CHROME')
    if configured:
        return configured
    for name in CHROME_NAMES:
        found = shutil.which(name)
        if found:
            return found
    for path in CHROME_APP_PATHS:
        if os.path.exists(path):
            return path
    raise RuntimeError('Chrome or Chromium not found; install it or set CIO_VIDEO_CHROME')


def capture(url, out_path, width=1280, height=1400, scripts=True, timeout=60):
    """Saves a 2x screenshot. Some news sites never settle or show bot walls; retry with scripts=False or another outlet."""
    command = [chrome(), '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--user-agent={USER_AGENT}',
               f'--window-size={width},{height}', '--force-device-scale-factor=2', f'--screenshot={out_path}']
    command += ['--virtual-time-budget=12000'] if scripts else ['--blink-settings=scriptEnabled=false']
    try:
        subprocess.run(command + [url], capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        pass
    if not os.path.exists(out_path):
        raise RuntimeError(f'No screenshot for {url}; the site may block headless browsers')
    return out_path


def crop(path, box, out_path, scale=2):
    """Crops using CSS-pixel coordinates (x0, y0, x1, y1) of the 1x page."""
    Image.open(path).convert('RGB').crop(tuple(round(v * scale) for v in box)).save(out_path)
    return out_path


def preview(path, out_path, factor=4):
    image = Image.open(path)
    image.resize((image.width // factor, image.height // factor)).save(out_path)
    return out_path
