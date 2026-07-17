"use client";

import {
  LayoutDashboardIcon,
  UsersIcon,
  HandshakeIcon,
  SettingsIcon,
  PanelLeftCloseIcon,
  PlusIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { AuthDisplayLoggedOut } from "@/components/auth/auth-display";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import type { ChatListItem, SetupStatus, Viewer } from "@/lib/chat/types";
import { CRM_NAV_ITEMS, type CrmView } from "@/lib/crm/nav";
import { cn } from "@/lib/utils";

const VIEW_ICON: Record<CrmView, typeof LayoutDashboardIcon> = {
  dashboard: LayoutDashboardIcon,
  contacts: UsersIcon,
  deals: HandshakeIcon,
  settings: SettingsIcon,
};

const activeClass =
  "bg-accent/60 text-accent-foreground hover:bg-accent/70";
const inactiveClass =
  "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground";

export function CrmNavSidebar({
  activeCrmView,
  chats,
  activeChatId,
  className,
  hasMoreChats = false,
  isLoadingMore = false,
  onDeleteChat,
  onLoadMoreChats,
  onNavigate,
  onSelectView,
  onNewChat,
  onSignIn,
  onToggleSidebar,
  setupStatus,
  viewer,
}: {
  readonly activeCrmView: CrmView;
  readonly activeChatId: string | null;
  readonly chats: readonly ChatListItem[];
  readonly className?: string;
  readonly hasMoreChats?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onDeleteChat: (chatId: string) => void;
  readonly onLoadMoreChats?: () => void | Promise<void>;
  readonly onNavigate?: (chatId?: string | null) => void;
  readonly onSelectView: (view: CrmView) => void;
  readonly onNewChat: () => void;
  readonly onSignIn?: () => void;
  readonly onToggleSidebar?: () => void;
  readonly setupStatus: SetupStatus;
  readonly viewer: Viewer | null;
}) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-3">
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
          href="/"
          onClick={() => onNavigate?.(null)}
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <MessageSquareIcon className="size-4" />
          </span>
          HotWater CRM
        </Link>
        {onToggleSidebar ? (
          <Button
            aria-label="Close sidebar"
            className="text-muted-foreground/55 hover:text-muted-foreground"
            onClick={onToggleSidebar}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <PanelLeftCloseIcon className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => {
            onNewChat();
            onNavigate?.(null);
          }}
          type="button"
          variant="default"
        >
          <PlusIcon className="size-4" />
          New chat
        </Button>
      </div>

      <nav
        aria-label="CRM sections"
        className="px-2 pb-2"
      >
        <p className="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          {CRM_NAV_ITEMS.map((item) => {
            const Icon = VIEW_ICON[item.id];
            const active = activeCrmView === item.id;
            return (
              <li key={item.id}>
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    active ? activeClass : inactiveClass,
                  )}
                  onClick={() => onSelectView(item.id)}
                  type="button"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-2 flex min-h-0 flex-1 flex-col px-2">
        <p className="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recent chats
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {chats.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground/80">
              No conversations yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {chats.map((chat) => {
                const active = chat.id === activeChatId;
                return (
                  <li key={chat.id} className="group/session relative">
                    <Link
                      className={cn(
                        "flex h-8 min-w-0 items-center rounded-md px-2 pr-8 text-sm transition-colors",
                        active ? activeClass : inactiveClass,
                      )}
                      href={`/chat/${chat.id}`}
                      onClick={() => onNavigate?.(chat.id)}
                    >
                      <span className="block truncate">{chat.title || "New chat"}</span>
                    </Link>
                    <Button
                      aria-label="Delete chat"
                      className={cn(
                        "absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity hover:bg-muted group-hover/session:opacity-100 focus-visible:opacity-100",
                        active ? "data-[state=open]:opacity-100" : "",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        void onDeleteChat(chat.id);
                      }}
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMoreChats ? (
            <button
              className="mt-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => void onLoadMoreChats?.()}
              type="button"
            >
              {isLoadingMore ? "Loading more..." : "Load more"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border px-2 py-3">
        {viewer ? (
          <UserMenu viewer={viewer} />
        ) : (
          <AuthDisplayLoggedOut>
            <Button
              className="w-full justify-between"
              disabled={!setupStatus.appReady}
              onClick={() => onSignIn?.()}
              type="button"
              variant="outline"
            >
              Sign in
            </Button>
          </AuthDisplayLoggedOut>
        )}
      </div>
    </aside>
  );
}