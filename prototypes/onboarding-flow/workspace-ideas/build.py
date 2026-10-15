import pathlib
here = pathlib.Path(__file__).parent

def page(n, body, note='Takes about a minute'):
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Workspace idea {n}</title>
<link rel="stylesheet" href="../fonts/geist.css"><link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../onboarding.css"><link rel="stylesheet" href="../brand.css"><link rel="stylesheet" href="w.css"></head><body>
<div class="w"><div class="w-top"><span class="lockup"><img class="mk" src="../logo-mark.svg" alt=""><span class="nm">classroomio</span></span>
<div class="rail"><div class="rail-head"><span class="of">Step 3 of 5</span><span class="now">Workspace</span></div><div class="rail-segs"><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg"></span><span class="rail-seg"></span></div></div></div>
<div class="w-body">{body}</div>
<div class="w-foot"><span class="btn btn-ghost">Back</span><span style="display:flex;gap:16px;align-items:center"><span class="eb">{note}</span><span class="btn btn-primary btn-lg">Create workspace &rarr;</span></span></div></div></body></html>'''
    (here / f'idea-{n}.html').write_text(html)

def nb(kind, title, w, h=70, tone=''):
    return f'<div class="nb {tone}" style="width:{w}px;height:{h}px"><div class="f notch-cutout"><span class="k">{kind}</span><b>{title}</b></div></div>'

def field(label, value, ph=''):
    return f'<div><span class="lb">{label}</span><div class="in">{value or f"<span style=color:var(--ink-400)>{ph}</span>"}</div></div>'

def urlfield(sub='northbeam-learning'):
    return f'<div><span class="lb">Academy address</span><div class="url"><i>https://</i><b>{sub}</b><span>.classroomio.com</span></div></div>'

# 1 Minimal editorial
b1 = f'''<div style="height:100%;display:grid;grid-template-columns:1fr 520px;padding:0 32px 0 96px">
<div style="align-self:center;max-width:720px">
<p class="eb">Your workspace</p>
<h1 class="h" style="font-size:88px;margin-top:16px">Name your<br><span class="swipe">academy</span></h1>
<p class="sub" style="margin-top:22px">Customers see this name on every course and certificate. You can change it later in Settings.</p>
<div style="display:grid;gap:26px;margin-top:44px;max-width:560px">
 <div><span class="lb">Organisation name</span><div class="ul">Northbeam Learning</div></div>
 <div><span class="lb">Address</span><div class="ul dim"><span style="color:var(--ink-900)">northbeam-learning</span>.classroomio.com</div></div>
</div></div>
<div style="display:grid;place-items:center"><div style="position:relative;width:360px;height:260px">
 <div style="position:absolute;left:0;top:0">{nb('COURSE','Getting started',300,64)}</div>
 <div style="position:absolute;left:0;top:60px;z-index:2">{nb('PATH','Onboarding',330,64,'tint')}</div>
 <div style="position:absolute;left:0;top:120px;z-index:3">{nb('WORKSPACE','Northbeam Learning',300,76,'blue')}</div>
</div></div></div>'''
page(1,b1,'Two fields')

# 2 Floating canvas
b2 = f'''<div style="height:100%;display:grid;place-items:center;position:relative">
<div style="position:absolute;left:150px;top:90px">{'<div class="chip-f"><i>09</i><span><b style="font-weight:600">Getting started</b><br><span style="color:var(--ink-500)">9 lessons</span></span></div>'}</div>
<div style="position:absolute;right:170px;top:70px"><div class="chip-f"><span class="ring"></span><span><b style="font-weight:600">62% complete</b><br><span style="color:var(--ink-500)">Onboarding path</span></span></div></div>
<div style="position:absolute;left:210px;bottom:90px"><div class="chip-f"><span class="avs"><span>AO</span><span>JS</span><span>+9</span></span><span style="color:var(--ink-500)">11 learners</span></div></div>
<div style="position:absolute;right:140px;bottom:96px">{nb('CERTIFICATE','Certified admin',220,64,'ink')}</div>
<div style="width:520px;text-align:center">
<p class="eb">Your workspace</p>
<h1 class="h" style="font-size:56px;margin-top:14px">Set up your <span class="swipe">academy</span></h1>
<p class="sub" style="margin:14px auto 0">Two details and you are in.</p>
<div style="display:grid;gap:18px;margin-top:34px;text-align:left">{field('Organisation name','Northbeam Learning')}{urlfield()}</div>
</div></div>'''
page(2,b2,'Two fields')

# 3 Asymmetric split
b3 = f'''<div style="height:100%;display:grid;grid-template-columns:560px 1fr;position:relative">
<div style="padding:0 0 40px 64px;display:flex;flex-direction:column;justify-content:flex-end;z-index:3;position:relative">
 <p class="eb">Your workspace</p>
 <h1 class="h" style="font-size:96px;margin:12px 0 0;width:760px;position:relative;z-index:4">Make it<br><span class="swipe">yours.</span></h1>
 <div style="display:grid;gap:18px;margin-top:36px;width:440px">{field('Organisation name','Northbeam Learning')}{urlfield()}</div>
</div>
<div class="wash" style="margin:0 24px 8px 0;border-radius:22px;position:relative;overflow:hidden"><div class="dotfield" style="position:absolute;inset:0"></div>
 <div style="position:absolute;right:-60px;bottom:70px;display:grid;gap:2px;justify-items:start">
  {nb('CERTIFICATE','Certified admin',360,92,'ink')}
  <div style="margin-top:-24px;z-index:2">{nb('QUIZ','Setup check',400,92,'blue')}</div>
  <div style="margin-top:-24px;z-index:3">{nb('LESSON','Invite your team',340,92,'tint')}</div>
  <div style="margin-top:-24px;z-index:4">{nb('LESSON','Getting started',380,92)}</div>
 </div></div></div>'''
page(3,b3,'Two fields')

# 4 Product-native preview
b4 = f'''<div style="height:100%;display:grid;grid-template-columns:600px 1fr;gap:0;padding:0 48px 0 96px;align-items:center">
<div>
<p class="eb">Your workspace</p>
<h1 class="h" style="font-size:60px;margin-top:14px">Set up your <span class="swipe">academy</span></h1>
<p class="sub">This is the address and name your customers will see.</p>
<div style="display:grid;gap:18px;margin-top:34px;max-width:480px">{field('Organisation name','Northbeam Learning')}{urlfield()}</div>
</div>
<div style="padding-left:64px"><div class="brw" style="width:640px"><div class="brw-bar"><i></i><i></i><i></i><span class="brw-url">https://<b>northbeam-learning</b>.classroomio.com</span></div>
 <div style="display:flex;align-items:center;gap:10px;padding:16px 22px;border-bottom:1px solid var(--sand-300)"><span style="width:26px;height:26px;border-radius:7px;background:var(--ink-900)"></span><b style="font-size:15px">Northbeam Learning</b><span style="margin-left:auto;font-size:13px;color:var(--ink-500)">Courses</span></div>
 <div style="padding:34px 22px 22px;background:#f3f3f4"><h2 class="h" style="font-size:34px;letter-spacing:-.04em">Learn Northbeam Learning</h2><div style="height:10px;width:62%;background:var(--sand-300);border-radius:5px;margin-top:16px"></div><div style="height:10px;width:44%;background:var(--sand-300);border-radius:5px;margin-top:8px"></div>
 <div style="display:flex;gap:8px;margin-top:22px"><span style="height:36px;width:110px;border-radius:8px;background:var(--blue-700)"></span><span style="height:36px;width:80px;border-radius:8px;background:#fff;border:1px solid var(--sand-300)"></span></div></div>
 <div style="padding:6px 22px 16px"><div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--sand-300)"><span style="width:96px;height:60px;background:var(--sand-200);border-radius:6px"></span><span><div style="height:10px;width:200px;background:var(--sand-300);border-radius:5px"></div><div style="height:8px;width:140px;background:var(--sand-200);border-radius:5px;margin-top:10px"></div></span></div></div>
</div><p class="eb" style="margin:14px 0 0 64px">Your academy, as visitors will see it</p></div></div>'''
page(4,b4,'Updates as you type')

# 5 Spontaneous organic
b5 = f'''<div style="height:100%;position:relative;overflow:hidden">
<div style="position:absolute;left:-30px;bottom:-110px;font-size:430px;font-weight:800;letter-spacing:-.07em;color:var(--sand-200);line-height:1;white-space:nowrap;user-select:none">academy</div>
<div style="position:absolute;right:120px;top:60px;z-index:1">{nb('WORKSPACE','Northbeam Learning',320,74,'blue')}</div>
<div style="position:absolute;right:210px;top:118px;z-index:0">{nb('PATH','Onboarding',300,74,'tint')}</div>
<div style="position:absolute;left:96px;top:70px;z-index:2"><p class="eb">01 &middot; you are setting up</p>
 <h1 class="h" style="font-size:72px;margin-top:12px;max-width:640px">A home for<br>what you <span class="swipe">teach</span></h1></div>
<div style="position:absolute;left:260px;top:430px;width:480px;z-index:2"><span class="lb">02 &middot; organisation name</span><div class="ul">Northbeam Learning</div></div>
<div style="position:absolute;left:150px;top:560px;width:560px;z-index:2"><span class="lb">03 &middot; address</span><div class="ul dim"><span style="color:var(--ink-900)">northbeam-learning</span>.classroomio.com</div></div>
<p class="sub" style="position:absolute;left:96px;top:300px;max-width:34ch;z-index:2">Customers see this on every course and certificate. Change it any time.</p></div>'''
page(5,b5,'Two fields')

cards=[('1','Minimal editorial','Typography-led. Underline fields, the address as live type, and one small block stack as the only image.'),
('2','Floating workspace canvas','A centred form with four sparse fragments of course, progress, learners and a certificate around it.'),
('3','Asymmetric split','The headline crosses the seam of a wash panel; the form sits low and left, blocks bleed off the right edge.'),
('4','Product-native preview','The form beside a restrained fragment of the academy: its address bar and header update as you type.'),
('5','Spontaneous composition','Off-grid: a ghost word, staggered fields with mono numbering and two layered blocks in the corner.')]
g=''.join(f'<a class="g" href="idea-{n}.html"><img src="png/idea-{n}.png" alt=""><div><span class="eb">Concept {n}</span><b>{t}</b><p>{d}</p></div></a>' for n,t,d in cards)
(here/'index.html').write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace setup, five directions</title>
<link rel="stylesheet" href="../fonts/geist.css"><link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../brand.css">
<style>body{{background:var(--paper);margin:0}}.wrap{{max-width:1120px;margin:0 auto;padding:56px 24px 90px}}h1{{font-size:44px;font-weight:800;letter-spacing:-.05em;margin:10px 0 8px}}.l{{color:var(--ink-500);max-width:66ch;line-height:1.6}}.gr{{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}}.g{{display:block;border:1px solid var(--sand-300);border-radius:14px;overflow:hidden;background:#fff;text-decoration:none;color:inherit}}.g img{{width:100%;display:block;border-bottom:1px solid var(--sand-300)}}.g div{{padding:16px 18px 20px}}.g b{{display:block;font-size:18px;letter-spacing:-.02em;margin:6px 0 4px}}.g p{{margin:0;color:var(--ink-500);font-size:14px;line-height:1.5}}.pick{{border-color:var(--blue-700);box-shadow:0 0 0 1px var(--blue-700)}}.eb{{font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-500)}}@media(max-width:800px){{.gr{{grid-template-columns:1fr}}}}</style></head><body><div class="wrap"><p class="eb">Workspace setup</p><h1>Five directions for <span class="swipe">one screen</span></h1>
<p class="l">The production screen asks for a full name, an organisation name and an academy address. It feels busy because a testimonial panel, an illustration, a tagline and a stepper all compete with those three fields. All five keep the same fields and validation and remove everything else. Concept 4 is the one built into the flow.</p><div class="gr">{g.replace('href="idea-4.html"','href="idea-4.html" ').replace('class="g" href="idea-4.html"','class="g pick" href="idea-4.html"')}</div></div></body></html>''')
print('built')
