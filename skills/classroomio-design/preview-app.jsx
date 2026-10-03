const C = window.CIO;
const { Chip, UserAvatar, CircularProgress, PercentRingProgress, ResourceListGroup, ResourceListRow, ResourceListRowMain, ResourceListRowEnd, IconButton, BackButton, ComboButton, CheckboxOptionCardGroup, RadioOptionCardGroup, MultiSelectList, FileDropZone, MEGABYTE, PricingToggle, PricingCard, Ic, Collapsible, UnderlineTabs, Page, SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarInset, SidebarTrigger, HoverCard, Toast, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, Menubar, NavigationMenu, NavigationMenuLink, CopyButton, ModeSwitcher, Button, ButtonGroup, Input, Textarea, Field, InputGroup, PasswordInput, Select, Checkbox, RadioGroup, Switch, Toggle, ToggleGroup,
  Dialog, Sheet, Popover, Tooltip, DropdownMenu, Badge, NumberBadge, Alert, Card, Avatar, Accordion, Tabs, Table, Progress, Skeleton, Spinner, Kbd, Separator, Item, Empty, Breadcrumb, Pagination,
  BlockLoader, CompactLoader, BlockGlyph, ImportProgress, BlockSkeleton, AgentDrafting, Icon, Logo, Eyebrow, Tag, Pill, NotchCard, CourseCard, BrowserFrame, BookSpine, Shelf, CTAButton, SectionHeader, ProductMenu, FAQItem, TestimonialCard, VideoTestimonial, CTABand, Footer } = C;

const Section = ({ id, title, sub, children }) => <section id={id} style={{ padding: '40px 0', borderTop: '1px solid var(--sand-300)' }}>
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>{title}</h2>{sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-500)' }}>{sub}</span>}</div>
  {children}
</section>;
const Row = ({ l, children }) => <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-500)', width: 90, flexShrink: 0 }}>{l}</span>{children}</div>;
const Panel = ({ children, style }) => <div style={{ background: 'var(--ui-background)', border: '1px solid var(--sand-300)', borderRadius: 14, padding: 24, ...style }}>{children}</div>;
const plus = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const search = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const rows = [{ name: 'Amara Okafor', course: 'Admin 101', progress: 100, status: 'Passed' }, { name: 'Daniel Reyes', course: 'Partner cert', progress: 62, status: 'In progress' }, { name: 'Priya Nair', course: 'SSO setup', progress: 18, status: 'In progress' }];
const NAV = [['buttons', 'Buttons'], ['inputs', 'Inputs'], ['choice', 'Choice controls'], ['overlays', 'Overlays'], ['display', 'Display'], ['data', 'Data & lists'], ['loading', 'Loading'], ['extended', 'Extended'], ['custom', 'Custom'], ['marketing', 'Marketing']];

function App() {
  const [dlg, setDlg] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [page, setPage] = React.useState(3);
  const [faq, setFaq] = React.useState(0);
  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 120px', fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--ink-900)' }}>
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', paddingBottom: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Logo/><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', color: 'var(--ink-500)' }}>DESIGN SYSTEM · COMPONENT PREVIEW</span></div>
      <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>{NAV.map(([id, l]) => <a key={id} href={'#' + id} style={{ textDecoration: 'none' }}>{l}</a>)}</nav>
    </header>

    <Section id="buttons" title="Buttons" sub="forms/Button · ButtonGroup">
      <Panel>
        <Row l="VARIANTS"><Button>Default</Button><Button variant="light-default">Light</Button><Button variant="outline">Outline</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="ghost-default">Ghost default</Button><Button variant="ghost-outline">Ghost outline</Button><Button variant="destructive">Destructive</Button><Button variant="link">Link</Button></Row>
        <Row l="SIZES"><Button size="xs">Extra small</Button><Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button><Button size="icon-sm" variant="outline">{plus}</Button><Button size="icon">{plus}</Button><Button size="icon-lg" variant="secondary">{plus}</Button></Row>
        <Row l="STATES"><Button>{plus}New course</Button><Button loading>Saving</Button><Button disabled>Disabled</Button><Button variant="outline" disabled>Disabled</Button></Row>
        <Row l="GROUP"><ButtonGroup><Button variant="outline">Day</Button><Button variant="outline">Week</Button><Button variant="outline">Month</Button></ButtonGroup></Row>
      </Panel>
    </Section>

    <Section id="inputs" title="Inputs & fields" sub="forms/Input · Textarea · Field · InputGroup · PasswordInput">
      <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <Field label="Course title" htmlFor="t" required description="Shown to learners on the catalogue."><Input id="t" placeholder="Admin essentials"/></Field>
        <Field label="Email" error="Enter a valid email address."><Input invalid defaultValue="ada@"/></Field>
        <Field label="Search"><InputGroup start={search} end={<Kbd>⌘K</Kbd>} placeholder="Search courses"/></Field>
        <Field label="Academy URL"><InputGroup start="https://" end=".classroomio.com" placeholder="northwind"/></Field>
        <Field label="Password"><PasswordInput showStrength defaultValue="Northw1nd"/></Field>
        <Field label="Description"><Textarea placeholder="What will learners get out of this?"/></Field>
        <Field label="Disabled"><Input disabled placeholder="Read only"/></Field>
      </Panel>
    </Section>

    <Section id="choice" title="Choice controls" sub="forms/Select · Checkbox · RadioGroup · Switch · Toggle">
      <Panel>
        <Row l="SELECT"><Select width={200} placeholder="Pick a role" options={[{ value: 'admin', label: 'Admin' }, { value: 'tutor', label: 'Tutor' }, { value: 'student', label: 'Student' }]}/><Select width={160} defaultValue="pub" options={[{ value: 'pub', label: 'Published' }, { value: 'draft', label: 'Draft' }]}/><Select size="sm" width={140} placeholder="Small" options={[{ value: 'a', label: 'Option A' }]}/><Select width={140} disabled placeholder="Disabled" options={[]}/></Row>
        <Row l="CHECKBOX"><Checkbox label="Unchecked"/><Checkbox label="Checked" defaultChecked/><Checkbox label="Indeterminate" indeterminate/><Checkbox label="Disabled" disabled/></Row>
        <Row l="RADIO"><RadioGroup orientation="horizontal" defaultValue="self" options={[{ value: 'self', label: 'Self-paced' }, { value: 'live', label: 'Live cohort' }, { value: 'hybrid', label: 'Hybrid', disabled: true }]}/></Row>
        <Row l="SWITCH"><Switch label="Publish course" defaultChecked/><Switch label="Allow comments"/><Switch label="Disabled" disabled/></Row>
        <Row l="TOGGLE"><Toggle variant="outline" defaultPressed><b>B</b></Toggle><Toggle variant="outline"><i>I</i></Toggle><Toggle>Default</Toggle><ToggleGroup variant="outline" defaultValue="grid" items={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]}/></Row>
        <div style={{ maxWidth: 380 }}><Field orientation="horizontal" label="Email certificates" description="Send on course completion."><Switch defaultChecked/></Field></div>
      </Panel>
    </Section>

    <Section id="overlays" title="Overlays" sub="overlays/Dialog · Sheet · Popover · Tooltip · DropdownMenu">
      <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Dialog inline open title="Delete course?" description="Learners lose access immediately. This can’t be undone." footer={<><Button variant="outline">Cancel</Button><Button variant="destructive">Delete course</Button></>}/>
          <div style={{ display: 'flex', gap: 10 }}><Button variant="outline" onClick={() => setDlg(true)}>Open dialog</Button><Button variant="outline" onClick={() => setSheet(true)}>Open sheet</Button></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start', minHeight: 260 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <DropdownMenu trigger={<Button variant="outline">Actions ▾</Button>} items={[{ heading: 'Course' }, { label: 'Edit', shortcut: '⌘E' }, { label: 'Duplicate', shortcut: '⌘D' }, { separator: true }, { label: 'Delete', variant: 'destructive' }]}/>
            <Popover trigger={<Button variant="ghost">Popover</Button>}><b style={{ display: 'block', marginBottom: 6 }}>Share course</b><span style={{ color: 'var(--ui-muted-foreground)' }}>Anyone with the link can enrol.</span></Popover>
            <Tooltip content="Duplicate lesson"><Button variant="secondary">Hover for tooltip</Button></Tooltip>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>Click the buttons above to open each overlay.</span>
        </div>
      </Panel>
      <Dialog open={dlg} onOpenChange={setDlg} title="Invite tutor" description="They’ll get an email to join your academy." footer={<><Button variant="outline" onClick={() => setDlg(false)}>Cancel</Button><Button onClick={() => setDlg(false)}>Send invite</Button></>}><Field label="Email"><Input placeholder="tutor@company.com"/></Field></Dialog>
      <Sheet open={sheet} onOpenChange={setSheet} title="Edit learner" description="Update profile and access." footer={<Button onClick={() => setSheet(false)}>Save</Button>}><Field label="Name"><Input defaultValue="Ada Okafor"/></Field></Sheet>
    </Section>

    <Section id="display" title="Display" sub="display/Badge · Avatar · Progress · Tabs · Alert · …">
      <Panel>
        <Row l="BADGE"><Badge>Published</Badge><Badge variant="secondary">Draft</Badge><Badge variant="success">Passed</Badge><Badge variant="warning">Due soon</Badge><Badge variant="destructive">Failed</Badge><Badge variant="outline">Free</Badge><NumberBadge number={1} active/><NumberBadge number={2}/><NumberBadge number={3} locked/></Row>
        <Row l="AVATAR"><Avatar src="assets/images/portrait-1.jpg"/><Avatar fallback="DR"/><Avatar fallback="PN" size={40}/><Separator orientation="vertical" style={{ height: 24 }}/><Spinner/><Spinner size={20} color="var(--ui-primary)"/><Kbd>⌘</Kbd><Kbd>K</Kbd></Row>
        <Row l="BREADCRUMB"><Breadcrumb items={[{ label: 'Courses' }, { label: 'Admin 101' }, { label: 'Lesson 3' }]}/></Row>
        <Row l="PROGRESS"><div style={{ width: 220 }}><Progress value={64}/></div><div style={{ width: 140 }}><Progress value={30} variant="muted"/></div><Skeleton circle width={28} height={28}/><Skeleton width={160}/></Row>
        <Row l="TABS"><Tabs tabs={[{ value: 'l', label: 'Lessons' }, { value: 'p', label: 'People' }, { value: 's', label: 'Settings' }]}/></Row>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <Alert title="Heads up">Changes save automatically.</Alert>
          <Alert variant="information" title="Drafted by your agent">Review the outline before publishing.</Alert>
          <Alert variant="warning" title="Certificate expiring">12 learners renew next week.</Alert>
          <Alert variant="destructive" title="Payment failed">Update your card to keep Growth features.</Alert>
        </div>
      </Panel>
    </Section>

    <Section id="data" title="Data & lists" sub="display/Card · Table · Pagination · Item · Accordion · Empty">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title="Learners" description="Enrolled this month" action={<Button size="sm" variant="outline">Export</Button>}>
            <Table selected={[1]} columns={[{ key: 'name', header: 'Learner', render: r => <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar size={24} fallback={r.name.split(' ').map(s => s[0]).join('')}/>{r.name}</span> }, { key: 'course', header: 'Course' }, { key: 'progress', header: 'Progress', render: r => <div style={{ width: 80 }}><Progress value={r.progress}/></div> }, { key: 'status', header: 'Status', render: r => <Badge variant={r.status === 'Passed' ? 'success' : 'secondary'}>{r.status}</Badge> }]} rows={rows}/>
          </Card>
          <Pagination page={page} count={8} onChange={setPage}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Item variant="outline" media={<Avatar fallback="AO"/>} title="Amara Okafor" description="Completed Admin 101 · certificate issued" actions={<Button size="sm" variant="outline">View</Button>}/>
          <Panel style={{ padding: '4px 20px' }}><Accordion defaultOpen={[0]} items={[{ title: 'Module 1 · Setup', content: '3 lessons · 24 min' }, { title: 'Module 2 · Admin', content: '5 lessons · 40 min' }, { title: 'Module 3 · Reporting', content: '2 lessons' }]}/></Panel>
          <Empty title="No webinars yet" description="Schedule one or import a recording."><Button size="sm">New webinar</Button></Empty>
        </div>
      </div>
    </Section>

    <Section id="loading" title="Loading states" sub="loading/BlockLoader · CompactLoader · BlockGlyph · ImportProgress · BlockSkeleton · AgentDrafting">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, alignItems: 'start' }}>
        <Panel style={{ background: '#FFFFFF' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>01 · FULL PAGE</span><BlockLoader caption="Blocks drop into place one at a time, then clear and repeat." style={{ marginTop: 16 }} height={340}/></Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel style={{ background: '#FFFFFF', display: 'flex', gap: 22, alignItems: 'center' }}><CompactLoader/><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>02 · COMPACT</span><b style={{ fontSize: 17 }}>Wordless loader</b><span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-500)' }}>Three blocks stack and clear. Panels, modals, small screens.</span></div></Panel>
          <Panel style={{ background: '#FFFFFF' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>03 · INLINE</span><ImportProgress style={{ marginTop: 12 }}/></Panel>
          <Panel style={{ background: '#FFFFFF' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>04 · BUTTON + SMALL UI</span><div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}><Button loading>Publishing…</Button><Button variant="outline" loading>Syncing</Button><Button variant="outline">Cancel</Button><CompactLoader size="sm" framed={false}/></div></Panel>
          <Panel style={{ background: '#FFFFFF' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>05 · BLOCK SKELETON</span><BlockSkeleton style={{ marginTop: 12 }}/></Panel>
        </div>
      </div>
      <Panel style={{ background: '#FFFFFF', marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 32, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--blue-700)' }}>06 · AGENT DRAFTING</span><b style={{ fontSize: 20 }}>The agent types, blocks appear</b><span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-500)' }}>For long jobs like drafting a course.</span></div>
        <AgentDrafting/>
      </Panel>
    </Section>

    <Section id="extended" title="Extended components" sub="sidebar · command · menubar · navigation-menu · hover-card · toast · page · …">
      <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Menubar menus={[{ label: 'File', items: [{ label: 'New course', shortcut: '⌘N' }, { separator: true }, { label: 'Share', items: [{ label: 'Copy link' }] }] }, { label: 'View', items: [{ label: 'Show sidebar', checked: true }] }]}/>
          <NavigationMenu items={[{ value: 'learn', label: 'Learn', content: <div style={{ width: 240, padding: 8 }}><NavigationMenuLink href="#">Courses</NavigationMenuLink><NavigationMenuLink href="#">Cohorts</NavigationMenuLink></div> }, { value: 'pricing', label: 'Pricing', href: '#' }]}/>
          <Command style={{ width: 360, height: 'auto' }}><CommandInput placeholder="Type a command..."/><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandGroup heading="Suggestions"><CommandItem>Create course<CommandShortcut>⌘N</CommandShortcut></CommandItem><CommandItem>Invite student</CommandItem></CommandGroup></CommandList></Command>
          <Row l="TABS"><UnderlineTabs tabs={[{ value: 'note', label: 'Note' }, { value: 'slides', label: 'Slides' }, { value: 'video', label: 'Video', disabled: true }]}/></Row>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <Row l="ACTIONS"><CopyButton text="https://classroomio.com"/><CopyButton text="npm i classroomio" variant="outline">Copy</CopyButton><ModeSwitcher defaultMode="light"/></Row>
          <Row l="HOVER"><HoverCard trigger={<a href="#">@classroomio</a>}><strong>ClassroomIO</strong><p>Teach online.</p></HoverCard></Row>
          <Collapsible trigger={<Button variant="ghost">Details</Button>}><p>Hidden until opened.</p></Collapsible>
          <Toast type="success" title="Profile updated" description="Changes saved." closeButton/>
          <div style={{ width: '100%', height: 220, border: '1px solid var(--sand-300)', borderRadius: 14, overflow: 'hidden' }}><SidebarProvider style={{ height: '100%' }}><Sidebar inline><SidebarContent><SidebarGroup><SidebarGroupLabel>Teach</SidebarGroupLabel><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive>{Ic('inbox')}<span>Courses</span></SidebarMenuButton><SidebarMenuBadge>12</SidebarMenuBadge></SidebarMenuItem></SidebarMenu></SidebarGroup></SidebarContent></Sidebar><SidebarInset><SidebarTrigger/></SidebarInset></SidebarProvider></div>
        </div>
      </Panel>
      <div style={{ marginTop: 20, border: '1px solid var(--sand-300)', borderRadius: 14, overflow: 'hidden', background: 'var(--ui-background)' }}>
        <Page.Root style={{ minHeight: 360 }}><Page.Header><Page.HeaderContent><Page.Title>Settings</Page.Title><Page.Subtitle>Manage your org</Page.Subtitle></Page.HeaderContent><Page.Action><Button size="sm">Invite</Button></Page.Action></Page.Header><Page.Body><div style={{ height: 120 }}/></Page.Body><Page.SettingsActions hasChanges statusLabel="Unsaved changes" discardLabel="Discard" saveLabel="Save changes" onSave={() => {}} onDiscard={() => {}}/></Page.Root>
      </div>
    </Section>

    <Section id="custom" title="Custom components" sub="chip · icon-button · combo-button · option-cards · multi-select · file-drop-zone · pricing · resource-list-row">
      <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row l="CHIP"><Chip value={12}/><Chip value="99+"/><UserAvatar size={32} alt="Dana Iwu"/><UserAvatar size={32} src="assets/images/portrait-1.jpg"/><CircularProgress value={65} size={32} strokeWidth={3}/><PercentRingProgress value={72}/><PercentRingProgress value={100} size="default"/></Row>
          <Row l="BUTTONS"><IconButton tooltip="Add content">{Ic('plus')}</IconButton><BackButton href="#" label="Back to courses"/><ComboButton label="Export as CSV" menuLabel="More export formats" items={[{ label: 'Export as PDF' }, { label: 'Export as Excel' }, { label: 'Delete permanently', destructive: true }]}/></Row>
          <PricingToggle defaultYearly={false}/>
          <CheckboxOptionCardGroup defaultValue={['intro-html']} options={[{ id: 'intro-html', title: 'Intro to HTML', description: 'Tags, structure and semantics.', value: 'intro-html' }, { id: 'css', title: 'CSS basics', description: 'Selectors and layout.', value: 'css' }]}/>
          <RadioOptionCardGroup defaultValue="live-class" options={[{ id: 'live-class', title: 'Live class', description: 'Scheduled sessions.', value: 'live-class' }, { id: 'self-paced', title: 'Self-paced', description: 'Learn any time.', value: 'self-paced' }]}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MultiSelectList heading="Select items" emptyMessage="No items to show." searchPlaceholder="Search" selected={['a']} onToggle={() => {}} items={[{ id: 'a', label: 'Introduction' }, { id: 'b', label: 'Core concepts' }, { id: 'c', label: 'Practice set' }]}/>
          <FileDropZone maxFiles={3} maxFileSize={5 * MEGABYTE} accept="image/*" onUpload={async () => {}}/>
          <ResourceListGroup>
            <ResourceListRow density="toolbar"><ResourceListRowMain><span style={{ fontWeight: 500 }}>Lessons</span></ResourceListRowMain></ResourceListRow>
            <ResourceListRow align="start"><ResourceListRowMain><span style={{ fontWeight: 500 }}>Welcome to the academy</span><span style={{ fontSize: 14, color: 'var(--ui-muted-foreground)' }}>Video · 4 min</span></ResourceListRowMain><ResourceListRowEnd><Badge variant="success">Published</Badge></ResourceListRowEnd></ResourceListRow>
            <ResourceListRow align="start"><ResourceListRowMain><span style={{ fontWeight: 500 }}>Set up your domain</span><span style={{ fontSize: 14, color: 'var(--ui-muted-foreground)' }}>Doc · 6 min</span></ResourceListRowMain><ResourceListRowEnd><Badge variant="secondary">Draft</Badge></ResourceListRowEnd></ResourceListRow>
          </ResourceListGroup>
        </div>
      </Panel>
      <Panel style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PricingCard planName="early-adopter" isPopular isYearlyPlan plan={{ NAME: 'Early Adopters', PRICE: { CURRENCY: '$', MONTHLY: '35', YEARLY: '350', IS_PREMIUM: false }, FEATURES: ['Everything in Basic', '10K Students', 'Custom Branding'], CTA: { DASHBOARD_LABEL: 'Upgrade now', IS_DISABLED: false } }}/>
        <PricingCard planName="basic" isYearlyPlan plan={{ NAME: 'Basic', PRICE: { CURRENCY: '$', MONTHLY: '0', YEARLY: '0', IS_PREMIUM: false }, FEATURES: ['Unlimited courses', '100 Students'], CTA: { DASHBOARD_LABEL: 'Current plan', IS_DISABLED: true } }} isDisabled/>
      </Panel>
    </Section>

    <Section id="marketing" title="Marketing components" sub="core · surfaces · marketing">
      <Panel style={{ background: 'var(--page)' }}>
        <Row l="CTA BUTTON"><CTAButton size="lg">Start your academy</CTAButton><CTAButton size="lg" variant="secondary">Book a demo</CTAButton><CTAButton variant="link" icon>Explore custom branding</CTAButton></Row>
        <Row l="LABELS"><Eyebrow>Custom branding</Eyebrow><Eyebrow tone="accent" size="sm">FAQ</Eyebrow><Tag>PATH</Tag><Tag variant="new">NEW</Tag><Tag variant="agent">agent · drafting</Tag><Pill icon={<Icon name="github" size={18} color="var(--ink-900)" strokeWidth={1.6}/>}>Open source · on GitHub</Pill></Row>
        <Row l="ICONS">{['sparkle', 'users', 'palette', 'bolt', 'chat', 'search', 'lock', 'plus', 'arrowRight', 'chevronDown', 'github', 'close'].map(n => <Icon key={n} name={n} color="var(--blue-700)"/>)}</Row>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24, alignItems: 'start' }}>
          <NotchCard><span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em' }}>50+</span><span style={{ fontSize: 15, color: 'var(--ink-700)' }}>Contributors</span></NotchCard>
          <CourseCard media={<div style={{ height: '100%', background: 'var(--blue-700)' }}/>} tag="PATH" title="Admin essentials" meta="5 courses · 3h · Certificate"/>
          <TestimonialCard quote="It looks like our product, not a bolt-on LMS." name="Sofia Almeida" role="Product Operations" company="Brightdesk"/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20, alignItems: 'start' }}>
          <BrowserFrame><img src="assets/images/product-dashboard-courses.png" style={{ width: '100%', display: 'block' }}/></BrowserFrame>
          <VideoTestimonial size="sm" image="assets/images/portrait-2.jpg" duration="1:05" quote="Partners get certified on their own time." attribution="Priya Nair · Stackwise"/>
        </div>
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}><Shelf width={360}><BookSpine label="Onboarding" height={150} width={38}/><BookSpine label="Admin 101" tone="sand" height={130} width={34}/><BookSpine label="Integrations" tone="ink" height={160} width={42}/><BookSpine label="SSO setup" tone="sky" height={140} width={34}/><BookSpine label="Partner cert" tone="blue" height={156} width={40}/></Shelf></div>
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          {['Can I self-host it?', 'What happens to the videos I already have?', 'Can my AI agent build and update courses?'].map((q, i, a) => <FAQItem key={i} index={i + 1} question={q} answer="Yes — ClassroomIO is open source." open={faq === i} onToggle={() => setFaq(faq === i ? -1 : i)} z={a.length - i} tab={i < a.length - 1}/>)}
        </div>
        <div style={{ marginTop: 32 }}><ProductMenu/></div>
        <div style={{ marginTop: 32 }}><CTABand style={{ padding: '72px 40px' }}/></div>
      </Panel>
    </Section>
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
