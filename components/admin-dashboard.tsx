'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Badge } from '@/components/ui/card';

type View =
  | 'overview'
  | 'projects'
  | 'blog'
  | 'media'
  | 'videos'
  | 'resume'
  | 'skills'
  | 'testimonials'
  | 'homepage'
  | 'messages'
  | 'settings';

const nav: View[] = ['overview', 'projects', 'blog', 'media', 'videos', 'resume', 'skills', 'testimonials', 'homepage', 'messages', 'settings'];
const routeViews: Record<string, View> = {
  '/admin/dashboard': 'overview',
  '/admin/projects': 'projects',
  '/admin/blog': 'blog',
  '/admin/media': 'media',
  '/admin/videos': 'videos',
  '/admin/resume': 'resume',
  '/admin/skills': 'skills',
  '/admin/testimonials': 'testimonials',
  '/admin/homepage': 'homepage',
  '/admin/contact-messages': 'messages',
  '/admin/settings': 'settings',
};

type ApiRecord = Record<string, unknown> & { id?: string; title?: string; name?: string; slug?: string; status?: string; platform?: string; subject?: string };
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

type VideoOption = {
  id: string;
  title: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  caption?: string | null;
  category?: string;
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
    // Append Zod field-level details so the user knows exactly what failed
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
  return record.title ?? record.name ?? record.platform ?? record.subject ?? record.slug ?? record.id ?? 'Untitled';
}

function isMediaAsset(value: ApiRecord): value is ApiRecord & MediaOption {
  return typeof value.id === 'string' && typeof value.s3Key === 'string' && typeof value.filename === 'string' && typeof value.mimeType === 'string';
}

function isVideoAsset(value: ApiRecord): value is ApiRecord & VideoOption {
  return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.youtubeVideoId === 'string';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload';
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
  return accept.split(',').map(item => item.trim()).filter(Boolean).some(item => {
    if (item.endsWith('/*')) return asset.mimeType.startsWith(item.slice(0, -1));
    return asset.mimeType === item;
  });
}

function fileKindHelp(accept?: string) {
  if (accept === 'image/*') return 'PNG, JPG, JPEG, or WebP up to 10 MB.';
  if (accept === 'application/pdf') return 'PDF files up to 20 MB.';
  return 'Images or PDFs only. Videos should be added as YouTube links.';
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
    <div className="mx-auto grid w-full max-w-[1500px] min-w-0 items-start gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-6">
      <aside className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">CMS Admin</p>
        {nav.map(v => (
          <button
            key={v}
            onClick={() => { setView(v); const path = Object.entries(routeViews).find(([, viewName]) => viewName === v)?.[0]; if (path && typeof window !== 'undefined') window.history.pushState(null, '', path); }}
            className={`mb-1 block w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium capitalize transition ${view === v ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30' : 'text-slate-300 hover:bg-white/[.07] hover:text-white'}`}
          >
            {v === 'messages' ? 'contact messages' : v}
          </button>
        ))}
      </aside>
      <section className="min-w-0 overflow-hidden">
        <Header title={view === 'messages' ? 'contact messages' : view} />
        {view === 'overview' && <Overview />}
        {view === 'projects' && <ProjectManager />}
        {view === 'blog' && <BlogManager />}
        {view === 'media' && <MediaManager />}
        {view === 'videos' && <VideoManager />}
        {view === 'resume' && <ResumeManager />}
        {view === 'skills' && <SkillManager />}
        {view === 'testimonials' && <TestimonialManager />}
        {view === 'homepage' && <HomepageManager />}
        {view === 'messages' && <ContactMessagesManager />}
        {view === 'settings' && <SocialLinksManager />}
      </section>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="mb-5 rounded-3xl border border-white/10 bg-white/[.03] px-5 py-4 backdrop-blur">
      <p className="text-sm font-bold text-cyan-300">Admin</p>
      <h1 className="mt-1 text-3xl font-black capitalize tracking-tight text-white sm:text-4xl">{title}</h1>
    </div>
  );
}

function Status({ loading, feedback }: { loading: boolean; feedback: Feedback }) {
  return (
    <>
      {loading && <p className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Loading…</p>}
      {feedback && (
        <p className={`min-w-0 break-words rounded-2xl px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
          {feedback.message}
        </p>
      )}
    </>
  );
}

function Field({ label, name, value, required, type = 'text' }: { label: string; name: string; value?: unknown; required?: boolean; type?: string }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm text-slate-300">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={textValue(value)}
        className="w-full min-w-0 rounded-2xl bg-slate-950/60 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition focus:ring-cyan-300/50"
      />
    </label>
  );
}

function TextArea({ label, name, value, required, rows = 4 }: { label: string; name: string; value?: unknown; required?: boolean; rows?: number }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm text-slate-300">
      {label}
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={textValue(value)}
        className="w-full min-w-0 rounded-2xl bg-slate-950/60 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition focus:ring-cyan-300/50"
      />
    </label>
  );
}

function SelectField({ label, name, value, options }: { label: string; name: string; value?: unknown; options: string[] }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm text-slate-300">
      {label}
      <select name={name} defaultValue={textValue(value || options[0])} className="w-full min-w-0 rounded-2xl bg-slate-950/60 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition focus:ring-cyan-300/50">
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CheckField({ label, name, value }: { label: string; name: string; value?: unknown }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <input name={name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4" />
      {label}
    </label>
  );
}

function ActionButton({ children, type = 'button', onClick }: { children: React.ReactNode; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} onClick={onClick} className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">{children}</button>;
}

function SecondaryButton({ children, onClick, type = 'button' }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/30 hover:bg-white/10">{children}</button>;
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/20">{children}</button>;
}

function Overview() {
  const [counts, setCounts] = useState({ projects: 0, posts: 0, videos: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api<{ projects: unknown[] }>('/api/admin/projects'),
      api<{ posts: unknown[] }>('/api/admin/blog'),
      api<{ videos: unknown[] }>('/api/admin/videos'),
      api<{ messages: unknown[] }>('/api/admin/contact-messages'),
    ])
      .then(([projects, posts, videos, messages]) => {
        if (!mounted) return;
        setCounts({ projects: projects.projects.length, posts: posts.posts.length, videos: videos.videos.length, messages: messages.messages.length });
      })
      .catch(error => mounted && setFeedback({ type: 'error', message: error.message }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid min-w-0 gap-4">
      <Status loading={loading} feedback={feedback} />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Projects', counts.projects],
          ['Posts', counts.posts],
          ['Videos', counts.videos],
          ['Messages', counts.messages],
        ].map(([label, count]) => (
          <Card key={String(label)}>
            <p className="text-3xl font-black text-white">{String(count)}</p>
            <p className="text-slate-400">{String(label)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProjectManager() {
  const empty = { status: 'DRAFT', featured: false, metrics: '{"Outcome":"Result"}', tagIds: '', techStackIds: '', videoIds: '' };
  return (
    <CrudManager
      title="Projects"
      endpoint="/api/admin/projects"
      listKey="projects"
      itemKey="project"
      empty={empty}
      renderForm={(record, mode) => <ProjectForm record={record} mode={mode} />}
      renderSummary={record => <RecordSummary record={record} fields={['slug', 'status', 'tagline']} />}
    />
  );
}

function ProjectForm({ record, mode }: { record: ApiRecord; mode: 'create' | 'edit' }) {
  const tagIds = Array.isArray(record.tags) ? (record.tags as ApiRecord[]).map(t => t.id).join(',') : textValue(record.tagIds);
  const techStackIds = Array.isArray(record.techStack) ? (record.techStack as ApiRecord[]).map(t => t.id).join(',') : textValue(record.techStackIds);
  const videoIds = Array.isArray(record.videos) ? (record.videos as { video?: ApiRecord }[]).map(v => v.video?.id).filter(Boolean).join(',') : textValue(record.videoIds);
  return (
    <>
      <Field label="Slug" name="slug" value={record.slug} required={mode === 'create'} />
      <Field label="Title" name="title" value={record.title} required />
      <Field label="Tagline" name="tagline" value={record.tagline} required />
      <SelectField label="Status" name="status" value={record.status} options={['DRAFT', 'PUBLISHED', 'ARCHIVED']} />
      <CheckField label="Featured" name="featured" value={record.featured} />
      <TextArea label="Story" name="story" value={record.story} required />
      <TextArea label="Challenge" name="challenge" value={record.challenge} required />
      <TextArea label="Solution" name="solution" value={record.solution} required />
      <TextArea label="Results" name="results" value={record.results} required />
      <TextArea label="Metrics JSON" name="metrics" value={record.metrics ? JSON.stringify(record.metrics) : undefined} rows={3} />
      <MediaPicker label="Cover image" name="coverImageKey" value={record.coverImageKey} accept="image/*" defaultFolder="images/projects" usedIn="project-cover" />
      <MediaPicker label="Case study PDF" name="pdfKey" value={record.pdfKey} accept="application/pdf" defaultFolder="pdfs/projects" usedIn="project-pdf" />
      <Field label="GitHub URL" name="githubUrl" value={record.githubUrl} />
      <Field label="Live URL" name="liveUrl" value={record.liveUrl} />
      <TagSelector name="tagIds" value={tagIds} />
      <SkillSelector name="techStackIds" value={techStackIds} />
      <VideoSelector name="videoIds" value={videoIds} />
    </>
  );
}

function projectPayload(form: FormData, mode: 'create' | 'edit') {
  const rawMetrics = String(form.get('metrics') ?? '').trim();
  let metrics: Record<string, string> | undefined;
  if (rawMetrics) {
    try {
      const parsed = JSON.parse(rawMetrics);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Metrics must be a JSON object, e.g. {"Outcome":"Result"}');
      }
      metrics = parsed as Record<string, string>;
    } catch (e) {
      throw new Error(
        e instanceof SyntaxError
          ? `Metrics JSON is invalid — ${e.message}. Expected format: {"Key":"Value"}`
          : (e instanceof Error ? e.message : 'Invalid metrics JSON'),
      );
    }
  }
  const payload: Record<string, unknown> = {
    title: String(form.get('title') ?? ''),
    tagline: String(form.get('tagline') ?? ''),
    status: String(form.get('status') ?? 'DRAFT'),
    featured: parseBoolean(form.get('featured')),
    story: String(form.get('story') ?? ''),
    challenge: String(form.get('challenge') ?? ''),
    solution: String(form.get('solution') ?? ''),
    results: String(form.get('results') ?? ''),
    coverImageKey: optionalString(form.get('coverImageKey')),
    pdfKey: optionalString(form.get('pdfKey')),
    githubUrl: optionalString(form.get('githubUrl')),
    liveUrl: optionalString(form.get('liveUrl')),
    tagIds: parseCsv(form.get('tagIds')),
    techStackIds: parseCsv(form.get('techStackIds')),
    videoIds: parseCsv(form.get('videoIds')),
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
      itemKey="post"
      empty={{ status: 'DRAFT', featured: false, tagIds: '', videoIds: '' }}
      renderForm={(record, mode) => <BlogForm record={record} mode={mode} />}
      renderSummary={record => <RecordSummary record={record} fields={['slug', 'status', 'excerpt']} />}
    />
  );
}

function BlogForm({ record, mode }: { record: ApiRecord; mode: 'create' | 'edit' }) {
  const tagIds = Array.isArray(record.tags) ? (record.tags as ApiRecord[]).map(t => t.id).join(',') : textValue(record.tagIds);
  const videoIds = Array.isArray(record.videos) ? (record.videos as { video?: ApiRecord }[]).map(v => v.video?.id).filter(Boolean).join(',') : textValue(record.videoIds);
  return (
    <>
      <Field label="Slug" name="slug" value={record.slug} required={mode === 'create'} />
      <Field label="Title" name="title" value={record.title} required />
      <TextArea label="Excerpt" name="excerpt" value={record.excerpt} required rows={3} />
      <TextArea label="Body" name="body" value={record.body} required rows={8} />
      <SelectField label="Status" name="status" value={record.status} options={['DRAFT', 'PUBLISHED', 'ARCHIVED']} />
      <CheckField label="Featured" name="featured" value={record.featured} />
      <MediaPicker label="Cover image" name="coverImageKey" value={record.coverImageKey} accept="image/*" defaultFolder="images/blog" usedIn="blog-cover" />
      <TagSelector name="tagIds" value={tagIds} />
      <VideoSelector name="videoIds" value={videoIds} />
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
    coverImageKey: optionalString(form.get('coverImageKey')),
    tagIds: parseCsv(form.get('tagIds')),
    videoIds: parseCsv(form.get('videoIds')),
  };
  if (mode === 'create') payload.slug = String(form.get('slug') ?? '');
  else if (String(form.get('slug') ?? '').trim()) payload.slug = String(form.get('slug'));
  return payload;
}

function MediaPicker({
  label,
  name,
  value,
  accept,
  defaultFolder,
  usedIn,
}: {
  label: string;
  name: string;
  value?: unknown;
  accept?: string;
  defaultFolder: string;
  usedIn?: string;
}) {
  const [assets, setAssets] = useState<MediaOption[]>([]);
  const [selectedKey, setSelectedKey] = useState(textValue(value));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setSelectedKey(textValue(value));
  }, [value]);
  const selectedAsset = assets.find(asset => asset.s3Key === selectedKey);

  const loadAssets = useCallback(async () => {
    try {
      const data = await api<{ assets: MediaOption[] }>('/api/admin/media');
      setAssets(data.assets);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load media library' });
    }
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  return (
    <div className="grid min-w-0 gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-4">
      <input type="hidden" name={name} value={selectedKey} />
      <div>
        <p className="text-sm font-bold text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">Upload a new file or choose one from the existing media library. The saved value is the S3 key.</p>
      </div>

      <select
        value={selectedKey}
        onChange={event => setSelectedKey(event.target.value)}
        className="w-full min-w-0 rounded-2xl bg-slate-950/60 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition focus:ring-cyan-300/50"
      >
        <option value="">No media selected</option>
        {assets.filter(asset => mediaMatchesAccept(asset, accept)).map(asset => (
          <option key={asset.id} value={asset.s3Key}>
            {asset.filename} — {asset.s3Key}
          </option>
        ))}
      </select>

      {selectedKey && (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
          <p className="min-w-0 break-all text-xs text-slate-400">Selected key: {selectedKey}</p>
          {typeof selectedAsset?.url === 'string' && typeof selectedAsset?.mimeType === 'string' && selectedAsset.mimeType.startsWith('image/') && (
            <img
              src={selectedAsset.url}
              alt={typeof selectedAsset.alt === 'string' ? selectedAsset.alt : selectedAsset.filename}
              className="mt-3 max-h-40 rounded-2xl object-cover"
            />
          )}
          {typeof selectedAsset?.url === 'string' && typeof selectedAsset?.mimeType === 'string' && !selectedAsset.mimeType.startsWith('image/') && (
            <a className="mt-3 inline-flex text-sm font-bold text-cyan-300" href={selectedAsset.url} target="_blank" rel="noreferrer">Open uploaded file</a>
          )}
        </div>
      )}

      <MediaUploader
        defaultFolder={defaultFolder}
        usedIn={usedIn}
        accept={accept}
        onUploaded={(asset) => {
          setSelectedKey(asset.s3Key);
          setAssets(current => [asset, ...current.filter(item => item.id !== asset.id && item.s3Key !== asset.s3Key)]);
          setFeedback({ type: 'success', message: `Selected ${asset.s3Key}` });
        }}
      />

      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function MediaUploader({
  defaultFolder,
  usedIn,
  accept,
  onUploaded,
}: {
  defaultFolder: string;
  usedIn?: string;
  accept?: string;
  onUploaded: (asset: MediaOption) => void;
}) {
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
      setFeedback({ type: 'error', message: 'Videos must be added with a YouTube URL, not uploaded to S3.' });
      return;
    }

    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setFeedback({ type: 'error', message: 'Only images and PDF files can be uploaded.' });
      return;
    }

    if (accept === 'image/*' && !file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please choose an image file for this field.' });
      return;
    }

    if (accept === 'application/pdf' && file.type !== 'application/pdf') {
      setFeedback({ type: 'error', message: 'Please choose a PDF file for this field.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const folder = file.type === 'application/pdf' && defaultFolder === 'images' ? 'pdfs' : defaultFolder;
      const key = uniqueS3Key(folder, file);
      const presign = await api<{ uploadUrl: string; key: string }>('/api/admin/media/upload-url', {
        method: 'POST',
        body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream', size: file.size }),
      });

      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!uploadRes.ok) {
  const errorText = await uploadRes.text().catch(() => '');
  throw new Error(
    `S3 upload failed with ${uploadRes.status}: ${errorText.slice(0, 800)}`
  );
}

      const mediaType = file.type === 'application/pdf'
        ? 'PDF'
        : file.type.startsWith('image/')
          ? 'IMAGE'
          : 'ICON';

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
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3">
      <p className="text-xs text-slate-500">{fileKindHelp(accept)}</p>
      <input
        type="file"
        accept={accept}
        onChange={event => setFile(event.target.files?.[0] ?? null)}
        className="w-full min-w-0 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950"
      />
      <input
        value={alt}
        onChange={event => setAlt(event.target.value)}
        placeholder="Alt text / description"
        className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
      />
      <SecondaryButton onClick={upload}>{uploading ? 'Uploading…' : 'Upload file'}</SecondaryButton>
      <Status loading={uploading} feedback={feedback} />
    </div>
  );
}


function TagSelector({ name, value }: { name: string; value?: unknown }) {
  return (
    <MultiIdSelector
      name={name}
      value={value}
      title="Tags"
      description="Select tags from the database. Leave empty if you have not created tags yet."
      endpoint="/api/admin/tags"
      listKey="tags"
      labelFor={(record) => textValue(record.name ?? record.slug ?? record.id)}
    />
  );
}

function SkillSelector({ name, value }: { name: string; value?: unknown }) {
  return (
    <MultiIdSelector
      name={name}
      value={value}
      title="Tech stack"
      description="Select skills/tools that were used in this project."
      endpoint="/api/admin/skills"
      listKey="skills"
      labelFor={(record) => textValue(record.name ?? record.id)}
    />
  );
}

function MultiIdSelector({
  name,
  value,
  title,
  description,
  endpoint,
  listKey,
  labelFor,
}: {
  name: string;
  value?: unknown;
  title: string;
  description: string;
  endpoint: string;
  listKey: string;
  labelFor: (record: ApiRecord) => string;
}) {
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(parseCsv(typeof value === 'string' ? value : textValue(value)));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setSelectedIds(parseCsv(typeof value === 'string' ? value : textValue(value)));
  }, [value]);

  useEffect(() => {
    let mounted = true;
    api<Record<string, ApiRecord[]>>(endpoint)
      .then(data => {
        if (mounted) setItems(data[listKey] ?? []);
      })
      .catch(error => {
        if (mounted) setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not load ${title.toLowerCase()}` });
      });
    return () => { mounted = false; };
  }, [endpoint, listKey, title]);

  function toggle(id: string) {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-4">
      <input type="hidden" name={name} value={selectedIds.join(',')} />
      <div>
        <p className="text-sm font-bold text-slate-200">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No records found. You can still save without selecting any.</p>
      ) : (
        <div className="grid min-w-0 gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          {items.map(item => (
            <label key={String(item.id)} className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={typeof item.id === 'string' && selectedIds.includes(item.id)}
                onChange={() => typeof item.id === 'string' && toggle(item.id)}
                className="h-4 w-4"
              />
              <span>{labelFor(item)}</span>
            </label>
          ))}
        </div>
      )}
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function VideoSelector({ name, value, multiple = true }: { name: string; value?: unknown; multiple?: boolean }) {
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(parseCsv(typeof value === 'string' ? value : textValue(value)));
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setSelectedIds(parseCsv(typeof value === 'string' ? value : textValue(value)));
  }, [value]);

  const loadVideos = useCallback(async () => {
    try {
      const data = await api<{ videos: VideoOption[] }>('/api/admin/videos');
      setVideos(data.videos);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load videos' });
    }
  }, []);

  useEffect(() => { void loadVideos(); }, [loadVideos]);

  function toggle(id: string) {
    setSelectedIds(current => {
      if (!multiple) return current.includes(id) ? [] : [id];
      return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    });
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-4">
      <input type="hidden" name={name} value={multiple ? selectedIds.join(',') : (selectedIds[0] ?? '')} />
      <div>
        <p className="text-sm font-bold text-slate-200">Videos</p>
        <p className="text-xs text-slate-500">Paste a YouTube URL to create a video, then select the videos to attach.</p>
      </div>

      <QuickVideoCreator onCreated={(video) => {
        setVideos(current => [video, ...current.filter(item => item.id !== video.id)]);
        setSelectedIds(current => {
          if (!multiple) return [video.id];
          return current.includes(video.id) ? current : [...current, video.id];
        });
      }} />

      {videos.length === 0 ? (
        <p className="text-sm text-slate-500">No videos found yet.</p>
      ) : (
        <div className="grid gap-3">
          {videos.map(video => (
            <label key={video.id} className="flex min-w-0 gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
              <input type="checkbox" checked={selectedIds.includes(video.id)} onChange={() => toggle(video.id)} className="mt-1 h-4 w-4" />
              {video.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-24 rounded-xl object-cover" />}
              <span className="min-w-0">
                <span className="block truncate font-bold text-white">{video.title}</span>
                <span className="block truncate text-xs text-slate-500">{video.youtubeVideoId}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function QuickVideoCreator({ onCreated }: { onCreated: (video: VideoOption) => void }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('DEMO');
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function create() {
    if (!youtubeUrl.trim() || !title.trim()) {
      setFeedback({ type: 'error', message: 'YouTube URL and title are required.' });
      return;
    }

    try {
      const data = await api<{ video: VideoOption }>('/api/admin/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl, title, caption: caption.trim() || null, category, featured: false, order: 0 }),
      });
      setYoutubeUrl('');
      setTitle('');
      setCaption('');
      setFeedback({ type: 'success', message: 'Video created and selected.' });
      onCreated(data.video);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not create video' });
    }
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3">
      <input value={youtubeUrl} onChange={event => setYoutubeUrl(event.target.value)} placeholder="Paste YouTube URL" className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-300/50" />
      <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Video title" className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-300/50" />
      <input value={caption} onChange={event => setCaption(event.target.value)} placeholder="Caption optional" className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-300/50" />
      <select value={category} onChange={event => setCategory(event.target.value)} className="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-300/50">
        {['DEMO', 'WALKTHROUGH', 'ARCHITECTURE', 'TUTORIAL', 'TESTIMONIAL', 'INTRO'].map(option => <option key={option}>{option}</option>)}
      </select>
      <SecondaryButton onClick={create}>Add YouTube video</SecondaryButton>
      <Status loading={false} feedback={feedback} />
    </div>
  );
}

function MediaManager() {
  return (
    <CrudManager
      title="S3 media library"
      endpoint="/api/admin/media"
      listKey="assets"
      itemKey="asset"
      empty={{ mediaType: 'IMAGE', size: 0 }}
      renderForm={record => <MediaForm record={record} />}
      renderSummary={record => <MediaSummary record={record} />}
      extraAction={<MediaUploaderCard />}
      createOnly
    />
  );
}

function MediaForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="S3 key" name="s3Key" value={record.s3Key} required />
      <Field label="Filename" name="filename" value={record.filename} required />
      <Field label="MIME type" name="mimeType" value={record.mimeType} required />
      <SelectField label="Media type" name="mediaType" value={record.mediaType} options={['IMAGE', 'ICON', 'PDF', 'RESUME', 'AVATAR']} />
      <Field label="Size bytes" name="size" value={record.size} type="number" />
      <Field label="Alt text" name="alt" value={record.alt} />
      <Field label="Used in" name="usedIn" value={record.usedIn} />
    </>
  );
}

function MediaSummary({ record }: { record: ApiRecord }) {
  const asset = isMediaAsset(record) ? record : null;
  return (
    <div className="mt-2 grid min-w-0 gap-2 text-sm text-slate-400">
      <p><span className="text-slate-500">filename: </span>{textValue(record.filename)}</p>
      <p><span className="text-slate-500">type: </span>{textValue(record.mediaType)}</p>
      <p className="min-w-0 break-all"><span className="text-slate-500">key: </span>{textValue(record.s3Key)}</p>
      {asset?.url && asset.mimeType.startsWith('image/') && <img src={asset.url} alt={asset.alt ?? asset.filename} className="mt-2 max-h-36 rounded-2xl object-cover" />}
    </div>
  );
}

function mediaPayload(form: FormData) {
  return {
    s3Key: String(form.get('s3Key') ?? ''),
    filename: String(form.get('filename') ?? ''),
    mimeType: String(form.get('mimeType') ?? ''),
    mediaType: String(form.get('mediaType') ?? 'IMAGE'),
    size: parseNumber(form.get('size')),
    alt: optionalString(form.get('alt')),
    usedIn: optionalString(form.get('usedIn')),
  };
}

function MediaUploaderCard() {
  const [uploaded, setUploaded] = useState<MediaOption | null>(null);
  return (
    <Card>
      <h2 className="text-2xl font-black text-white">Upload file to S3</h2>
      <p className="mt-2 text-slate-400">Choose a file and the dashboard uploads it to S3, then saves the media record automatically.</p>
      <div className="mt-4">
        <MediaUploader defaultFolder="images" usedIn="media-library" onUploaded={setUploaded} />
      </div>
      {uploaded && (
        <div className="mt-4 min-w-0 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="min-w-0 break-all text-sm text-slate-300">Uploaded key: {uploaded.s3Key}</p>
          {uploaded.url && uploaded.mimeType.startsWith('image/') && <img src={uploaded.url} alt={uploaded.alt ?? uploaded.filename} className="mt-3 max-h-48 rounded-2xl object-cover" />}
        </div>
      )}
    </Card>
  );
}

function VideoManager() {
  return (
    <CrudManager
      title="YouTube video manager"
      endpoint="/api/admin/videos"
      listKey="videos"
      itemKey="video"
      empty={{ category: 'DEMO', featured: false, order: 0 }}
      renderForm={record => <VideoForm record={record} />}
      renderSummary={record => <VideoSummary record={record} />}
      submitLabel="Validate & save"
    />
  );
}

function VideoForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="YouTube URL" name="youtubeUrl" value={record.youtubeUrl} required />
      <Field label="Title" name="title" value={record.title} required />
      <TextArea label="Caption" name="caption" value={record.caption} rows={3} />
      <SelectField label="Category" name="category" value={record.category} options={['DEMO', 'WALKTHROUGH', 'ARCHITECTURE', 'TUTORIAL', 'TESTIMONIAL', 'INTRO']} />
      <CheckField label="Featured" name="featured" value={record.featured} />
      <Field label="Order" name="order" value={record.order} type="number" />
    </>
  );
}

function VideoSummary({ record }: { record: ApiRecord }) {
  const video = isVideoAsset(record) ? record : null;
  return (
    <div className="mt-2 grid min-w-0 gap-2 text-sm text-slate-400">
      <p><span className="text-slate-500">youtubeVideoId: </span>{textValue(record.youtubeVideoId)}</p>
      <p><span className="text-slate-500">category: </span>{textValue(record.category)}</p>
      <p><span className="text-slate-500">caption: </span>{textValue(record.caption)}</p>
      {video?.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.title} className="mt-2 max-h-36 rounded-2xl object-cover" />}
    </div>
  );
}

function videoPayload(form: FormData) {
  return {
    youtubeUrl: String(form.get('youtubeUrl') ?? ''),
    title: String(form.get('title') ?? ''),
    caption: optionalString(form.get('caption')),
    category: String(form.get('category') ?? 'DEMO'),
    featured: parseBoolean(form.get('featured')),
    order: parseNumber(form.get('order')),
  };
}

function ResumeManager() {
  return (
    <CrudManager
      title="Resume manager"
      endpoint="/api/admin/resume"
      listKey="resumes"
      itemKey="resume"
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
      itemKey="skill"
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

function TestimonialManager() {
  return (
    <CrudManager
      title="Testimonials"
      endpoint="/api/admin/testimonials"
      listKey="testimonials"
      itemKey="testimonial"
      empty={{ visible: true, order: 0 }}
      renderForm={record => <TestimonialForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['role', 'company', 'visible']} />}
    />
  );
}

function TestimonialForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="Name" name="name" value={record.name} required />
      <Field label="Role" name="role" value={record.role} required />
      <Field label="Company" name="company" value={record.company} required />
      <MediaPicker label="Avatar" name="avatarKey" value={record.avatarKey} accept="image/*" defaultFolder="images/avatars" usedIn="testimonial-avatar" />
      <TextArea label="Quote" name="quote" value={record.quote} required />
      <CheckField label="Visible" name="visible" value={record.visible ?? true} />
      <Field label="Order" name="order" value={record.order} type="number" />
    </>
  );
}

function testimonialPayload(form: FormData) {
  return {
    name: String(form.get('name') ?? ''),
    role: String(form.get('role') ?? ''),
    company: String(form.get('company') ?? ''),
    avatarKey: optionalString(form.get('avatarKey')),
    quote: String(form.get('quote') ?? ''),
    visible: parseBoolean(form.get('visible')),
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
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load homepage content' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(form: FormData) {
    setFeedback(null);
    try {
      const payload = {
        heroHeadline: String(form.get('heroHeadline') ?? ''),
        heroSubtext: String(form.get('heroSubtext') ?? ''),
        ctaText: String(form.get('ctaText') ?? ''),
        ctaUrl: String(form.get('ctaUrl') ?? ''),
        aboutText: String(form.get('aboutText') ?? ''),
        metaTitle: String(form.get('metaTitle') ?? ''),
        metaDescription: String(form.get('metaDescription') ?? ''),
        featuredVideoId: optionalString(form.get('featuredVideoId')),
      };
      const data = await api<{ content: ApiRecord }>('/api/admin/homepage', { method: 'PUT', body: JSON.stringify(payload) });
      setContent(data.content);
      setFeedback({ type: 'success', message: 'Homepage saved.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not save homepage' });
    }
  }

  const record = content ?? {};
  return (
    <div className="grid min-w-0 gap-5">
      <Status loading={loading} feedback={feedback} />
      <Card className="min-w-0 overflow-hidden">
        <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="grid min-w-0 gap-4">
          <Field label="Hero headline" name="heroHeadline" value={record.heroHeadline} required />
          <TextArea label="Hero subtext" name="heroSubtext" value={record.heroSubtext} required />
          <Field label="CTA text" name="ctaText" value={record.ctaText} required />
          <Field label="CTA URL" name="ctaUrl" value={record.ctaUrl} required />
          <TextArea label="About text" name="aboutText" value={record.aboutText} required />
          <Field label="Meta title" name="metaTitle" value={record.metaTitle} required />
          <TextArea label="Meta description" name="metaDescription" value={record.metaDescription} required rows={3} />
          <VideoSelector name="featuredVideoId" value={record.featuredVideoId} multiple={false} />
          <ActionButton type="submit">Save homepage</ActionButton>
        </form>
      </Card>
    </div>
  );
}

function ContactMessagesManager() {
  const [messages, setMessages] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function load() {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api<{ messages: ApiRecord[] }>('/api/admin/contact-messages');
      setMessages(data.messages);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not load messages' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function update(id: string, status: string) {
    try {
      await api(`/api/admin/contact-messages/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setFeedback({ type: 'success', message: 'Message updated.' });
      await load();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not update message' });
    }
  }

  async function remove(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this message?')) return;
    try {
      await api(`/api/admin/contact-messages/${id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Message deleted.' });
      await load();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not delete message' });
    }
  }

  return (
    <div className="grid min-w-0 gap-5">
      <Status loading={loading} feedback={feedback} />
      {messages.length === 0 && !loading && <Card><p className="text-slate-400">No contact messages found.</p></Card>}
      {messages.map(message => (
        <Card key={String(message.id)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>{textValue(message.status)}</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">{textValue(message.subject)}</h2>
              <p className="text-slate-400">{textValue(message.name)} · {textValue(message.email)}</p>
              <p className="mt-3 whitespace-pre-wrap text-slate-300">{textValue(message.message)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton onClick={() => message.id && update(message.id, 'READ')}>Mark read</SecondaryButton>
              <SecondaryButton onClick={() => message.id && update(message.id, 'ARCHIVED')}>Archive</SecondaryButton>
              <DangerButton onClick={() => message.id && remove(message.id)}>Delete</DangerButton>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SocialLinksManager() {
  return (
    <CrudManager
      title="Social links"
      endpoint="/api/admin/social-links"
      listKey="socialLinks"
      itemKey="socialLink"
      empty={{ visible: true, order: 0 }}
      renderForm={record => <SocialLinkForm record={record} />}
      renderSummary={record => <RecordSummary record={record} fields={['platform', 'url', 'visible']} />}
    />
  );
}

function SocialLinkForm({ record }: { record: ApiRecord }) {
  return (
    <>
      <Field label="Platform" name="platform" value={record.platform} required />
      <Field label="URL" name="url" value={record.url} required />
      <MediaPicker label="Icon" name="iconKey" value={record.iconKey} accept="image/*" defaultFolder="icons" usedIn="social-icon" />
      <CheckField label="Visible" name="visible" value={record.visible ?? true} />
      <Field label="Order" name="order" value={record.order} type="number" />
    </>
  );
}

function socialLinkPayload(form: FormData) {
  return {
    platform: String(form.get('platform') ?? ''),
    url: String(form.get('url') ?? ''),
    iconKey: optionalString(form.get('iconKey')),
    visible: parseBoolean(form.get('visible')),
    order: parseNumber(form.get('order')),
  };
}

type CrudManagerProps = {
  title: string;
  endpoint: string;
  listKey: string;
  itemKey: string;
  empty: ApiRecord;
  renderForm: (record: ApiRecord, mode: 'create' | 'edit') => React.ReactNode;
  renderSummary: (record: ApiRecord) => React.ReactNode;
  extraAction?: React.ReactNode;
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
    if (typeof window !== 'undefined' && !window.confirm(`Delete or archive ${textValue(recordTitle(record))}?`)) return;
    setFeedback(null);
    try {
      await api(`${props.endpoint}/${record.id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: `${props.title} deleted or archived.` });
      if (selected?.id === record.id) setSelected(null);
      await load();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : `Could not delete ${props.title}` });
    }
  }

  return (
    <div className="grid w-full min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]">
      <div className="grid min-w-0 gap-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <Status loading={loading} feedback={feedback} />
          <ActionButton onClick={() => { setSelected(null); setMode('create'); }}>New</ActionButton>
        </div>
        {items.length === 0 && !loading && <Card><p className="text-slate-400">No records found.</p></Card>}
        {items.map(record => (
          <Card key={String(record.id)} className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-black text-white sm:text-2xl">{textValue(recordTitle(record))}</h2>
                {props.renderSummary(record)}
              </div>
              <div className="flex flex-wrap gap-2">
                {!props.createOnly && <SecondaryButton onClick={() => { setSelected(record); setMode('edit'); }}>Edit</SecondaryButton>}
                {!props.createOnly && <DangerButton onClick={() => void remove(record)}>Delete</DangerButton>}
              </div>
            </div>
          </Card>
        ))}
        {props.extraAction}
      </div>
      <Card className="min-w-0 overflow-hidden xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <h2 className="text-2xl font-black text-white">{mode === 'create' ? `New ${props.title}` : `Edit ${props.title}`}</h2>
        <form key={`${mode}-${selected?.id ?? 'new'}`} onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="mt-4 grid min-w-0 gap-4">
          {props.renderForm(current, mode)}
          <ActionButton type="submit">{props.submitLabel ?? 'Save'}</ActionButton>
        </form>
      </Card>
    </div>
  );
}

function RecordSummary({ record, fields }: { record: ApiRecord; fields: string[] }) {
  return (
    <div className="mt-2 grid min-w-0 gap-1 text-sm text-slate-400">
      {fields.map(field => (
        <p key={field} className="min-w-0 break-words"><span className="text-slate-500">{field}: </span>{textValue(record[field])}</p>
      ))}
    </div>
  );
}

function payloadFor(endpoint: string, form: FormData, mode: 'create' | 'edit') {
  if (endpoint.endsWith('/projects')) return projectPayload(form, mode);
  if (endpoint.endsWith('/blog')) return blogPayload(form, mode);
  if (endpoint.endsWith('/media')) return mediaPayload(form);
  if (endpoint.endsWith('/videos')) return videoPayload(form);
  if (endpoint.endsWith('/resume')) return resumePayload(form);
  if (endpoint.endsWith('/skills')) return skillPayload(form);
  if (endpoint.endsWith('/testimonials')) return testimonialPayload(form);
  if (endpoint.endsWith('/social-links')) return socialLinkPayload(form);
  return Object.fromEntries(form.entries());
}
