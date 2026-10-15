import pathlib
here = pathlib.Path(__file__).parent

OUT = [('Onboard new customers','A New Customer Onboarding path'),('Explain our product','Core how-to courses'),('Increase adoption','A path past go-live'),('Cut repetitive tickets','A most-asked-questions course')]
SIZES = ['Just me','2-9 people','10-50 people','51-200 people','200+ people']
LEARN = ['They figure it out on their own','Live onboarding sessions or calls','Help docs and support',"We don't have training yet"]
ROLES = ['Founder or CEO','Customer Success','Customer Education','Product']

def page(n, title, body, foot_note, cta='Prepare my workspace', stage_label='Your business'):
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title>
<link rel="stylesheet" href="../fonts/geist.css"><link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../onboarding.css"><link rel="stylesheet" href="../brand.css"><link rel="stylesheet" href="s2.css"></head><body>
<div class="s2"><div class="s2-top"><span class="lockup"><img class="mk" src="../logo-mark.svg" alt=""><span class="nm">classroomio</span></span>
<div class="rail"><div class="rail-head"><span class="of">Step 3 of 4</span><span class="now">{stage_label}</span></div><div class="rail-segs"><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg"></span></div></div>
<div class="sp"><span class="btn btn-ghost btn-sm">Restart</span></div></div>
<div class="s2-body">{body}</div>
<div class="s2-foot"><span class="btn btn-ghost">Back</span><span class="r"><span class="s2-note">{foot_note}</span><span class="btn btn-primary btn-lg">{cta} &rarr;</span></span></div></div></body></html>'''
    (here / f'idea-{n}.html').write_text(html)

def nb(kind, title, small='', on=False, w=None, h=150, dash=False):
    st = f'style="min-height:{h}px;{f"width:{w}px;" if w else ""}"'
    return f'<div class="nb notch-cutout-host{" on" if on else ""}{" dash" if dash else ""}" {st}><div class="f notch-cutout"><span class="k">{kind}</span><b>{title}</b>{f"<small>{small}</small>" if small else ""}</div></div>'

def slot(text, on=False, ph=False):
    return f'<span class="slot{" open" if on else ""}{" ph" if ph else ""}">{text}</span>'

# ---------- 1 The brief (fill in the blanks)
b1 = f'''<div style="height:100%;display:grid;place-items:center;position:relative">
<div style="width:1080px;position:relative">
<p class="eyebrow-mono">About your business <span class="o2">Fill in the blanks</span></p>
<p class="brief">We are {slot('Northbeam')} at {slot('northbeam.io', ph=False)}, a {slot('10-50 person', True)} company.
I am {slot('a founder')}. Today our customers learn through {slot('help docs and support')}.
First, we want to {slot('onboard new customers')}.</p>
<div class="pp2" style="right:0;top:122px">
<span class="lb">Company size</span>
<div class="chips">{''.join(f'<span class="chip" aria-pressed="{str(s=="10-50 people").lower()}">{s}</span>' for s in SIZES)}</div>
</div>
<p class="sub" style="margin-top:130px">Tap any blue phrase to change it. We read your company name and website only to pick a starter category. Nothing is fetched or analysed, and all of it is editable later.</p>
</div></div>'''
page(1,'Idea 1',b1,'Six answers, one sentence')

# ---------- 2 The stack assembles
rows = ''
def acc(n, title, summary, state, inner=''):
    return f'<div class="acc {state}"><div class="acc-h"><span class="n">{n}</span><b>{title}</b>{f"<span class=tick>&#10003;</span><em>{summary}</em>" if state=="done" else ("<span class=tag-mono>Now</span>" if state=="open" else "")}</div>{inner}</div>'
team = f'''<div class="acc-b"><span class="lb">Company size</span><div class="chips">{''.join(f'<span class="chip" aria-pressed="{str(s=="10-50 people").lower()}">{s}</span>' for s in SIZES)}</div>
<span class="lb" style="margin-top:18px">You are</span><div class="chips">{''.join(f'<span class="chip" aria-pressed="{str(r=="Founder or CEO").lower()}">{r}</span>' for r in ROLES)}<span class="chip">More &#9662;</span></div></div>'''
left = acc('01','First outcome','Onboard new customers','done') + acc('02','Company','Northbeam, northbeam.io','done') + acc('03','Your team','','open',team) + acc('04','How customers learn today','','')
stack = ''.join(f'<div style="margin-top:-14px;position:relative;z-index:{z}">{blk}</div>' for z,blk in [(1,nb('WORKSPACE','Northbeam','',False,300,86).replace('class="nb ','class="nb ink ')),(2,nb('FIRST OUTCOME','Onboard new customers','',True,330,86)),(3,nb('TEAM','10-50 people','',False,300,86)),(4,nb('ROLE','Founder or CEO','',False,330,86)),(5,nb('TODAY','Choose how customers learn','',False,300,86,dash=True))])
b2 = f'''<div style="height:100%;display:grid;grid-template-columns:1fr 520px;gap:0">
<div style="padding:44px 56px;overflow:hidden"><p class="eyebrow-mono">About your business</p><h1 class="h" style="font-size:44px">Tell us about <span class="swipe">your team</span></h1><p class="sub">Each answer drops a block into your workspace. Two to go.</p><div style="margin-top:26px;display:grid;gap:10px">{left}</div></div>
<div class="wash" style="margin:16px 16px 16px 0;border-radius:18px;display:grid;place-items:center;position:relative;overflow:hidden"><div class="dotfield" style="position:absolute;inset:0"></div><div style="position:relative;width:340px">{stack}<p class="s2-note" style="margin-top:36px;text-align:center">Your workspace, so far</p></div></div></div>'''
page(2,'Idea 2',b2,'Four of six answers in')

# ---------- 3 One question at a time
keys = 'ABCDE'
opts = ''.join(f'<div class="kopt{" on" if i==2 else ""}"><span class="key">{keys[i]}</span><b>{s.split(" people")[0] if "people" in s else s}</b><small>{"people" if "people" in s else "Solo"}</small></div>' for i,s in enumerate(SIZES))
progress = ''.join(f'<span class="pb{" d" if i<3 else (" n" if i==3 else "")}"></span>' for i in range(6))
b3 = f'''<div style="height:100%;display:grid;place-items:center">
<div style="width:1000px">
<div class="answered"><span class="tag-mono">Northbeam</span><span class="tag-mono">Onboard new customers</span><span class="tag-mono">Founder or CEO</span></div>
<p class="eyebrow-mono" style="margin-top:34px">Question 4 of 6</p>
<h1 class="h" style="font-size:64px">How big is your <span class="swipe">company</span>?</h1>
<p class="sub">Count everyone at the company, not just your team.</p>
<div class="kopts">{opts}</div>
<div class="pbs">{progress}</div>
<p class="s2-note" style="margin-top:18px">Press A to E to choose, Enter to continue</p>
</div></div>'''
page(3,'Idea 3',b3,'Two questions left','Continue')

# ---------- 4 Spec sheet
def row(n,label,control,done=True,opt=False):
    return f'<div class="spec-r"><div class="spec-l"><span class="n">{n}</span><span class="lb" style="margin:0">{label}{" <span class=o2>Optional</span>" if opt else ""}</span></div><div class="spec-c">{control}</div><span class="{"tick" if done else "ghost-tick"}">{"&#10003;" if done else ""}</span></div>'
seg = lambda items, on: '<div class="sg">' + ''.join(f'<span class="{"on" if x==on else ""}">{x}</span>' for x in items) + '</div>'
rows4 = (
 row('01','First outcome',seg(['Onboard customers','Explain product','Increase adoption','Cut tickets'],'Onboard customers')) +
 row('02','Company name','<div class="in" style="width:340px">Northbeam</div>') +
 row('03','Website','<div class="in" style="width:340px">northbeam.io</div>',True,True) +
 row('04','Your role',seg(ROLES+['More'],'Founder or CEO')) +
 row('05','Company size',seg(SIZES,'10-50 people')) +
 row('06','Customers learn today via',seg(['On their own','Live sessions','Help docs','No training yet'],'Help docs'))
)
b4 = f'''<div style="height:100%;display:grid;grid-template-columns:300px 1fr">
<div style="padding:44px 32px;border-right:1px solid var(--sand-300)"><p class="eyebrow-mono">About your business</p><h1 class="h" style="font-size:36px">One sheet, <span class="swipe">six lines</span></h1><p class="sub" style="font-size:14px">Everything on one page. Tab through it in under a minute.</p>
<div class="idx"><span class="on">01 to 03 Company</span><span>04 to 05 Team</span><span>06 Today</span></div></div>
<div style="padding:44px 56px"><div class="spec">{rows4}</div></div></div>'''
page(4,'Idea 4',b4,'Six of six answered')

# ---------- 5 Today to first outcome
today = ''.join(f'<div style="margin-top:{0 if i==0 else -34}px;position:relative;z-index:{i+1}">{nb("TODAY" if i==2 else f"0{i+1}", s, "", i==2, 300, 100)}</div>' for i,s in enumerate(["We don't have training yet",'They figure it out on their own','Help docs and support','Live onboarding sessions or calls']))
goals = ''.join(f'<div style="margin-top:{0 if i==0 else -34}px;position:relative;z-index:{i+1}">{nb("GOAL" if i==0 else f"0{i+1}", o[0], "", i==0, 300, 100)}</div>' for i,o in enumerate(OUT))
b5 = f'''<div style="height:100%;padding:36px 56px 0;display:flex;flex-direction:column">
<p class="eyebrow-mono">About your business</p><h1 class="h" style="font-size:48px">From <span class="swipe">today</span> to your first outcome</h1>
<div class="path"><div class="pc"><span class="lb">Where customers are today</span>{today}</div><div class="arrow"><svg viewBox="0 0 120 20" width="120" height="20"><path d="M0 10 H108 M100 3 L112 10 L100 17" fill="none" stroke="#0233BD" stroke-width="2" stroke-dasharray="4 5"/></svg></div><div class="pc"><span class="lb">What should the academy do first</span>{goals}</div></div>
<div class="det"><div><span class="lb">Company name</span><div class="in">Northbeam</div></div><div><span class="lb">Website <span class="o2">Optional</span></span><div class="in">northbeam.io</div></div><div><span class="lb">You are</span><div class="in">Founder or CEO &#9662;</div></div><div><span class="lb">Company size</span><div class="in">10-50 people &#9662;</div></div></div></div>'''
page(5,'Idea 5',b5,'Pick one on each side')

# gallery
cards = [('1','The brief','Fill in a sentence. Six answers become one paragraph you can edit inline.'),
 ('2','The stack assembles','An accordion on the left; each answer drops a notch block into the workspace stack on the right.'),
 ('3','One question at a time','Large type, keyboard letters on every option, the earlier answers kept as tags.'),
 ('4','The spec sheet','All six questions on one hairline sheet with segmented controls. Fastest for people who know their answers.'),
 ('5','Today to first outcome','Where customers are today on the left, the first outcome on the right, joined by a path.')]
g = ''.join(f'<a class="g" href="idea-{n}.html"><img src="png/idea-{n}.png" alt=""><div><span class="eyebrow-mono">Idea {n}</span><b>{t}</b><p>{d}</p></div></a>' for n,t,d in cards)
(here/'index.html').write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Step 3 ideas, round two</title>
<link rel="stylesheet" href="../fonts/geist.css"><link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../brand.css">
<style>body{{background:var(--paper);margin:0}}.w{{max-width:1120px;margin:0 auto;padding:56px 24px 90px}}h1{{font-size:44px;font-weight:800;letter-spacing:-.05em;margin:10px 0 8px}}.l{{color:var(--ink-500);max-width:64ch;line-height:1.6}}.gr{{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}}.g{{display:block;border:1px solid var(--sand-300);border-radius:14px;overflow:hidden;background:#fff;text-decoration:none;color:inherit}}.g img{{width:100%;display:block;border-bottom:1px solid var(--sand-300)}}.g div{{padding:16px 18px 20px}}.g b{{display:block;font-size:18px;letter-spacing:-.02em;margin:6px 0 4px}}.g p{{margin:0;color:var(--ink-500);font-size:14px;line-height:1.5}}@media(max-width:800px){{.gr{{grid-template-columns:1fr}}}}</style></head><body><div class="w"><p class="eyebrow-mono">Step 3 &middot; round two</p><h1>Five more ways to ask <span class="swipe">six questions</span></h1><p class="l">All five carry the full production question set: first outcome, company, website, role, company size and how customers learn today. Open one for the full-size page.</p><div class="gr">{g}</div></div></body></html>''')
print('built')
