"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications-api";
import type { Notification } from "@/lib/notifications-api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyNotifications();
        setNotifications(data);
      } catch (err: unknown) {
        const message =
          (
            err as {
              response?: {
                data?: {
                  detail?: string;
                };
              };
            }
          )?.response?.data?.detail || "Unable to load notifications.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      setMarkingId(notificationId);

      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch {
      setError("Unable to mark notification as read.");
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      setError("");

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at ?? new Date().toISOString(),
        })),
      );
    } catch {
      setError("Unable to mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-[#F5F3ED]">
      <div className="magizh-container">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Student Dashboard
            </p>

            <h1 className="magizh-heading text-4xl font-bold md:text-5xl">
              Notifications
            </h1>

            <p className="mt-3 text-[#A1A1A1]">
              Stay updated with your registrations, teams, submissions, and
              events.
            </p>
          </div>

          {!loading && notifications.length > 0 && unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="gap-2"
            >
              {markingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </>
              )}
            </Button>
          )}
        </div>

        {!loading && !error && notifications.length > 0 && (
          <div className="mb-6 flex items-center gap-2 text-sm text-[#A1A1A1]">
            <Bell className="h-4 w-4 text-[#D4AF37]" />
            {unreadCount} unread notification
            {unreadCount !== 1 ? "s" : ""}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-[#A1A1A1]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading notifications...
          </div>
        )}

        {!loading && error && (
          <Card className="p-6">
            <p className="text-[#C75C5C]">{error}</p>
          </Card>
        )}

        {!loading && !error && notifications.length === 0 && (
          <Card className="p-10 text-center">
            <Bell className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" />

            <h2 className="magizh-heading text-2xl font-bold">
              No notifications
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[#A1A1A1]">
              You&apos;re all caught up. New updates will appear here.
            </p>
          </Card>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const unread = !notification.is_read;

              return (
                <Card
                  key={notification.id}
                  className={`p-5 transition-colors ${
                    unread
                      ? "border-[#D4AF37]/40 bg-[#0D0D0F]"
                      : "opacity-80"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                        unread
                          ? "border-[#D4AF37]/40 bg-[#D4AF37]/10"
                          : "border-[#252525]"
                      }`}
                    >
                      <Bell
                        className={`h-4 w-4 ${
                          unread ? "text-[#D4AF37]" : "text-[#A1A1A1]"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-[#F5F3ED]">
                              {notification.title}
                            </h2>

                            {unread && (
                              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                            )}
                          </div>

                          {notification.type && (
                            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-[#A1A1A1]">
                              {notification.type}
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-xs text-[#A1A1A1]">
                          {new Date(
                            notification.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#A1A1A1]">
                        {notification.message}
                      </p>

                      {unread && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markingId === notification.id}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] transition-colors hover:text-[#E5C04A] disabled:opacity-50"
                        >
                          {markingId === notification.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Mark as read
                            </>
                          )}
                        </button>
                      )}

                      {!unread && notification.read_at && (
                        <p className="mt-4 text-xs text-[#666666]">
                          Read{" "}
                          {new Date(
                            notification.read_at,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}