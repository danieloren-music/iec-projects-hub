'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
  FluentProvider,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import {
  Bot,
  CheckSquare,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  Layers3,
  Moon,
  Send,
  Sun,
  X,
} from 'lucide-react';
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  type Language,
  useLanguagePreference,
} from '@/components/language-preference';

export type { Language } from '@/components/language-preference';

type AppUi = {
  language: Language;
  isRtl: boolean;
};

const AppUiContext = createContext<AppUi>({ language: 'he', isRtl: true });

export function useAppUi() {
  return useContext(AppUiContext);
}

const links = [
  { href: '/', icon: LayoutDashboard, en: 'Portfolio', he: 'תיק פרויקטים' },
  { href: '/projects', icon: FolderKanban, en: 'Projects', he: 'פרויקטים' },
  { href: '/tasks', icon: CheckSquare, en: 'Tasks', he: 'משימות' },
  { href: '/infrastructure', icon: Layers3, en: 'Infrastructure', he: 'תשתיות' },
];

function LinPanel({ enabled, language, onClose }: {
  enabled: boolean;
  language: Language;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const isRtl = language === 'he';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim();
    if (!enabled || !question || sending) return;
    setSending(true);
    setError('');
    setReply('');
    try {
      const response = await fetch('/api/lin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || result?.reply);
      setReply(result?.reply || (isRtl ? 'לא התקבלה תשובה.' : 'No response was returned.'));
      setPrompt('');
    } catch {
      setError(isRtl ? 'Lin אינה זמינה כרגע. אפשר להמשיך להשתמש במערכת.' : 'Lin is unavailable right now. You can continue using the workspace.');
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="lin-panel" aria-label={isRtl ? 'צ׳אט Lin' : 'Lin chat'}>
      <div className="lin-panel__header">
        <div className="lin-panel__identity">
          <span className="lin-panel__icon"><Bot size={18} /></span>
          <div>
            <strong>Lin</strong>
            <span>{enabled ? (isRtl ? 'עוזרת אופציונלית' : 'Optional assistant') : (isRtl ? 'לא מוגדרת' : 'Not configured')}</span>
          </div>
        </div>
        <Button appearance="subtle" className="icon-button" onClick={onClose} aria-label={isRtl ? 'סגירה' : 'Close'}>
          <X size={18} />
        </Button>
      </div>
      {!enabled ? (
        <p className="lin-panel__message">
          {isRtl
          ? 'Lin מושבתת עד לאישור שימוש חיצוני ולהגדרת GEMINI_API_KEY ו-LIN_EXTERNAL_AI_ENABLED בצד השרת.'
          : 'Lin stays disabled until external AI use is approved and GEMINI_API_KEY plus LIN_EXTERNAL_AI_ENABLED are configured server-side.'}
        </p>
      ) : (
        <>
          <div className="lin-panel__body" aria-live="polite">
            {reply && <p className="lin-panel__message">{reply}</p>}
            {error && <p className="lin-panel__error">{error}</p>}
            {!reply && !error && (
              <p className="lin-panel__message">
                {isRtl ? 'שאלו שאלה על סביבת העבודה.' : 'Ask a question about your workspace.'}
              </p>
            )}
          </div>
          <form className="lin-panel__form" onSubmit={submit}>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={isRtl ? 'כתבו שאלה…' : 'Ask a question…'}
              aria-label={isRtl ? 'שאלה ל-Lin' : 'Question for Lin'}
              disabled={sending}
            />
            <Button appearance="primary" className="icon-button icon-button--primary" type="submit" disabled={sending || !prompt.trim()} aria-label={isRtl ? 'שליחה' : 'Send'}>
              <Send size={16} />
            </Button>
          </form>
        </>
      )}
    </aside>
  );
}

export function AppShell({
  children,
  linEnabled,
  currentUser,
  signOutAction,
}: {
  children: ReactNode;
  linEnabled: boolean;
  currentUser: { name: string | null; email: string | null } | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { language, isRtl, setLanguage } = useLanguagePreference();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [linOpen, setLinOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('iec-hub-theme', theme);
  }, [theme]);

  const copy = {
    subtitle: isRtl ? 'סביבת ניהול תיק הפרויקטים' : 'Project portfolio workspace',
    language: isRtl ? 'English' : 'עברית',
    theme: isRtl ? 'החלפת ערכת נושא' : 'Toggle color theme',
    lin: isRtl ? 'Lin' : 'Lin',
    demo: isRtl ? 'נתוני הדגמה סינתטיים כבויים' : 'Synthetic demo data is off',
    footer: isRtl
      ? 'נתונים יוצגו רק לאחר חיבור API מאושר. אין כאן נתוני הדגמה.'
      : 'Records appear only when an approved API is connected. No demo records are shown.',
  };

  return (
    <AppUiContext.Provider value={{ language, isRtl }}>
      <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme}>
      <div className="app-shell" data-theme={theme} dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="topbar" dir="ltr">
          <Link href="/" className="brand" aria-label="IEC Projects Hub home">
            <span className="brand__mark"><Layers3 size={20} /></span>
            <span className="brand__copy">
              <strong>IEC Projects Hub</strong>
              <small>{copy.subtitle}</small>
            </span>
          </Link>
          <div className="topbar__actions" dir="ltr">
            <span className="demo-indicator"><span className="demo-indicator__dot" />{copy.demo}</span>
            {currentUser && (
              <form action={signOutAction}>
                <Button appearance="subtle" className="control-button" type="submit">
                  {currentUser.name || currentUser.email || (isRtl ? 'התנתקות' : 'Sign out')}
                </Button>
              </form>
            )}
            <Button appearance="subtle" className="control-button" onClick={() => setLanguage(isRtl ? 'en' : 'he')} aria-label={copy.language}>
              <Globe2 size={16} /><span>{copy.language}</span>
            </Button>
            <Button appearance="subtle" className="control-button control-button--icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={copy.theme} title={copy.theme}>
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </Button>
            <Button
              appearance="subtle"
              className="control-button lin-toggle"
              onClick={() => setLinOpen(!linOpen)}
              disabled={!linEnabled}
              aria-label={!linEnabled
                ? (isRtl ? 'Lin מושבתת, יש להגדיר מפתח בצד השרת' : 'Lin unavailable; configure its server key')
                : (isRtl ? 'פתיחת Lin' : 'Open Lin')}
              title={!linEnabled ? (isRtl ? 'Lin אינה מוגדרת' : 'Lin is not configured') : undefined}
            >
              <Bot size={16} /><span>{copy.lin}</span><span className={`availability-dot${linEnabled ? ' availability-dot--on' : ''}`} />
            </Button>
          </div>
        </header>

        <nav className="primary-nav" aria-label={isRtl ? 'ניווט ראשי' : 'Primary navigation'}>
          {links.map(({ href, icon: Icon, en, he }) => {
            const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={`primary-nav__link${active ? ' primary-nav__link--active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon size={17} /><span>{isRtl ? he : en}</span>
              </Link>
            );
          })}
        </nav>

        <main className="main-content">{children}</main>
        <footer className="app-footer">
          <span>© IEC Projects Hub</span>
          <span>{copy.footer}</span>
        </footer>
        {linOpen && <LinPanel enabled={linEnabled} language={language} onClose={() => setLinOpen(false)} />}
      </div>
      </FluentProvider>
    </AppUiContext.Provider>
  );
}

export function PageHeading({ eyebrow, eyebrowHe, title, titleHe, description, descriptionHe, action }: {
  eyebrow?: string;
  eyebrowHe?: string;
  title: string;
  titleHe: string;
  description?: string;
  descriptionHe?: string;
  action?: ReactNode;
}) {
  const { isRtl } = useAppUi();
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{isRtl ? eyebrowHe || eyebrow : eyebrow}</div>}
        <h1>{isRtl ? titleHe : title}</h1>
        {description && <p>{isRtl ? descriptionHe || description : description}</p>}
      </div>
      {action && <div className="page-heading__action">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, titleHe, description, descriptionHe, icon: Icon = FolderKanban }: {
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  icon?: typeof FolderKanban;
}) {
  const { isRtl } = useAppUi();
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon size={23} /></span>
      <h2>{isRtl ? titleHe : title}</h2>
      <p>{isRtl ? descriptionHe : description}</p>
    </div>
  );
}
