'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';

type View =
  | 'overview'
  | 'projects'
  | 'blog'
  | 'blogCategories'
  | 'resume'
  | 'skills'
  | 'homepage'
  | 'timeline';

const nav: View[] = ['overview', 'projects', 'blog', 'blogCategories', 'resume', 'skills', 'homepage', 'timeline'];

const routeViews: Record<string, View> = {
  '/admin': 'overview',
  '/admin/dashboard': 'overview',
  '/admin/projects': 'projects',
  '/admin/blog': 'blog',
  '/admin/blog-categories': 'blogCategories',
  '/admin/resume': 'resume',
  '/admin/skills': 'skills',
  '/admin/homepage': 'homepage',
  '/admin/timeline': 'timeline',
};

const viewLabel = (view: View) =>
  ({ blogCategories: 'Blog Categories' } as Partial<Record<View, string>>)[view] ??
  view.charAt(0).toUpperCase() + view.slice(1);

type ApiRecord = Record<string, unknown> & {
  id?: string;
  title?: string;
  name?: string;
  slug?: string;
  status?: string;
  label?: string;
};

type Feedback = { type: 'success' | 'error'; message: string } | null;
type RequestOptions = RequestInit & { body?: BodyInit | null };

type MediaOption = {
  id: string;
  s3Key: string;
  filename: string;
  mimeType: string;
  mediaType: string;
  size: number;
  alt?: string | null;
  usedIn?: string | null;
  url?: string;
};

function getInitialView(): View {
  if (typeof window === 'undefined') return 'overview';
  return routeViews[window.location.pathname] ?? 'overview';
}

async function api<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(path, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errObj = data?.error;
    let message = errObj?.message ?? `Request failed with ${res.status}`;
    if (Array.isArray(errObj?.details) && errObj.details.length > 0) {
      const fieldMessages = (errObj.details as { field: string; message: string }[])
        .map(d => `${d.field ? `${d.field}: ` : ''}${d.message}`)
        .join(' | ');
      message = `${message} — ${fieldMessages}`;
    }
    throw new Error(message);
  }

  return data as T;
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (value === null) return fallback;
  return value === 'on' || value === 'true';
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsv(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function recordTitle(record: ApiRecord) {
  return record.title ?? record.name ?? record.label ?? record.slug ?? record.id ?? 'Untitled';
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'upload'
  );
}

function extensionFromFilename(filename: string) {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex).toLowerCase();
}

function mediaMatchesAccept(asset: MediaOption, accept?: string) {
  if (!accept) return true;
  if (accept === 'image/*') return asset.mimeType.startsWith('image/');
  if (accept === 'application/pdf') return asset.mimeType === 'application/pdf';
  return accept
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .some(item => (item.endsWith('/*') ? asset.mimeType.startsWith(item.slice(0, -1)) : asset.mimeType === item));
}

function fileKindHelp(accept?: string) {
  if (accept === 'image/*') return 'PNG, JPG, JPEG, or WebP up to 10 MB.';
  if (accept === 'application/pdf') return 'PDF files up to 20 MB.';
  return 'Images or PDFs only.';
}

function uniqueS3Key(folder: string, file: File) {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'images';
  const ext = extensionFromFilename(file.name);
  const base = slugify(file.name.replace(/\.[^/.]+$/, ''));
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${cleanFolder}/${base}-${stamp}${ext}`;
}

export function AdminDashboard() {
  const [view, setView] = useState<View>(getInitialView);

  return (
    <div className="mx-auto grid w-full max-w-7xl min-w-0 items-start gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-neutral-300 bg-white p-4 shadow-sm lg:sticky lg:top-24">
        <p className="mb-4 px-2 text-xs font-black uppercase tracking-[.2em] text-neutral-500">CMS Admin</p>
        <nav className="grid gap-1">
          {nav.map(v => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                const path = Object.entries(routeViews).find(([, viewName]) => viewName === v)?.[0];
                if (path && typeof window !== 'undefined') window.history.pushState(null, '', path);
              }}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                view === v ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
            >
              {viewLabel(v)}
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        <Header title={viewLabel(view)} />
        {view === 'overview' && <Overview setView={setView} />}
        {view === 'projects' && <ProjectManager />}
        {view === 'blog' && <BlogManager />}
        {view === 'blogCategories' && <BlogCategoryManager />}
        {view === 'resume' && <ResumeManager />}
        {view === 'skills' && <SkillManager />}
        {view === 'homepage' && <HomepageManager />}
        {view === 'timeline' && <TimelineManager />}
      </section>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-6 rounded-3xl border border-neutral-300 bg-neutral-50 px-6 py-5">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Admin</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
    </div>
  );
}

function Status({ loading, feedback }: { loading: boolean; feedback: Feedback }) {
  return (
    <>
      {loading && <p className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">Loading…</p>}
      {feedback && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </>
  );
}

function Field({ label, name, value, required, type = 'text' }: { label: string; name: string; value?: unknown; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-neutral-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={textValue(value)}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
      />
    </label>
  );
}

function TextArea({ label, name, value, required, rows = 4 }: { label: string; name: string; value?: unknown; required?: boolean; rows?: number }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-neutral-700">
      {label}
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={textValue(value)}
        className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
      />
    </label>
  );
}

function SelectField({ label, name, value, options }: { label: string; name: string; value?: unknown; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-neutral-700">
      {label}
      <select name={name} defaultValue={textValue(value || options[0])} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950">
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CheckField({ label, name, value }: { label: string; name: string; value?: unknown }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700">
      <input name={name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4" />
      {label}
    </label>
  );
}

function ActionButton({ children, type = 'button', onClick }: { children: React.ReactNode; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} onClick={onClick} className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-800">{children}</button>;
}

function SecondaryButton({ children, onClick, type = 'button' }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-black text-neutral-950 transition hover:border-neutral-950">{children}</button>;
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100">{children}</button>;
}

function Overview({ setView }: { setView: (view: View) => void }) {
  const [counts, setCounts] = useState({ projects: 0, posts: 0, categories: 0, resumes: 0, skills: 0, timeline: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const sections: Array<{ view: View; label: string; count: number; description: string }> = [
    { view: 'projects', label: 'Projects', count: counts.projects, description: 'Create and update portfolio case studies.' },
    { view: 'blog', label: 'Blog', count: counts.posts, description: 'Write and publish blog posts.' },
    { view: 'blogCategories', label: 'Blog Categories', count: counts.categories, description: 'Organize blog posts by category.' },
    { view: 'resume', label: 'Resume', count: counts.resumes, description: 'Upload or activate your resume PDF.' },
    { view: 'skills', label: 'Skills', count: counts.skills, description: 'Manage tools and technologies.' },
    { view: 'homepage', label: 'Homepage', count: 1, description: 'Change the homepage hero image.' },
    { view: 'timeline', label: 'Timeline', count: counts.timeline, description: 'Manage experience and certifications.' },
  ];

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api<{ projects: unknown[] }>('/api/admin/projects'),
      api<{ posts: unknown[] }>('/api/admin/blog'),
      api<{ categories: unknown[] }>('/api/admin/blog-categories'),
      api<{ resumes: unknown[] }>('/api/admin/resume'),
      api<{ skills: unknown[] }>('/api/admin/skills'),
      api<{ timelineItems: unknown[] }>('/api/admin/homepage-timeline'),
    ])
      .then(([projects, posts, categories, resumes, skills, timeline]) => {
        if (!mounted) return;
        setCounts({
          projects: projects.projects.length,
          posts: posts.posts.length,
          categories: categories.categories.length,
          resumes: resumes.resumes.length,
          skills: skills.skills.length,
          timeline: timeline.timelineItems.length,
        });
      })
      .catch(error => mounted && setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load overview' }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-4">
      <Status loading={loading} feedback={feedback} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(section => (
          <button key={section.view} type="button" onClick={() => setView(section.view)} className="rounded-3xl border border-neutral-300 bg-white p-5 text-left shadow-sm transition hover:border-neutral-950">
            <p className="text-3xl font-black text-neutral-950">{section.count}</p>
            <h2 className="mt-4 text-xl font-black text-neutral-950">{section.label}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectManager() {
  const empty = { status: 'DRAFT', featured: false, homepageVisible: true, homepageOrder: 0, homepagePlacement: 'grid', metrics: '{"Outcome":"Result"}', techStackIds: '' };
  return (
    <CrudManager
      title="Projects"
      endpoint="/api/admin/projects"
      listKey="projects"
      empty={empty}
      renderForm={(record, mode) => <ProjectForm record={record} mode={mode} />}
      renderSummary={record => <RecordSummary record={record} fields={['slug', 'status', 'tagline', 'homepagePlacement']} />}
    />
  );
}

function ProjectForm({ record, mode }: { record: ApiRecord; mode: 'create' | 'edit' }) {
  const techStackIds = Array.isArray(record.techStack) ? (record.techStack as ApiRecord[]).map(t => t.id).join(',') : textValue(record.techStackIds);
  return (
    <>
      <Field label="Slug" name="slug" value={record.slug} required={mode === 'create'} />
      <Field label="Title" name="title" value={record.title} required />
      <Field label="Short description" name="tagline" value={record.tagline} required />
      <SelectField label="Status" name="status" value={record.status} options={['DRAFT', 'PUBLISHED', 'ARCHIVED']} />
      <CheckField label="Featured" name="featured" value={record.featured} />
      <CheckField label="Show on homepage" name="homepageVisible" value={record.homepageVisible ?? true} />
      <SelectField label="Homepage placement" name="homepagePlacement" value={record.homepagePlacement} options={['grid', 'large', 'side']} />
      <Field label="Homepage order" name="homepageOrder" value={record.homepageOrder} type="number" />
      <Field label="Read time" name="readTime" value={record.readTime} />
      <Field label="CTA label" name="ctaLabel" value={record.ctaLabel} />
      <TextArea label="Story / main content" name="story" value={record.story} required rows={6} />
      <TextArea label="Challenge" name="challenge" value={record.challenge} required />
      <TextArea label="Solution" name="solution" value={record.solution} required />
      <TextArea label="Results" name="results" value={record.results} required />
      <TextArea label="Metrics JSON" name="metrics" value={record.metrics ? JSON.stringify(record.metrics) : undefined} rows={3} />
      <MediaPicker label="Featured image" name="coverImageKey" value={record.coverImageKey} accept="image/*" defaultFolder="images/projects" usedIn="project-cover" />
      <MediaPicker label="Case study PDF" name="pdfKey" value={record.pdfKey} accept="application/pdf" defaultFolder="pdfs/projects" usedIn="project-pdf" />
      <Field label="GitHub URL" name="githubUrl" value={record.githubUrl} />
      <Field label="Live URL" name="liveUrl" value={record.liveUrl} />
      <SkillSelector name="techStackIds" value={techStackIds} />
    </>
  );
}

function projectPayload(form: FormData, mode: 'create' | 'edit') {
  const rawMetrics = String(form.get('metrics') ?? '').trim();
  let metrics: Record<string, string> | undefined;
  if (rawMetrics) {
    try {
      const parsed = JSON.parse(rawMetrics);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('Metrics must be a JSON object.');
      metrics = parsed as Record<string, string>;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Invalid metrics JSON');
    }
  }

  const payload: Record<string, unknown> = {
    title: String(form.get('title') ?? ''),
    tagline: String(form.get('tagline') ?? ''),
    status: String(form.get('status') ?? 'DRAFT'),
    featured: parseBoolean(form.get('featured')),
    homepageVisible: parseBoolean(form.get('homepageVisible'), true),
    homepageOrder: parseNumber(form.get('homepageOrder')),
    homepagePlacement: optionalString(form.get('homepagePlacement')),
    readTime: optionalString(form.get('readTime')),
    ctaLabel: optionalString(form.get('ctaLabel')),
    story: String(form.get('story') ?? ''),
    challenge: String(form.get('challenge') ?? ''),
    solution: String(form.get('solution') ?? ''),
    results: String(form.get('results') ?? ''),
    coverImageKey: optionalString(form.get('coverImageKey')),
    pdfKey: optionalString(form.get('pdfKey')),
    githubUrl: optionalString(form.get('githubUrl')),
    liveUrl: optionalString(form.get('liveUrl')),
    tagIds: [],
    techStackIds: parseCsv(form.get('techStackIds')),
    videoIds: [],
  };
  if (metrics) payload.metrics = metrics;
  if (mode === 'create') payload.slug = String(form.get('slug') ?? '');
  else if (String(form.get('slug') ?? '').trim()) payload.slug = String(form.get('slug'));
  return payload;
}

function BlogManager() {
  return (
    <CrudManager
      title="Blog posts"
      endpoint="/api/admin/blog"
      listKey="posts"
      empty={{ status: 'DRAFT', featured: false, homepageVisible: true, homepageOrder: 0 }}
      renderForm={(record, mode) => <BlogForm record={record} mode={mode} />}
      renderSummary={record => <RecordSummary record={record} fields={['slug', 'status', 'excerpt', 'readTime']} />}
    />
  );
}

function BlogForm({ record, mode }: { record: ApiRecord; mode: 'create' | 'edit' }) {
  return (
    <>
      <Field label="Slug" name="slug" value={record.slug} required={mode === 'create'} />
      <Field label="Title" name="title" value={record.title} required />
      <TextArea label="Excerpt" name="excerpt" value={record.excerpt} required rows={3} />
      <TextArea label="Body" name="body" value={record.body} required rows={10} />
      <SelectField label="Status" name="status" value={record.status} options={['DRAFT', 'PUBLISHED', 'ARCHIVED']} />
      <BlogCategorySelect name="categoryId" value={record.categoryId ?? (record.category as ApiRecord | undefined)?.id} />
      <CheckField label="Featured" name="featured" value={record.featured} />
      <CheckField label="Show on homepage" name="homepageVisible" value={record.homepageVisible ?? true} />
      <Field label="Homepage order" name="homepageOrder" value={record.homepageOrder} type="number" />
      <Field label="Read time" name="readTime" value={record.readTime} />
      <Field label="CTA label" name="ctaLabel" value={record.ctaLabel} />
      <MediaPicker label="Featured image" name="coverImageKey" value={record.coverImageKey} accept="image/*" defaultFolder="images/blog" usedIn="blog-cover" />
    </>
  );
}

function blogPayload(form: FormData, mode: 'create' | 'edit') {
  const payload: Record<string, unknown> = {
    title: String(form.get('title') ?? ''),
    excerpt: String(form.get('excerpt') ?? ''),
    body: String(form.get('body') ?? ''),
    status: String(form.get('status') ?? 'DRAFT'),
    featured: parseBoolean(form.get('featured')),
    homepageVisible: parseBoolean(form.get('homepageVisible'), true),
    homepageOrder: parseNumber(form.get('homepageOrder')),
    categoryId: optionalString(form.get('categoryId')),
    readTime: optionalString(form.get('readTime')),
    ctaLabel: optionalString(form.get('ctaLabel')),
    coverImageKey: optionalString(form.get('coverImageKey')),
    tagIds: [],
    videoIds: [],
  };
  if (mode === 'create') payload.slug = String(form.get('slug') ?? '');
  else if (String(form.get('slug') ?? '').trim()) payload.slug = String(form.get('slug'));
  return payload;
}

function BlogCategoryManager() {
  return (
    <CrudManager
      title="Blog categories"
      endpoint="/api/admin/blog-categories"
      listKey="categories"
      empty={{ visible: true, order: 0 }}
      renderForm={record => <BlogCategoryForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['slug', 'visible', 'order']} />}
    />
  );
}

function BlogCategoryForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="Name" name="name" value={record.name} required />
      <Field label="Slug" name="slug" value={record.slug} required />
      <Field label="Order" name="order" value={record.order} type="number" />
      <CheckField label="Visible" name="visible" value={record.visible ?? true} />
    </>
  );
}

function blogCategoryPayload(form: FormData) {
  return {
    name: String(form.get('name') ?? ''),
    slug: String(form.get('slug') ?? ''),
    order: parseNumber(form.get('order')),
    visible: parseBoolean(form.get('visible'), true),
  };
}

function BlogCategorySelect({ name, value }: { name: string; value?: unknown }) {
  const [categories, setCategories] = useState<ApiRecord[]>([]);
  const [selected, setSelected] = useState(textValue(value));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => setSelected(textValue(value)), [value]);

  useEffect(() => {
    let mounted = true;
    api<{ categories: ApiRecord[] }>('/api/admin/blog-categories')
      .then(data => mounted && setCategories(data.categories ?? []))
      .catch(error => mounted && setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load blog categories' }));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid gap-2 rounded-3xl border border-neutral-300 bg-neutral-50 p-4">
      <label className="grid gap-1 text-sm font-medium text-neutral-700">
        Blog category
        <select name={name} value={selected} onChange={event => setSelected(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950">
          <option value="">No category</option>
          {categories.map(category => <option key={String(category.id)} value={String(category.id)}>{textValue(category.name)}</option>)}
        </select>
      </label>
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function MediaPicker({ label, name, value, accept, defaultFolder, usedIn }: { label: string; name: string; value?: unknown; accept?: string; defaultFolder: string; usedIn?: string }) {
  const [assets, setAssets] = useState<MediaOption[]>([]);
  const [selectedKey, setSelectedKey] = useState(textValue(value));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => setSelectedKey(textValue(value)), [value]);
  const selectedAsset = assets.find(asset => asset.s3Key === selectedKey);

  const loadAssets = useCallback(async () => {
    try {
      const data = await api<{ assets: MediaOption[] }>('/api/admin/media');
      setAssets(data.assets);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load uploaded files' });
    }
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  return (
    <div className="grid gap-3 rounded-3xl border border-neutral-300 bg-neutral-50 p-4">
      <input type="hidden" name={name} value={selectedKey} />
      <div>
        <p className="text-sm font-black text-neutral-950">{label}</p>
        <p className="text-xs text-neutral-500">Upload a new file or choose an existing uploaded file.</p>
      </div>

      <select value={selectedKey} onChange={event => setSelectedKey(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950">
        <option value="">No file selected</option>
        {assets.filter(asset => mediaMatchesAccept(asset, accept)).map(asset => (
          <option key={asset.id} value={asset.s3Key}>{asset.filename} — {asset.s3Key}</option>
        ))}
      </select>

      {selectedKey && (
        <div className="rounded-2xl border border-neutral-300 bg-white p-3">
          <p className="break-all text-xs text-neutral-600">Selected key: {selectedKey}</p>
          {selectedAsset?.url && selectedAsset.mimeType.startsWith('image/') && <img src={selectedAsset.url} alt={selectedAsset.alt ?? selectedAsset.filename} className="mt-3 max-h-44 rounded-2xl object-cover" />}
          {selectedAsset?.url && !selectedAsset.mimeType.startsWith('image/') && <a className="mt-3 inline-flex text-sm font-black underline" href={selectedAsset.url} target="_blank" rel="noreferrer">Open file</a>}
        </div>
      )}

      <MediaUploader defaultFolder={defaultFolder} usedIn={usedIn} accept={accept} onUploaded={(asset) => {
        setSelectedKey(asset.s3Key);
        setAssets(current => [asset, ...current.filter(item => item.id !== asset.id && item.s3Key !== asset.s3Key)]);
        setFeedback({ type: 'success', message: `Selected ${asset.s3Key}` });
      }} />
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function MediaUploader({ defaultFolder, usedIn, accept, onUploaded }: { defaultFolder: string; usedIn?: string; accept?: string; onUploaded: (asset: MediaOption) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function upload() {
    if (!file) {
      setFeedback({ type: 'error', message: 'Choose a file first.' });
      return;
    }
    if (file.type.startsWith('video/')) {
      setFeedback({ type: 'error', message: 'Videos are not supported here.' });
      return;
    }
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setFeedback({ type: 'error', message: 'Only images and PDF files can be uploaded.' });
      return;
    }
    if (accept === 'image/*' && !file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please choose an image file.' });
      return;
    }
    if (accept === 'application/pdf' && file.type !== 'application/pdf') {
      setFeedback({ type: 'error', message: 'Please choose a PDF file.' });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const key = uniqueS3Key(defaultFolder, file);
      const presign = await api<{ uploadUrl: string; key: string }>('/api/admin/media/upload-url', {
        method: 'POST',
        body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream', size: file.size }),
      });

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30_000);
      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout));

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => '');
        throw new Error(`S3 upload failed with ${uploadRes.status}: ${errorText.slice(0, 800)}`);
      }

      const mediaType = file.type === 'application/pdf' ? 'PDF' : 'IMAGE';
      const data = await api<{ asset: MediaOption }>('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          s3Key: presign.key,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          mediaType,
          size: file.size,
          alt: alt.trim() || null,
          usedIn: usedIn ?? null,
        }),
      });

      setFeedback({ type: 'success', message: `Uploaded ${file.name}` });
      setFile(null);
      setAlt('');
      onUploaded(data.asset);
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Upload timed out. Check S3 CORS and permissions.'
        : error instanceof Error ? error.message : 'Upload failed';
      setFeedback({ type: 'error', message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-neutral-300 bg-white p-3">
      <p className="text-xs text-neutral-500">{fileKindHelp(accept)}</p>
      <input type="file" accept={accept} onChange={event => setFile(event.target.files?.[0] ?? null)} className="text-sm text-neutral-700 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" />
      <input value={alt} onChange={event => setAlt(event.target.value)} placeholder="Alt text / description" className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950" />
      <SecondaryButton onClick={upload}>{uploading ? 'Uploading…' : 'Upload file'}</SecondaryButton>
      <Status loading={uploading} feedback={feedback} />
    </div>
  );
}

function SkillSelector({ name, value }: { name: string; value?: unknown }) {
  return (
    <MultiIdSelector
      name={name}
      value={value}
      title="Tech stack"
      description="Select skills/tools used in this project. Leave empty if not needed."
      endpoint="/api/admin/skills"
      listKey="skills"
      labelFor={(record) => textValue(record.name ?? record.id)}
    />
  );
}

function MultiIdSelector({ name, value, title, description, endpoint, listKey, labelFor }: { name: string; value?: unknown; title: string; description: string; endpoint: string; listKey: string; labelFor: (record: ApiRecord) => string }) {
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(parseCsv(typeof value === 'string' ? value : textValue(value)));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => setSelectedIds(parseCsv(typeof value === 'string' ? value : textValue(value))), [value]);

  useEffect(() => {
    let mounted = true;
    api<Record<string, ApiRecord[]>>(endpoint)
      .then(data => mounted && setItems(data[listKey] ?? []))
      .catch(error => mounted && setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not load ${title.toLowerCase()}` }));
    return () => { mounted = false; };
  }, [endpoint, listKey, title]);

  function toggle(id: string) {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  return (
    <div className="grid gap-3 rounded-3xl border border-neutral-300 bg-neutral-50 p-4">
      <input type="hidden" name={name} value={selectedIds.join(',')} />
      <div>
        <p className="text-sm font-black text-neutral-950">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      {items.length === 0 ? <p className="text-sm text-neutral-500">No records found.</p> : (
        <div className="grid gap-2 rounded-2xl border border-neutral-300 bg-white p-3">
          {items.map(item => (
            <label key={String(item.id)} className="flex items-center gap-3 text-sm text-neutral-700">
              <input type="checkbox" checked={typeof item.id === 'string' && selectedIds.includes(item.id)} onChange={() => typeof item.id === 'string' && toggle(item.id)} className="h-4 w-4" />
              <span>{labelFor(item)}</span>
            </label>
          ))}
        </div>
      )}
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function ResumeManager() {
  return (
    <CrudManager
      title="Resume"
      endpoint="/api/admin/resume"
      listKey="resumes"
      empty={{ active: true }}
      renderForm={record => <ResumeForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['label', 'active', 's3Key']} />}
      createOnly
      submitLabel="Upload resume"
    />
  );
}

function ResumeForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <MediaPicker label="Resume PDF" name="s3Key" value={record.s3Key} accept="application/pdf" defaultFolder="resume" usedIn="resume" />
      <Field label="Label" name="label" value={record.label} required />
      <CheckField label="Active" name="active" value={record.active ?? true} />
    </>
  );
}

function resumePayload(form: FormData) {
  return { s3Key: String(form.get('s3Key') ?? ''), label: String(form.get('label') ?? ''), active: parseBoolean(form.get('active')) };
}

function SkillManager() {
  return (
    <CrudManager
      title="Skills"
      endpoint="/api/admin/skills"
      listKey="skills"
      empty={{ proficiency: 80, order: 0 }}
      renderForm={record => <SkillForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['category', 'proficiency', 'order']} />}
    />
  );
}

function SkillForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="Name" name="name" value={record.name} required />
      <Field label="Category" name="category" value={record.category} required />
      <MediaPicker label="Icon" name="iconKey" value={record.iconKey} accept="image/*" defaultFolder="icons" usedIn="skill-icon" />
      <Field label="Proficiency" name="proficiency" value={record.proficiency} type="number" />
      <Field label="Order" name="order" value={record.order} type="number" />
    </>
  );
}

function skillPayload(form: FormData) {
  return {
    name: String(form.get('name') ?? ''),
    category: String(form.get('category') ?? ''),
    iconKey: optionalString(form.get('iconKey')),
    proficiency: parseNumber(form.get('proficiency'), 80),
    order: parseNumber(form.get('order')),
  };
}

function HomepageManager() {
  const [content, setContent] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function load() {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api<{ content: ApiRecord | null }>('/api/admin/homepage');
      setContent(data.content);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load homepage' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(form: FormData) {
    setFeedback(null);
    try {
      const payload = {
        heroHeadline: String(content?.heroHeadline ?? 'Infrastructure that scales from idea to production'),
        heroSubtext: String(content?.heroSubtext ?? 'Cloud, DevOps, deployment systems, and infrastructure stories built for reliability.'),
        heroImageKey: optionalString(form.get('heroImageKey')),
        ctaText: String(content?.ctaText ?? 'View projects'),
        ctaUrl: String(content?.ctaUrl ?? '/projects'),
        aboutText: String(content?.aboutText ?? 'Portfolio content managed from a simple CMS.'),
        metaTitle: String(content?.metaTitle ?? 'Jules Munyaneza Portfolio'),
        metaDescription: String(content?.metaDescription ?? 'Cloud infrastructure and full-stack portfolio.'),
        featuredVideoId: null,
        timelineEyebrow: content?.timelineEyebrow ?? null,
        timelineTitle: content?.timelineTitle ?? null,
        timelineSubtitle: content?.timelineSubtitle ?? null,
        writingEyebrow: content?.writingEyebrow ?? null,
        writingTitle: content?.writingTitle ?? null,
        writingSubtitle: content?.writingSubtitle ?? null,
        projectsEyebrow: content?.projectsEyebrow ?? null,
        projectsTitle: content?.projectsTitle ?? null,
        projectsSubtitle: content?.projectsSubtitle ?? null,
        stackEyebrow: content?.stackEyebrow ?? null,
        stackTitle: content?.stackTitle ?? null,
        stackSubtitle: content?.stackSubtitle ?? null,
      };
      const data = await api<{ content: ApiRecord }>('/api/admin/homepage', { method: 'PUT', body: JSON.stringify(payload) });
      setContent(data.content);
      setFeedback({ type: 'success', message: 'Homepage hero image saved.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not save homepage hero image' });
    }
  }

  return (
    <div className="grid gap-5">
      <Status loading={loading} feedback={feedback} />
      <Card>
        <h2 className="text-2xl font-black text-neutral-950">Homepage hero image</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">Upload, select, or remove the image shown in the homepage hero section.</p>
        <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="mt-5 grid gap-4">
          <MediaPicker label="Hero image" name="heroImageKey" value={content?.heroImageKey} accept="image/*" defaultFolder="images/homepage" usedIn="homepage-hero" />
          <div className="flex flex-wrap gap-3">
            <ActionButton type="submit">Save hero image</ActionButton>
            <SecondaryButton onClick={() => setContent(current => current ? { ...current, heroImageKey: null } : { heroImageKey: null })}>Remove selection</SecondaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TimelineManager() {
  return (
    <CrudManager
      title="Timeline"
      endpoint="/api/admin/homepage-timeline"
      listKey="timelineItems"
      empty={{ active: true, order: 0 }}
      renderForm={record => <TimelineForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['year', 'description', 'active', 'order']} />}
    />
  );
}

function TimelineForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="Year" name="year" value={record.year} required />
      <Field label="Title" name="title" value={record.title} required />
      <TextArea label="Description" name="description" value={record.description} required rows={4} />
      <MediaPicker label="Optional image" name="imageKey" value={record.imageKey} accept="image/*" defaultFolder="images/timeline" usedIn="timeline" />
      <Field label="External URL" name="externalUrl" value={record.externalUrl} />
      <Field label="Order" name="order" value={record.order} type="number" />
      <CheckField label="Active" name="active" value={record.active ?? true} />
    </>
  );
}

function timelinePayload(form: FormData) {
  return {
    year: String(form.get('year') ?? ''),
    title: String(form.get('title') ?? ''),
    description: String(form.get('description') ?? ''),
    imageKey: optionalString(form.get('imageKey')),
    externalUrl: optionalString(form.get('externalUrl')),
    order: parseNumber(form.get('order')),
    active: parseBoolean(form.get('active'), true),
  };
}

type CrudManagerProps = {
  title: string;
  endpoint: string;
  listKey: string;
  empty: ApiRecord;
  renderForm: (record: ApiRecord, mode: 'create' | 'edit') => React.ReactNode;
  renderSummary: (record: ApiRecord) => React.ReactNode;
  createOnly?: boolean;
  submitLabel?: string;
};

function CrudManager(props: CrudManagerProps) {
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [selected, setSelected] = useState<ApiRecord | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const current = useMemo(() => selected ?? props.empty, [selected, props.empty]);

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api<Record<string, ApiRecord[]>>(props.endpoint);
      setItems(data[props.listKey] ?? []);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not load ${props.title}` });
    } finally {
      setLoading(false);
    }
  }, [props.endpoint, props.listKey, props.title]);

  useEffect(() => { void load(); }, [load]);

  async function submit(form: FormData) {
    setFeedback(null);
    try {
      const payload = payloadFor(props.endpoint, form, mode);
      const path = mode === 'edit' && selected?.id ? `${props.endpoint}/${selected.id}` : props.endpoint;
      const method = mode === 'edit' && selected?.id ? 'PUT' : 'POST';
      await api(path, { method, body: JSON.stringify(payload) });
      setFeedback({ type: 'success', message: `${props.title} saved.` });
      setSelected(null);
      setMode('create');
      await load();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not save ${props.title}` });
    }
  }

  async function remove(record: ApiRecord) {
    if (!record.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete ${textValue(recordTitle(record))}?`)) return;
    setFeedback(null);
    try {
      await api(`${props.endpoint}/${record.id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: `${props.title} deleted.` });
      if (selected?.id === record.id) setSelected(null);
      await load();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not delete ${props.title}` });
    }
  }

  return (
    <div className="grid w-full min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Status loading={loading} feedback={feedback} />
          <ActionButton onClick={() => { setSelected(null); setMode('create'); }}>Create new</ActionButton>
        </div>
        {items.length === 0 && !loading && <Card><p className="text-neutral-600">No records found. Use the form to create one.</p></Card>}
        {items.map(record => (
          <Card key={String(record.id)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-black text-neutral-950">{textValue(recordTitle(record))}</h2>
                {props.renderSummary(record)}
              </div>
              <div className="flex flex-wrap gap-2">
                {!props.createOnly && <SecondaryButton onClick={() => { setSelected(record); setMode('edit'); }}>Edit</SecondaryButton>}
                {!props.createOnly && <DangerButton onClick={() => void remove(record)}>Delete</DangerButton>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <h2 className="text-2xl font-black text-neutral-950">{mode === 'create' ? `New ${props.title}` : `Edit ${props.title}`}</h2>
        <form key={`${mode}-${selected?.id ?? 'new'}`} onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="mt-5 grid gap-4">
          {props.renderForm(current, mode)}
          <div className="flex flex-wrap gap-3">
            <ActionButton type="submit">{props.submitLabel ?? 'Save'}</ActionButton>
            {mode === 'edit' && <SecondaryButton onClick={() => { setSelected(null); setMode('create'); }}>Cancel</SecondaryButton>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function RecordSummary({ record, fields }: { record: ApiRecord; fields: string[] }) {
  return (
    <div className="mt-2 grid gap-1 text-sm text-neutral-600">
      {fields.map(field => <p key={field} className="break-words"><span className="text-neutral-500">{field}: </span>{textValue(record[field])}</p>)}
    </div>
  );
}

function payloadFor(endpoint: string, form: FormData, mode: 'create' | 'edit') {
  if (endpoint.endsWith('/projects')) return projectPayload(form, mode);
  if (endpoint.endsWith('/blog')) return blogPayload(form, mode);
  if (endpoint.endsWith('/blog-categories')) return blogCategoryPayload(form);
  if (endpoint.endsWith('/resume')) return resumePayload(form);
  if (endpoint.endsWith('/skills')) return skillPayload(form);
  if (endpoint.endsWith('/homepage-timeline')) return timelinePayload(form);
  return Object.fromEntries(form.entries());
}
