import pathlib
here = pathlib.Path(__file__).parent

def page(n, title, body, step_now='Your business'):
    top = f'''<div class="s-top"><span class="lockup"><span class="mk">C</span><span class="nm">ClassroomIO</span></span>
<div class="rail"><div class="rail-head"><span class="of">Step 3 of 4</span><span class="now">{step_now}</span></div><div class="rail-segs"><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg"></span></div></div>
<div class="sp"><span class="btn btn-ghost btn-sm">Restart</span></div></div>'''
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../onboarding.css"><link rel="stylesheet" href="s.css">
<style>:root{{--primary:#1d4ed8;--primary-foreground:#eff6ff}}</style></head><body>
<div class="s s-bg">{top}<div class="s-body">{body}</div></div>
<script src="../proto.js"></script>
<script>document.querySelectorAll('[data-i]').forEach(function(n){{var s=+n.dataset.s||14;n.outerHTML=icon(n.dataset.i,s)}});</script>
</body></html>'''
    (here / f'idea-{n}.html').write_text(html)

def i(name, size=14):
    return f'<i data-i="{name}" data-s="{size}" style="display:inline-flex"></i>'

def foot(note, cta='Continue', back=True):
    return f'''<div class="s-foot"><span class="btn btn-ghost">{'Back' if back else ''}</span><span style="display:flex;gap:16px;align-items:center"><span class="time">{i('zap',13)} {note}</span><span class="btn btn-primary btn-lg">{cta} {i('chevron',15)}</span></span></div>'''

field = lambda label, val, ph='', extra='': f'''<div><div class="lbl">{label}{extra}</div><div class="input" style="height:46px;font-size:15px;display:flex;align-items:center;padding:0 14px;border:1px solid var(--border);border-radius:12px;background:var(--background)">{val or f'<span style="color:var(--muted-foreground)">{ph}</span>'}</div></div>'''

# ---- 1 · big tiles + compact details
tiles = [
 ('rocket','Onboard new customers','Adds a New Customer Onboarding path','#1d4ed8',True),
 ('book','Explain our product','Core how-to courses','#7c3aed',False),
 ('layers','Increase adoption','A path past go-live','#0891b2',False),
 ('lifebuoy','Cut repetitive tickets','A most-asked-questions course','#ea580c',False),
]
t = ''.join(f'<div class="tile1{" on" if on else ""}"><span class="tic" style="background:{c}">{i(ic,22)}</span><b>{lbl}</b><small>{sm}</small>{f"<span class=ck>{i(chr(99)+chr(104)+chr(101)+chr(99)+chr(107),13)}</span>" if on else ""}</div>' for ic,lbl,sm,c,on in tiles)
roles = ['Founder or CEO','Customer Success','Customer Education','Product']
rchips = ''.join(f'<span class="chip" aria-pressed="{"true" if r=="Customer Education" else "false"}" style="padding:7px 13px">{r}</span>' for r in roles)
b1 = f'''<div class="t1"><span class="eyebrow-s">{i('sparkle',12)} Tell us about your business</span>
<h1 class="h1s">What should your academy do first?</h1>
<p class="subs">Pick one outcome. We shape your starter courses around it — you can change everything later.</p>
<div class="t1-grid">{t}</div>
<div class="setup1">
 {field('Company name','Northbeam')}
 {field('Website',"northbeam.io",'', ' <span class="sug">'+i('sparkle',10)+' optional</span>')}
 <div><div class="lbl">You are</div><div style="display:flex;flex-wrap:wrap;gap:7px">{rchips}<span class="chip" style="padding:7px 13px">More {i('chevdown',12)}</span></div></div>
</div></div>{foot('About a minute')}'''
page(1, 'Idea 1', b1)

# ---- 2 · three cards
def card(n, title, grad, done, body, active=False):
    st = f'<span class="done3">{i("check",13)} Done</span>' if done else f'<span class="badge badge-primary-soft">Now</span>'
    return f'''<div class="card3" style="{'border-color:var(--primary);box-shadow:0 0 0 1px var(--primary),0 30px 60px -34px color-mix(in oklab,var(--primary) 55%,transparent)' if active else ''}">
<div class="card3-h" style="background:{grad}"><span class="n">0{n}</span><span class="art"></span><span class="art2"></span><h3 style="position:relative">{title}</h3></div>
<div class="card3-b">{st}{body}</div></div>'''
c1 = card(1,'Your company','linear-gradient(135deg,#1e3a8a,#3b82f6)',True, field('Company name','Northbeam')+field('Website','northbeam.io')+'<p class="hint" style="margin:0">Used for your portal name and the first draft of your courses.</p>')
rl = ''.join(f'<span class="big-chip{" on" if r=="Customer Education" else ""}">{i(ic,16)} {r}</span>' for r,ic in [('Founder or CEO','rocket'),('Customer Success','heart'),('Customer Education','book'),('Product','layers'),('Marketing','megaphone'),('Support','lifebuoy')])
c2 = card(2,'Your role','linear-gradient(135deg,#6d28d9,#a78bfa)',True, f'<div style="display:flex;flex-wrap:wrap;gap:9px">{rl}</div>')
gl = ''.join(f'<span class="big-chip{" on" if r=="Onboard new customers" else ""}" style="width:100%">{i(ic,16)} {r}</span>' for r,ic in [('Onboard new customers','rocket'),('Explain our product','book'),('Increase adoption','layers'),('Cut repetitive tickets','lifebuoy')])
c3 = card(3,'Your first goal','linear-gradient(135deg,#0f766e,#34d399)',False, f'<div style="display:grid;gap:9px">{gl}</div><p class="hint" style="margin:0">Adds a New Customer Onboarding path to your starter content.</p>', True)
b2 = f'''<div class="t2"><div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="eyebrow-s">{i('sparkle',12)} Three quick answers</span><h1 class="h1s">Let's meet your business</h1></div><span class="time">{i('zap',13)} About a minute · 2 of 3 done</span></div>
<div class="cards3">{c1}{c2}{c3}</div></div>{foot('Skip the optional ones any time')}'''
page(2, 'Idea 2', b2)

# ---- 3 · interview
steps = [('done','1','Company'),('done','2','Your role'),('now','3','Your goal'),('','4','Your portal')]
st = ''.join(f'<div class="st3 {c}"><i>{i("check",12) if c=="done" else n}</i>{l}</div>' for c,n,l in steps)
b3 = f'''<div class="t3"><div class="stepper3"><span class="k" style="padding:0 10px 10px">Your answers</span>{st}</div>
<div class="talk">
 <div class="host-row"><span class="avatar-h">{i('sparkle',20)}</span><div class="bub host">Nice to meet you. What's the company called?</div></div>
 <div class="bub me">Northbeam — northbeam.io</div>
 <div class="host-row"><span class="avatar-h">{i('sparkle',20)}</span><div class="bub host">Great. And what do you do at Northbeam?</div></div>
 <div class="bub me">Customer Education</div>
 <div class="host-row"><span class="avatar-h">{i('sparkle',20)}</span><div class="bub host">Perfect. What should your customers learn to do first?</div></div>
 <div class="replies"><span class="reply on">{i('rocket',15)} Onboard new customers</span><span class="reply">{i('book',15)} Explain our product</span><span class="reply">{i('layers',15)} Increase adoption</span><span class="reply">{i('lifebuoy',15)} Cut repetitive tickets</span></div>
 <div class="why3">{i('lock',12)} This only decides your starter courses. Nothing is analysed or sent anywhere yet.</div>
</div></div>{foot('One question at a time · 3 of 4')}'''
page(3, 'Idea 3', b3)

# ---- 4 · question + brief
opts = [('rocket','Onboard new customers','Welcome path and a first-week course',True),('book','Explain our product','Core how-to courses for each feature',False),('layers','Increase adoption','A path that starts after go-live',False),('lifebuoy','Cut repetitive tickets','A most-asked-questions course',False)]
o = ''.join(f'<div class="opt4{" on" if on else ""}"><span class="ic">{i(ic,20)}</span><div><b>{l}</b><span>{d}</span></div><span class="cb">{i("check",13)}</span></div>' for ic,l,d,on in opts)
b4 = f'''<div class="t4"><div class="q4"><span class="eyebrow-s">{i('sparkle',12)} Question 3 of 3</span><h1 class="h1s">What should your customers learn to do first?</h1><p class="subs" style="margin-bottom:22px">Choose all that apply. We start with the first one you pick.</p>{o}</div>
<div class="brief"><span class="k">Your brief so far</span><p style="margin-top:14px">We're <mark>Northbeam</mark> at <mark>northbeam.io</mark>. As part of <mark>Customer Education</mark> we want to <mark>onboard new customers</mark>.</p>
<div class="prog4"><span style="color:var(--success)">{i('check',13)} Company</span><span style="color:var(--success)">{i('check',13)} Role</span><span style="color:var(--success)">{i('check',13)} Goal</span></div></div></div>{foot('Last question')}'''
page(4, 'Idea 4', b4)

# ---- 5 · prefilled confirm
rows = [
 ('layers','Company','Northbeam','<span class="pill5 sug">From your email</span>',False),
 ('globe','Website','northbeam.io','<span class="pill5 sug">From your email</span>',False),
 ('users','Your role','Choose your role','<span class="pill5 need">Pick one</span>',True),
 ('rocket','First goal','Onboard new customers','<span class="pill5 ok">Selected</span>',False),
]
r = ''
for ic,l,v,p,op in rows:
    ex = f'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">' + ''.join(f'<span class="chip" aria-pressed="false" style="padding:7px 13px">{x}</span>' for x in ['Founder or CEO','Customer Success','Customer Education','Product','Marketing','Support']) + '</div>' if op else ''
    r += f'<div class="row5{" open" if op else ""}"><div class="row5-h"><span class="ic">{i(ic,18)}</span><div class="tx"><small>{l}</small><b>{v}</b></div>{p}<span class="btn btn-ghost btn-sm">{"Close" if op else "Edit"}</span></div>{ex}</div>'
b5 = f'''<div class="t5"><div><span class="eyebrow-s">{i('sparkle',12)} Check and go</span><h1 class="h1s">Check what we started with</h1><p class="subs">Fix anything that's off — one tap each. Only the role is left to choose.</p>
<div class="banner5"><span class="ic">{i('sparkle',18)}</span><div><b style="font-size:14.5px">Started from your email domain, you@northbeam.io</b><div class="hint" style="margin:2px 0 0">Nothing was fetched from your website — these are only suggestions to check.</div></div></div>{r}</div>
<div class="side5"><span class="k">What happens next</span><ul>
<li><span class="n">1</span><span><b>We draft four starter courses</b><br><span style="color:var(--muted-foreground);font-size:13px">Shaped by your goal</span></span></li>
<li><span class="n">2</span><span><b>You pick a look for your portal</b><br><span style="color:var(--muted-foreground);font-size:13px">Eleven themes, one free</span></span></li>
<li><span class="n">3</span><span><b>You land in your dashboard</b><br><span style="color:var(--muted-foreground);font-size:13px">Courses and a tour waiting</span></span></li></ul></div></div>{foot('Everything is editable later','Continue')}'''
page(5, 'Idea 5', b5)
print('built')
