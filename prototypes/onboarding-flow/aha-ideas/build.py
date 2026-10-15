import pathlib
here = pathlib.Path(__file__).parent

def page(n, body, stage='Your academy', seg=4, note=''):
    segs = ''.join(f'<span class="rail-seg {"done" if i < seg else ""}"></span>' for i in range(5))
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Aha idea {n}</title>
<link rel="stylesheet" href="../fonts/geist.css"><link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../onboarding.css"><link rel="stylesheet" href="../brand.css"><link rel="stylesheet" href="w.css"></head><body>
<div class="w"><div class="w-top"><span class="lockup"><img class="mk" src="../logo-mark.svg" alt=""><span class="nm">classroomio</span></span>
<div class="rail"><div class="rail-head"><span class="of">Step {seg} of 5</span><span class="now">{stage}</span></div><div class="rail-segs">{segs}</div></div></div>
<div class="w-body">{body}</div>
<div class="w-foot"><span class="btn btn-ghost">Back</span><span style="display:flex;gap:16px;align-items:center"><span class="eb">{note}</span><span class="btn btn-primary btn-lg">Continue &rarr;</span></span></div></div></body></html>'''
    (here / f'idea-{n}.html').write_text(html)

def nb(kind, title, w, h=70, tone=''):
    return f'<div class="nb {tone}" style="width:{w}px;height:{h}px"><div class="f notch-cutout"><span class="k">{kind}</span><b>{title}</b></div></div>'

def site(name='Northbeam Learning', sub='northbeam-learning', w=700, hero=34, courses=True):
    cards = ''.join(f'''<div style="flex:1;border:1px solid var(--sand-300);border-radius:10px;overflow:hidden;background:#fff"><div style="height:74px;background:{bg}"></div><div style="padding:10px 12px 12px"><b style="font-size:13px;letter-spacing:-.02em">{t}</b><div style="font-size:11px;color:var(--ink-500);margin-top:3px">{m}</div></div></div>''' for t, m, bg in [('Getting started','9 lessons','var(--blue-700)'),('Advanced reporting','6 lessons','var(--ink-900)'),('Certified admin','Quiz and certificate','var(--blue-300)')]) if courses else ''
    return f'''<div class="brw" style="width:{w}px"><div class="brw-bar"><i></i><i></i><i></i><span class="brw-url">https://<b>{sub}</b>.classroomio.com</span></div>
<div class="row" style="padding:14px 22px;border-bottom:1px solid var(--sand-300)"><span style="width:26px;height:26px;border-radius:7px;background:var(--ink-900)"></span><b style="font-size:15px">{name}</b><span style="margin-left:auto;font-size:13px;color:var(--ink-500)">Courses &nbsp; Sign in</span></div>
<div style="padding:30px 22px 22px;background:var(--sand-100)"><h2 class="h" style="font-size:{hero}px;letter-spacing:-.045em">Learn how to get the most from {name.split()[0]}</h2><div class="bar" style="width:60%;margin-top:14px"></div><div class="bar s" style="width:42%;margin-top:8px"></div>
<div class="row" style="margin-top:20px;gap:8px"><span style="height:34px;width:112px;border-radius:8px;background:var(--blue-700)"></span><span style="height:34px;width:84px;border-radius:8px;background:#fff;border:1px solid var(--sand-300)"></span></div></div>
<div class="row" style="padding:16px 22px;gap:12px;align-items:stretch">{cards}</div></div>'''

# 1. Type a name, the whole academy appears
b1 = f'''<div style="height:100%;display:grid;grid-template-columns:520px 1fr;padding:0 40px 0 88px;align-items:center;gap:56px">
<div><p class="eb">Your academy</p><h1 class="h" style="font-size:68px;margin-top:14px">Type a name.<br><span class="swipe">Watch it appear.</span></h1>
<p class="sub" style="margin-top:20px">Your logo, address and first courses fill in as you type. Nothing to build.</p>
<div style="margin-top:36px"><span class="lb">Organisation name</span><div class="ul">Northbeam Learning<span class="cursor"></span></div></div>
<div class="row" style="margin-top:22px;gap:8px"><span class="tg b"><i></i>Address ready</span><span class="tg"><i></i>3 starter courses</span><span class="tg"><i></i>Certificates on</span></div></div>
<div style="position:relative;padding:20px 0">{site(w=760)}
<div class="chip-f" style="position:absolute;right:-8px;top:-44px"><span class="tick">&#10003;</span><span><b style="font-weight:600">Live in 38 seconds</b><br><span style="color:var(--ink-500)">northbeam-learning.classroomio.com</span></span></div></div></div>'''
page(1, b1, 'Your academy', 4, 'Preview updates as you type')

# 2. Describe what you teach, a course outline writes itself
lessons = [('01','Welcome and goals','4 min'),('02','Set up your account','6 min'),('03','Your first report','9 min'),('04','Share with your team','5 min'),('05','Quiz: check your skills','Quiz')]
rows = ''.join(f'<div class="row" style="padding:13px 18px;border-bottom:1px solid var(--sand-300);background:{"var(--blue-50,#EEF3FF)" if i==2 else "#fff"}"><span class="mono" style="font-size:11px;color:var(--ink-500)">{n}</span><b style="font-size:15px;letter-spacing:-.02em;font-weight:600">{t}</b><span style="margin-left:auto;font-size:12px;color:var(--ink-500)">{m}</span></div>' for i,(n,t,m) in enumerate(lessons))
b2 = f'''<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;padding:0 64px 0 88px;align-items:center;gap:64px">
<div><p class="eb">Your first course</p><h1 class="h" style="font-size:64px;margin-top:14px">Say what you teach.<br><span class="swipe">Get a course.</span></h1>
<div class="card" style="margin-top:34px;padding:18px 20px"><span class="lb">Describe it</span><div style="font-size:19px;line-height:1.45;letter-spacing:-.02em">I teach new customers how to set up and report on our analytics product<span class="cursor"></span></div>
<div class="row" style="margin-top:16px"><span class="tg">Beginner</span><span class="tg">20 to 30 min</span><span class="tg">With a quiz</span><span class="btn btn-primary btn-sm" style="margin-left:auto">Draft outline</span></div></div>
<p class="eb" style="margin-top:14px">Example output. Draft courses are always editable.</p></div>
<div class="card" style="overflow:hidden"><div class="row" style="padding:16px 18px;border-bottom:1px solid var(--sand-300)"><span class="tick" style="width:26px;height:26px;border-radius:7px">&#9650;</span><div><b style="font-size:17px;letter-spacing:-.03em">Getting started with Northbeam</b><div style="font-size:12px;color:var(--ink-500);margin-top:2px">5 lessons, about 30 minutes</div></div><span class="tg b" style="margin-left:auto"><i></i>Draft</span></div>{rows}
<div class="row" style="padding:14px 18px;background:var(--sand-100)"><span class="tg"><i></i>Certificate on completion</span><span style="margin-left:auto;font-size:13px;color:var(--ink-500)">Edit any lesson</span></div></div></div>'''
page(2, b2, 'First course', 4, 'About a minute')

# 3. See it as your learner
b3 = f'''<div style="height:100%;display:grid;grid-template-columns:1fr 440px 1fr;align-items:center;padding:0 64px">
<div style="padding-left:24px"><p class="eb">What your learners get</p><h1 class="h" style="font-size:64px;margin-top:14px">Step into<br>their <span class="swipe">shoes.</span></h1><p class="sub" style="margin-top:20px">This is the first lesson as a customer sees it. Branded with your name, ready on any phone.</p></div>
<div style="width:340px;height:590px;margin:0 auto;border-radius:44px;border:10px solid var(--ink-900);background:#fff;overflow:hidden;box-shadow:0 30px 60px -20px rgba(23,20,15,.4)">
<div class="row" style="padding:30px 18px 12px;gap:10px"><span style="width:24px;height:24px;border-radius:7px;background:var(--ink-900)"></span><b style="font-size:14px">Northbeam Learning</b></div>
<div style="margin:0 14px;border-radius:14px;height:170px;background:var(--blue-700);position:relative;overflow:hidden"><div style="position:absolute;left:16px;bottom:14px;color:#fff"><div class="mono" style="font-size:10px;letter-spacing:.1em;opacity:.8">LESSON 03</div><b style="font-size:20px;letter-spacing:-.03em">Your first report</b></div></div>
<div style="padding:16px 18px"><div class="row" style="gap:8px"><div class="bar b" style="flex:3"></div><div class="bar" style="flex:5"></div></div><div style="font-size:12px;color:var(--ink-500);margin-top:8px">3 of 9 lessons</div>
<div style="display:grid;gap:12px;margin-top:18px">
<div class="row"><span class="tick">&#10003;</span><span style="font-size:14px">Welcome and goals</span></div><div class="row"><span class="tick">&#10003;</span><span style="font-size:14px">Set up your account</span></div><div class="row"><span class="tick o"></span><b style="font-size:14px">Your first report</b></div><div class="row"><span class="tick o"></span><span style="font-size:14px;color:var(--ink-500)">Share with your team</span></div></div>
<div class="btn btn-primary" style="width:100%;margin-top:22px;justify-content:center">Continue lesson</div></div></div>
<div style="justify-self:end;display:grid;gap:14px;padding-right:24px"><div class="chip-f"><span class="ring"></span><span><b style="font-weight:600">33% complete</b><br><span style="color:var(--ink-500)">Getting started</span></span></div>{nb('CERTIFICATE','Certified admin',260,68,'ink')}<div class="chip-f"><span class="avs"><span>AO</span><span>JS</span><span>+9</span></span><span style="color:var(--ink-500)">11 learners</span></div></div></div>'''
page(3, b3, 'Preview', 5, 'Sample learner')

# 4. Dashboard with real shape on day one
def stat(k, v, d): return f'<div class="card" style="padding:16px 18px"><div class="eb">{k}</div><div style="font-size:38px;font-weight:800;letter-spacing:-.05em;margin-top:8px">{v}</div><div style="font-size:12px;color:var(--ink-500)">{d}</div></div>'
bars = ''.join(f'<span style="flex:1;border-radius:4px 4px 0 0;background:{"var(--blue-700)" if i>4 else "var(--blue-300)"};height:{h}%"></span>' for i,h in enumerate([18,24,22,34,40,52,66,78]))
steps = [('Create your academy',1),('Add your first course',1),('Invite a learner',0),('Share your link',0)]
sl = ''.join(f'<div class="row" style="padding:11px 0;border-bottom:1px solid var(--sand-300)"><span class="tick {"" if d else "o"}">&#10003;</span><span style="font-size:15px;{"" if d else "font-weight:600"}">{t}</span></div>' for t,d in steps)
b4 = f'''<div style="height:100%;padding:28px 64px 0 88px"><p class="eb">Your dashboard</p><h1 class="h" style="font-size:56px;margin-top:12px">Day one already looks <span class="swipe">alive.</span></h1>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 360px;gap:16px;margin-top:30px;align-items:start">
<div style="grid-column:1/4;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">{stat('Learners','12','4 joined this week')}{stat('Completion','68%','Getting started')}{stat('Certificates','3','Issued')}
<div class="card" style="grid-column:1/4;padding:18px 20px"><div class="row"><b style="font-size:16px;letter-spacing:-.02em">Activity, last 8 weeks</b><span class="tg" style="margin-left:auto">Sample data</span></div><div style="display:flex;align-items:flex-end;gap:10px;height:150px;margin-top:18px">{bars}</div></div></div>
<div class="card" style="padding:18px 20px"><div class="row"><b style="font-size:16px;letter-spacing:-.02em">Get started</b><span class="mono" style="margin-left:auto;font-size:12px;color:var(--ink-500)">2 of 4</span></div><div class="bar" style="margin:14px 0 4px"><div class="bar b" style="width:50%"></div></div>{sl}<div class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center">Invite a learner</div></div></div></div>'''
page(4, b4, 'Dashboard', 5, 'Sample data is clearly labelled')

# 5. Launch moment
b5 = f'''<div style="height:100%;display:grid;grid-template-columns:560px 1fr;padding:0 56px 0 88px;align-items:center;gap:56px;background:radial-gradient(900px 500px at 78% 40%,rgba(2,51,189,.08),transparent 70%)">
<div><div class="tg b"><i></i>Live</div><h1 class="h" style="font-size:84px;margin-top:20px">Your academy<br>is <span class="swipe">open.</span></h1>
<p class="sub" style="margin-top:20px">Northbeam Learning is live and ready for its first learner.</p>
<div class="url" style="margin-top:30px;width:480px;height:52px"><i>https://</i><b style="font-weight:600">northbeam-learning</b><span>.classroomio.com</span></div>
<div class="row" style="margin-top:18px;gap:10px"><span class="btn btn-primary btn-lg">Open my academy</span><span class="btn btn-outline btn-lg">Copy link</span></div>
<div class="row" style="margin-top:26px;gap:8px"><span class="tg"><i></i>Invite a learner</span><span class="tg"><i></i>Add a course</span><span class="tg"><i></i>Take the tour</span></div></div>
<div style="position:relative;padding:30px 0">{site(w=700)}
<div class="chip-f" style="position:absolute;left:-40px;bottom:-20px"><span class="avs"><span>AO</span><span>JS</span><span>+9</span></span><span style="color:var(--ink-500)">Invite your first learners</span></div>
<div style="position:absolute;right:-24px;top:-34px">{nb('CERTIFICATE','Certified admin',230,66,'blue')}</div></div></div>'''
page(5, b5, 'Complete', 5, 'You are ready')
