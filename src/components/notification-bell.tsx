"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/app/(dashboard)/actions/notifications";

const ICONS: Record<string, string> = {
  message: "💬",
  collaboration: "🤝",
  payment: "💰",
  system: "🔔",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const { notifications, unread } = await getNotifications();
    setItems(notifications);
    setUnread(unread);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channelId = `notifications:${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleRead = (n: AppNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
    startTransition(() => {
      void markNotificationRead(n.id);
    });
  };

  const handleReadAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    setUnread(0);
    startTransition(() => {
      void markAllNotificationsRead();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
        aria-expanded={open}
        className="relative w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-[11px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-bold text-sm text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={handleReadAll} className="text-xs text-primary hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-white/40">Aucune notification.</p>
            )}
            {items.map((n) => {
              const content = (
                <div className={`flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${n.is_read ? "opacity-60" : ""}`}>
                  <span aria-hidden className="text-lg leading-none">{ICONS[n.type] ?? ICONS.system}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-white/60 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-white/35 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => handleRead(n)} className="block border-b border-white/5 last:border-0">
                  {content}
                </Link>
              ) : (
                <button key={n.id} onClick={() => handleRead(n)} className="block w-full text-left border-b border-white/5 last:border-0">
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
