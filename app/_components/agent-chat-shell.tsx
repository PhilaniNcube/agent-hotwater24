"use client";

import {
  CheckIcon,
  MenuIcon,
  PanelLeftIcon,
  PanelRightIcon,
  UploadIcon,
  SparklesIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryState } from "nuqs";
import { deleteChatAction } from "@/app/actions/chat";
import {
  CHAT_BOOTSTRAP_SYNC_EVENT,
  type ChatBootstrapSyncDetail,
} from "@/app/_components/agent-chat-events";
import {
  ChatShellProvider,
  type EnabledConnections,
} from "@/app/_components/chat-shell-context";
import { CrmView } from "@/components/crm/crm-view";
import { CrmNavSidebar } from "@/components/crm/nav-sidebar";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CHAT_PANEL_COOKIE_MAX_AGE,
  CHAT_PANEL_COOKIE_NAME,
  readBooleanCookie,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  writeBooleanCookie,
} from "@/lib/chat/sidebar-state";
import {
  CRM_VIEW_PARAM,
  crmViewParser,
  QUOTE_ID_PARAM,
  quoteIdParser,
} from "@/lib/crm/params";
import type { ChatListItem, SetupStatus, Viewer } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

export function AgentChatShell({
  children,
  initialChats,
  initialNextCursor,
  setupStatus,
  viewer,
}: {
  readonly children: ReactNode;
  readonly initialChats: readonly ChatListItem[];
  readonly initialNextCursor: string | null;
  readonly setupStatus: SetupStatus;
  readonly viewer: Viewer | null;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const [history, setHistory] = useState<ChatListItem[]>([...initialChats]);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [draftBeforeSignIn, setDraftBeforeSignIn] = useState("");
  const [signInCallbackPath, setSignInCallbackPath] = useState("/");
  const [viewerState, setViewerState] = useState(viewer);
  const [setupStatusState, setSetupStatusState] = useState(setupStatus);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [enabledConnections, setEnabledConnectionsState] = useState<EnabledConnections>({
    linear: true,
    notion: true,
    sentry: true,
  });
  const cursorRef = useRef(initialNextCursor);
  const activeChatIdRef = useRef(activeChatId);
  const setupReady = setupStatusState.appReady;
  const router = useRouter();

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    cursorRef.current = nextCursor;
  }, [nextCursor]);

  useLayoutEffect(() => {
    const savedSidebar = readBooleanCookie(SIDEBAR_COOKIE_NAME);

    if (savedSidebar !== null) {
      setDesktopSidebarOpen(savedSidebar);
    }

    const savedPanel = readBooleanCookie(CHAT_PANEL_COOKIE_NAME);

    if (savedPanel !== null) {
      setChatPanelOpen(savedPanel);
    }
  }, []);

  const requestSignIn = useCallback((draft?: string) => {
    setDraftBeforeSignIn(draft?.trim() ?? "");
    setSignInCallbackPath(window.location.pathname || "/");
    setAuthDialogOpen(true);
  }, []);

  const setDesktopSidebarOpenPersisted = useCallback((open: boolean) => {
    setDesktopSidebarOpen(open);
    writeBooleanCookie(SIDEBAR_COOKIE_NAME, open, SIDEBAR_COOKIE_MAX_AGE);
  }, []);

  const setChatPanelOpenPersisted = useCallback((open: boolean) => {
    setChatPanelOpen(open);
    writeBooleanCookie(CHAT_PANEL_COOKIE_NAME, open, CHAT_PANEL_COOKIE_MAX_AGE);
  }, []);

  const setConnectionEnabled = useCallback(
    (connection: keyof EnabledConnections, enabled: boolean) => {
      setEnabledConnectionsState((current) => ({
        ...current,
        [connection]: enabled,
      }));
    },
    [],
  );

  const touchChat = useCallback((chat: ChatListItem) => {
    setHistory((items) => {
      const current = items.find((item) => item.id === chat.id);

      return [
        {
          id: chat.id,
          title: chat.title || current?.title || "New chat",
          updatedAt: chat.updatedAt,
        },
        ...items.filter((item) => item.id !== chat.id),
      ];
    });
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setHistory((items) =>
      items.map((item) => (item.id === chatId ? { ...item, title } : item)),
    );
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setHistory((items) => items.filter((item) => item.id !== chatId));
  }, []);

  const startNewChat = useCallback(() => {
    activeChatIdRef.current = null;
    setActiveChatId(null);
    setMobileSidebarOpen(false);
    router.push("/", { scroll: false });
  }, [router]);

  const handleSidebarNavigate = useCallback((chatId?: string | null) => {
    setMobileSidebarOpen(false);

    if (chatId !== undefined) {
      activeChatIdRef.current = chatId;
      setActiveChatId(chatId);
    }
  }, []);

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        await deleteChatAction(chatId);
        removeChat(chatId);

        if (activeChatIdRef.current === chatId) {
          startNewChat();
        }
      } catch {
        // Deleting a sidebar item is best-effort. Active chat persistence
        // errors are shown by the chat surface where the user is working.
      }
    },
    [removeChat, startNewChat],
  );

  const loadMoreChats = useCallback(async () => {
    const cursor = cursorRef.current;

    if (!cursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await fetch(`/api/chats?cursor=${encodeURIComponent(cursor)}`);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        readonly chats?: readonly ChatListItem[];
        readonly nextCursor?: string | null;
      };
      const incoming = data.chats ?? [];

      setHistory((items) => {
        const existing = new Set(items.map((item) => item.id));
        const fresh = incoming.filter((item) => !existing.has(item.id));

        return [...items, ...fresh];
      });
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // Ignore network hiccups; the observer/button can retry.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  const setBootstrapData = useCallback(
    ({
      chats,
      nextCursor: incomingNextCursor,
      setupStatus: incomingSetupStatus,
      viewer: incomingViewer,
    }: {
      readonly chats: readonly ChatListItem[];
      readonly nextCursor: string | null;
      readonly setupStatus: SetupStatus;
      readonly viewer: Viewer | null;
    }) => {
      setSetupStatusState(incomingSetupStatus);
      setViewerState(incomingViewer);
      setHistory((items) => (incomingViewer ? mergeChatHistory(chats, items) : []));
      setNextCursor(incomingNextCursor);
      setHistoryLoading(false);
      cursorRef.current = incomingNextCursor;
    },
    [],
  );

  useEffect(() => {
    const target = window as Window & {
      __eveChatBootstrapSync?: ChatBootstrapSyncDetail;
    };
    const handleBootstrapSync = (event: Event) => {
      setBootstrapData((event as CustomEvent<ChatBootstrapSyncDetail>).detail);
    };

    window.addEventListener(CHAT_BOOTSTRAP_SYNC_EVENT, handleBootstrapSync);
    if (target.__eveChatBootstrapSync) {
      setBootstrapData(target.__eveChatBootstrapSync);
    }

    return () => {
      window.removeEventListener(CHAT_BOOTSTRAP_SYNC_EVENT, handleBootstrapSync);
    };
  }, [setBootstrapData]);

  const contextValue = useMemo(
    () => ({
      activeChatId,
      chatPanelOpen,
      desktopSidebarOpen,
      enabledConnections,
      removeChat,
      requestSignIn,
      setActiveChatId,
      setChatPanelOpen: setChatPanelOpenPersisted,
      setConnectionEnabled,
      setupStatus: setupStatusState,
      touchChat,
      updateChatTitle,
      viewer: viewerState,
    }),
    [
      activeChatId,
      chatPanelOpen,
      desktopSidebarOpen,
      enabledConnections,
      removeChat,
      requestSignIn,
      setChatPanelOpenPersisted,
      setConnectionEnabled,
      setupStatusState,
      touchChat,
      updateChatTitle,
      viewerState,
    ],
  );

  const sidebarProps = {
    activeChatId,
    chats: history,
    hasMoreChats: Boolean(nextCursor),
    isLoadingMore: loadingMore,
    onDeleteChat: handleDeleteChat,
    onLoadMoreChats: loadMoreChats,
    onNavigate: handleSidebarNavigate,
    onNewChat: startNewChat,
    onSignIn: () => requestSignIn(),
    setupStatus: setupStatusState,
    viewer: viewerState,
  };

  return (
    <ChatShellProvider value={contextValue}>
      <SidebarCookieScript />
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <div
          data-desktop-sidebar
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out md:block",
            desktopSidebarOpen ? "w-64" : "w-0",
          )}
        >
          <Suspense fallback={null}>
            <DesktopSidebar
              {...sidebarProps}
              onToggleSidebar={() => setDesktopSidebarOpenPersisted(false)}
            />
          </Suspense>
        </div>

        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-2 py-2 md:px-3">
            <div className="pointer-events-auto flex items-center gap-1">
              <Button
                aria-label="Open sidebar"
                className="md:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <MenuIcon className="size-4" />
              </Button>
              {!desktopSidebarOpen ? (
                <Button
                  aria-label="Open sidebar"
                  className="hidden md:inline-flex"
                  onClick={() => setDesktopSidebarOpenPersisted(true)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <PanelLeftIcon className="size-4" />
                </Button>
              ) : null}
            </div>
            <div className="pointer-events-auto mt-1 flex min-w-0 items-center justify-end gap-1.5">
              <Button
                aria-label={chatPanelOpen ? "Hide chat panel" : "Show chat panel"}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setChatPanelOpenPersisted(!chatPanelOpen)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <PanelRightIcon className="size-4" />
              </Button>
            </div>
          </header>

          <Suspense fallback={null}>
            <CrmStage />
          </Suspense>
        </section>

        <div
          data-desktop-chat-panel
          className={cn(
            "hidden shrink-0 overflow-hidden border-l border-border bg-card/30 transition-[width] duration-200 ease-in-out md:block",
            chatPanelOpen ? "w-[clamp(20rem,28vw,32rem)]" : "w-0",
          )}
        >
          <div className="flex h-full w-[clamp(20rem,28vw,32rem)] flex-col">
            <ChatPanelHeader />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </div>

        {chatPanelOpen ? (
          <div
            className="flex w-full shrink-0 flex-col border-t border-border bg-card md:hidden"
            data-mobile-chat-panel
          >
            <ChatPanelHeader />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        ) : (
          <Button
            aria-label="Show chat panel"
            className="fixed bottom-4 right-4 z-30 md:hidden"
            onClick={() => setChatPanelOpenPersisted(true)}
            size="icon"
            type="button"
          >
            <SparklesIcon className="size-4" />
          </Button>
        )}

        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
            mobileSidebarOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileSidebarOpen(false)}
        />
        {mobileSidebarOpen ? (
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Suspense fallback={null}>
              <MobileSidebar
                {...sidebarProps}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </Suspense>
          </div>
        ) : null}

        <SignInModal
          callbackPath={signInCallbackPath}
          disabled={!setupReady}
          onBeforeSignIn={() => {
            if (draftBeforeSignIn) {
              window.sessionStorage.setItem("eve-chat-draft", draftBeforeSignIn);
            }
          }}
          onOpenChange={setAuthDialogOpen}
          open={authDialogOpen}
        />
      </div>
    </ChatShellProvider>
  );
}

type SidebarSharedProps = {
  readonly activeChatId: string | null;
  readonly chats: readonly ChatListItem[];
  readonly hasMoreChats: boolean;
  readonly isLoadingMore: boolean;
  readonly onDeleteChat: (chatId: string) => void | Promise<void>;
  readonly onLoadMoreChats?: () => void | Promise<void>;
  readonly onNavigate?: (chatId?: string | null) => void;
  readonly onNewChat: () => void;
  readonly onSignIn?: () => void;
  readonly setupStatus: SetupStatus;
  readonly viewer: Viewer | null;
};

function useCrmView() {
  const [crmView, setCrmViewUrl] = useQueryState(CRM_VIEW_PARAM, crmViewParser);
  const [, setQuoteIdUrl] = useQueryState(QUOTE_ID_PARAM, quoteIdParser);

  const setCrmView = useCallback(
    (view: typeof crmView) => {
      setCrmViewUrl(view);

      if (view !== "quotes") {
        setQuoteIdUrl(null);
      }
    },
    [setCrmViewUrl, setQuoteIdUrl],
  );

  return { crmView, setCrmView };
}

function DesktopSidebar({
  onToggleSidebar,
  ...props
}: SidebarSharedProps & {
  readonly onToggleSidebar: () => void;
}) {
  const { crmView, setCrmView } = useCrmView();

  return (
    <CrmNavSidebar
      {...props}
      activeCrmView={crmView}
      onSelectView={setCrmView}
      onToggleSidebar={onToggleSidebar}
    />
  );
}

function MobileSidebar({
  onClose,
  ...props
}: SidebarSharedProps & {
  readonly onClose: () => void;
}) {
  const { crmView, setCrmView } = useCrmView();

  return (
    <CrmNavSidebar
      {...props}
      activeCrmView={crmView}
      className="w-[84vw] max-w-80"
      onSelectView={(view) => {
        setCrmView(view);
        onClose();
      }}
    />
  );
}

function CrmStage() {
  const { crmView } = useCrmView();

  return <CrmView view={crmView} />;
}

function ChatPanelHeader() {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SparklesIcon className="size-4 text-muted-foreground" />
        eve Copilot
      </div>
      <Suspense fallback={null}>
        <ChatRouteShareButton compact />
      </Suspense>
    </div>
  );
}

function SidebarCookieScript() {
  const source = `try{var match=document.cookie.match(/(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)/);var value=match?decodeURIComponent(match[1]):"";if(value==="closed"){document.documentElement.dataset.eveChatSidebar="closed";}}catch{}`;

  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}

function ChatRouteShareButton({ compact = false }: { readonly compact?: boolean }) {
  const pathname = usePathname();

  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  return <ShareChatButton compact={compact} />;
}

function ShareChatButton({ compact }: { readonly compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  const clearCopyResetTimer = useCallback(() => {
    if (copyResetTimerRef.current === null) {
      return;
    }

    window.clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = null;
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      clearCopyResetTimer();
      setCopied(true);
      copyResetTimerRef.current = window.setTimeout(() => {
        copyResetTimerRef.current = null;
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }, [clearCopyResetTimer]);

  useEffect(() => clearCopyResetTimer, [clearCopyResetTimer]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={copied ? "Copied chat link" : "Copy chat link"}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            compact ? undefined : "mt-1",
          )}
          onClick={handleCopyLink}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <UploadIcon className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{copied ? "Copied" : "Copy link"}</TooltipContent>
    </Tooltip>
  );
}

function mergeChatHistory(
  incoming: readonly ChatListItem[],
  current: readonly ChatListItem[],
) {
  const incomingById = new Map(incoming.map((item) => [item.id, item]));
  const currentIds = new Set(current.map((item) => item.id));
  const freshIncoming = incoming.filter((item) => !currentIds.has(item.id));

  return [...freshIncoming, ...current.map((item) => incomingById.get(item.id) ?? item)];
}