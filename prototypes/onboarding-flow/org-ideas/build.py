HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../app-theme.css"><link rel="stylesheet" href="../onboarding.css"><link rel="stylesheet" href="ideas.css">
<style>:root{{--primary:#1d4ed8;--primary-foreground:#eff6ff}}</style></head><body>
<div class="oi">
<div class="oi-top"><span class="lockup"><span class="mk">C</span><span class="nm">ClassroomIO</span></span>
<div class="rail"><div class="rail-head"><span class="of">Step 3 of 4</span><span class="now">Your business</span></div><div class="rail-segs"><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg"></span></div></div>
<div class="sp"><span class="btn btn-ghost btn-sm">Restart</span></div></div>
'''
FOOT = '''</div>
<script src="../proto.js"></script>
<script>document.querySelectorAll('[data-i]').forEach(function(n){{var s=+n.dataset.s||14;n.outerHTML=icon(n.dataset.i,s)}});</script>
</body></html>'''
def i(name, s=14): return f'<i data-i="{name}" data-s="{s}" style="display:inline-flex"></i>'
def cta(note, label='Prepare my workspace'):
    return f'<div class="oi-cta"><span class="btn btn-ghost">Back</span><span style="display:flex;gap:14px;align-items:center"><span class="text-muted" style="font-size:12.5px">{note}</span><span class="btn btn-primary btn-lg">{label} {i("send",15)}</span></span></div>'

COURSES = ['Getting Started with Your Workspace','Creating and Managing Projects','Collaborating with Your Team','Understanding Reports and Progress']
cov = ['linear-gradient(135deg,#1e3a8a,#93c5fd)','linear-gradient(60deg,#1d4ed8,#a5b4fc)','linear-gradient(200deg,#312e81,#7dd3fc)','linear-gradient(300deg,#1e40af,#bfdbfe)']

# ---- 1 · edit in place on the portal ----
def tile(n): return f'<div class="i1-tile"><i style="background:{cov[n]}"></i>{COURSES[n]}</div>'
p1 = HEAD.format(title='Idea 1') + f'''
<div class="oi-body i1-wrap">
 <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:30px">
  <div><span class="oi-eye">Build it right here</span><h1>This is your academy. Make it yours.</h1><p class="lede">Click anything below to describe your business — your portal and starter courses follow what you write.</p></div>
  <div style="display:flex;gap:8px;align-items:center"><span class="text-muted" style="font-size:12.5px">You are</span><span class="chip" aria-pressed="true" style="padding:7px 14px">{i("book")} Customer Education {i("chevdown",13)}</span></div>
 </div>
 <div class="i1-frame"><div class="preview-wrap" style="box-shadow:0 30px 60px -28px rgb(0 0 0/.35)">
  <div class="preview-chrome"><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span><span class="preview-url">https://northbeam.classroomio.com</span></div>
  <div class="qz" style="--qz-accent:#1d4ed8;--qz-accent-fg:#fff">
   <nav class="qz-nav"><span class="qz-logo"><span class="qz-mark">N</span><span class="oi-edit">Northbeam</span></span><span class="qz-links"><span>Courses</span><span>Paths</span><span>Help</span></span><span class="qz-btn">Sign in</span></nav>
   <header class="qz-hero"><p class="qz-kicker"><span class="oi-edit">Northbeam</span> Academy</p><h1>Learn <span style="color:inherit" class="oi-edit">Northbeam</span> <span>at your own pace</span></h1>
    <p class="qz-lede oi-edit" style="display:inline-block;max-width:60ch">Project management software for agencies. Customers set up workspaces, run projects and report progress to clients.</p></header>
   <div class="qz-label">What should customers learn to do? — each one adds a shelf</div>
   <div style="padding:14px 0 6px;background:var(--canvas)">
    <div class="i1-shelf"><div><b><span class="i1-tog"></span>Onboard new customers</b><small>Adds a New Customer Onboarding path</small></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">{tile(0)}{tile(1)}{tile(2)}</div></div>
    <div class="i1-shelf"><div><b><span class="i1-tog"></span>Cut repetitive tickets</b><small>Adds a most-asked-questions course</small></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div class="i1-tile"><i style="background:{cov[3]}"></i>Answers to Your Most-Asked Questions</div><div class="i1-tile" style="opacity:.4"></div><div class="i1-tile" style="opacity:.4"></div></div></div>
    <div class="i1-shelf off"><div><b><span class="i1-tog o"></span>Teach advanced features</b><small>Click to add this shelf</small></div><div style="text-align:center;font-size:13px">{i("plus")} Add an advanced features course</div></div>
   </div>
  </div></div></div>
 <div class="oi-pop" style="left:300px;top:206px">{i("pencil",13)} <b>Company name</b> · click to edit</div>
 <div class="oi-pop" style="right:176px;top:392px">{i("globe",13)} <b>Website</b> northbeam.io <span style="opacity:.6">optional</span></div>
 <div class="oi-pop" style="left:975px;top:672px;background:#fff;color:var(--foreground);border:1px solid var(--border)"><span class="oi-why">{i("sparkle",12)} Your answers draft these courses — nothing is analysed yet</span></div>
</div>''' + cta('Everything stays editable later') + FOOT

# ---- 2 · start from product type ----
types = [('Project management','Projects, tasks, reports','layers','#2563eb',True),('Analytics','Data sources, dashboards','stats','#7c3aed',False),('Fintech','Accounts, payments, controls','award','#059669',False),('Developer tools','Quickstart, auth, go-live','settings','#0f172a',False),('HR and people','Hiring, onboarding, reviews','users','#db2777',False),('Compliance','Policies, SOPs, incidents','lifebuoy','#d97706',False)]
SEL = '<span class="badge badge-primary-soft" style="width:fit-content">Selected</span>'
tiles = ''.join(f'<div class="i2-tile{" on" if on else ""}"><span class="i2-ic" style="background:{c}">{i(ic,18)}</span><b>{n}</b><small>{d}</small>{SEL if on else ""}</div>' for n,d,ic,c,on in types)
side_c = ''.join(f'<div class="i2-c"><span style="background:{cov[k]}"></span>{COURSES[k]}</div>' for k in range(4))
p2 = HEAD.format(title='Idea 2') + f'''
<div class="oi-body i2">
 <div><span class="oi-eye">Start from what you sell</span><h1>What kind of product do your customers learn?</h1><p class="lede">Pick the closest match. We start from courses that fit it — then you describe your own product to make them yours.</p>
  <div class="i2-grid">{tiles}</div>
  <div class="i2-tile" style="margin-top:12px;grid-auto-flow:column;justify-content:space-between;align-items:center"><span><b>Something else</b><br><small>Describe it in your own words — we'll start with general courses</small></span><span class="btn btn-outline btn-sm">Describe it</span></div>
 </div>
 <div class="i2-side"><span class="k">Project management · what you'll start with</span>{side_c}
  <div class="i2-c" style="background:color-mix(in oklab,var(--primary) 6%,var(--card))">{i("route",15)} New Customer Onboarding · 5-step path</div>
  <div style="height:1px;background:var(--border)"></div>
  <div class="field" style="margin:0"><label class="label">Company name</label><input class="input" value="Northbeam" readonly></div>
  <div class="field" style="margin:0"><label class="label">Website <span class="opt-tag">optional</span></label><input class="input" value="https://northbeam.io" readonly></div>
  <div><span class="k" style="display:block;margin-bottom:6px">Your role</span><div class="chips"><span class="chip" aria-pressed="true">Customer Education</span><span class="chip">Founder</span><span class="chip">Support</span></div></div>
  <span class="oi-why">{i("sparkle",12)} Sample titles — they're swapped for yours after you continue</span></div>
</div>''' + cta('Goals come next, on the workspace screen','Continue') + FOOT

# ---- 3 · journey ----
stages = [('Sign up',[('Customers never finish setup',1),('Nobody knows where to start',0)],1),('Set up',[('Confusing first configuration',1),('Teammates never get invited',0)],1),('First win',[('Slow time to first value',0),('Same questions in support',1)],1),('Adopt',[('Features nobody discovers',0),('Usage drops after week 2',0)],0),('Renew',[('Champions leave, knowledge goes',0),('No proof of product mastery',0)],0)]
tr = ''
for k,(n,pains,on) in enumerate(stages):
    pp = ''.join(f'<div class="i3-pain{" on" if x else ""}"><i>{i("check",10) if x else ""}</i>{t}</div>' for t,x in pains)
    tr += f'<div class="i3-st{" on" if on else ""}"><div class="i3-dot">{k+1}</div><h4>{n}</h4>{pp}</div>'
PREV3 = ''.join(f'<div class="i2-c" style="flex-direction:column;align-items:stretch;padding:0;overflow:hidden"><span style="width:auto;height:64px;border-radius:0;background:{cov[k % 4]}"></span><div style="padding:10px 12px 12px;font-size:13px;line-height:1.35">{t}<div class="text-muted" style="font-size:11.5px;font-weight:400;margin-top:4px">{d}</div></div></div>' for k,(t,d) in enumerate([('Setup Essentials','Stops customers stalling at sign-up'),('Configure Your Workspace','Fixes the confusing first configuration'),('Answers to Your Most-Asked Questions','Deflects the same support tickets'),('Learning path: New Customer Onboarding','Orders them into one guided journey')]))
PREV3 = '<div class="k" style="margin:22px 0 10px">Courses we will draft from your answers - sample titles</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">' + PREV3 + '</div>'
p3 = HEAD.format(title='Idea 3') + f'''
<div class="oi-body i3">
 <span class="oi-eye">Where do customers struggle?</span><h1>Map the moments your customers get stuck.</h1><p class="lede">Each moment you tick becomes a course in your starter learning path — so the education lands exactly where it's needed.</p>
 <div class="i3-co"><div class="field"><label class="label">Company</label><input class="input" value="Northbeam" readonly></div><div class="field" style="width:300px"><label class="label">Website <span class="opt-tag">optional</span></label><input class="input" value="https://northbeam.io" readonly></div><div class="field" style="width:420px"><label class="label">What it does <span class="opt-tag">a line is enough</span></label><input class="input" value="Project management software for agencies" readonly></div><span class="chip" aria-pressed="true" style="margin-bottom:3px">{i("book")} Customer Education</span></div>
 <div class="i3-track">{tr}</div>
 <div class="i3-path"><span class="k" style="flex:none">Your starter path</span>{i("chevron",12)}<span class="chipc">Setup essentials</span>{i("chevron",12)}<span class="chipc">Configure your workspace</span>{i("chevron",12)}<span class="chipc">Answers to your most-asked questions</span>{i("chevron",12)}<span class="chipc" style="opacity:.4">Adopt…</span><span class="oi-why" style="margin-left:auto">{i("sparkle",12)} 3 courses · grows as you tick more</span></div>
 {PREV3}
</div>
</div>''' + cta('You can reshape the path any time') + FOOT

# ---- 4 · focus ----
steps = [('Company','done','Northbeam'),('Website','done','northbeam.io'),('Your product','now',''),('Your role','',''),('Goals','','')]
side = ''.join(f'<div class="i4-s {c}"><i>{i("check",11) if c=="done" else k+1}</i><span>{n}{f"<br><small class=text-muted>{v}</small>" if v else ""}</span></div>' for k,(n,c,v) in enumerate(steps))
p4 = HEAD.format(title='Idea 4') + f'''
<div class="oi-body i4">
 <div class="i4-l"><span class="k" style="padding:0 10px 10px">Your business</span>{side}</div>
 <div class="i4-m"><span class="oi-eye">3 of 5</span><h1 style="margin-top:10px">What does Northbeam do?</h1>
  <textarea readonly>We make project management software for agencies. Customers set up workspaces, run projects and…</textarea>
  <div class="ex-row" style="margin-top:16px"><span class="text-muted" style="font-size:13px">Need a nudge?</span><span class="ex-chip">Project management</span><span class="ex-chip">Analytics</span><span class="ex-chip">Fintech</span><span class="ex-chip">Developer tools</span></div>
  <div style="margin-top:30px;display:flex;gap:12px;align-items:center"><span class="btn btn-primary btn-lg">OK {i("check",15)}</span><span class="text-muted" style="font-size:13px">press <b style="color:var(--foreground)">Enter ↵</b></span></div>
 </div>
 <div class="i4-r"><span class="k">Why we ask</span><div class="i4-card"><b>{i("sparkle",13)} Your product description</b>We use it to draft starter courses that match what your customers actually do.</div>
  <span class="k" style="margin-top:6px">So far we'll prepare</span>
  <div class="i4-card"><div class="row" style="justify-content:space-between"><span>Workspace</span><b>Northbeam</b></div><div class="row" style="justify-content:space-between"><span>Portal</span><b>northbeam.classroomio.com</b></div><div class="row" style="justify-content:space-between;color:var(--muted-foreground)"><span>Starter courses</span><span>after this answer</span></div></div></div>
</div>''' + FOOT.replace('</div>\n<script','</div>\n<script')
# no cta bar for focus mode (keyboard-driven)

# ---- 5 · brief doc ----
p5 = HEAD.format(title='Idea 5') + f'''
<div class="oi-body i5">
 <div class="i5-doc"><span class="oi-eye">Your academy brief</span>
  <h1>Northbeam academy</h1><p class="lede">A one-page brief. Fill in what you know — we'll turn it into a workspace.</p>
  <div class="i5-props">
   <div class="i5-p"><span class="k">{i("globe",15)} Website</span><span>northbeam.io <span class="opt-tag">optional</span></span></div>
   <div class="i5-p"><span class="k">{i("users",15)} Your role</span><span><span class="badge badge-primary-soft">Customer Education</span></span></div>
   <div class="i5-p"><span class="k">{i("layers",15)} Product type</span><span><span class="badge badge-muted">Project management</span> <span class="text-muted" style="font-size:12.5px">suggested from your text</span></span></div>
   <div class="i5-p hl"><span class="k">{i("pencil",15)} Company</span><span>Northbeam</span></div>
  </div>
  <div class="i5-h">What we do</div>
  <p style="font-size:16.5px;line-height:1.65;margin:0;max-width:64ch">We make project management software for agencies. Customers set up workspaces, run projects and report progress to clients.</p>
  <div class="i5-h">Our customers need to…</div>
  <div class="i5-check on"><i>{i("check",11)}</i>Get onboarded without a call <span class="oi-why" style="margin-left:8px">{i("sparkle",11)} adds a New Customer Onboarding path</span></div>
  <div class="i5-check on"><i>{i("check",11)}</i>Stop filing the same tickets <span class="oi-why" style="margin-left:8px">{i("sparkle",11)} adds a most-asked-questions course</span></div>
  <div class="i5-check"><i></i>Discover advanced features</div>
  <div class="i5-check"><i></i>Get certified</div>
  <div class="i5-call"><span class="k">We'll prepare</span><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><span class="badge badge-outline">Getting Started with Your Workspace</span><span class="badge badge-outline">Creating and Managing Projects</span><span class="badge badge-outline">Collaborating with Your Team</span><span class="badge badge-outline">Answers to Your Most-Asked Questions</span><span class="badge badge-primary-soft">{i("route",11)} New Customer Onboarding</span></div></div>
 </div>
 <div class="i5-out"><span class="k" style="padding:0 8px 6px">On this page</span><div>Company</div><div>Properties</div><div>What we do</div><div class="on">Our customers need to…</div><div>We'll prepare</div></div>
 <div class="i5-slash"><div class="on">{i("plus",14)} Add a goal</div><div>{i("globe",14)} Paste a website</div><div>{i("sparkle",14)} Show an example</div></div>
</div>''' + cta('Last edited just now · saved automatically') + FOOT

for n,h in enumerate([p1,p2,p3,p4,p5],1):
    open(f'idea-{n}.html','w').write(h)
print('built')
