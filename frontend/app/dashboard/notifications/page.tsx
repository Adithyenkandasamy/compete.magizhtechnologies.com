"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

type Notification = {
  id: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get<Notification[]>(
        "/me/notifications",
      );

      setNotifications(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(notificationId: string) {
    try {
      await apiClient.post(
        `/me/notifications/${notificationId}/read`,
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Unable to mark notification as read.");
    }
  }

  async function markAllAsRead() {
    try {
      await apiClient.post("/me/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
    } catch (err) {
      console.error(err);
      setError("Unable to mark all notifications as read.");
    }
  }

  return (
    <main className="magizh-container py-12">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="magizh-gold text-xs font-semibold uppercase tracking-[0.25em]">
            UPDATES
          </p>

          <h1 className="magizh-heading mt-3 text-4xl font-bold md:text-5xl">
            Notifications
          </h1>

          <p className="magizh-muted mt-3 max-w-2xl">
            Stay updated about your events, teams, projects,
            submissions, and certificates.
          </p>
        </div>

        {notifications.some(
          (notification) => !notification.is_read,
        ) && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="magizh-button"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading && (
        <div className="magizh-card p-6">
          <p className="magizh-muted">
            Loading notifications...
          </p>
        </div>
      )}

      {error && (
        <div className="magizh-card border-[#C75C5C] p-6">
          <p className="text-[#C75C5C]">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div className="magizh-card p-8 text-center">
            <p className="magizh-gold text-xs font-semibold uppercase tracking-widest">
              NOTIFICATIONS
            </p>

            <h2 className="magizh-heading mt-3 text-2xl font-bold">
              No notifications
            </h2>

            <p className="magizh-muted mx-auto mt-3 max-w-md">
              You are all caught up. New updates will appear
              here.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`magizh-card p-6 ${
                  !notification.is_read
                    ? "border-[#D4AF37]"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                      )}

                      <h2 className="magizh-heading text-xl font-bold">
                        {notification.title ||
                          "Notification"}
                      </h2>

                      {notification.type && (
                        <span className="border border-[#252525] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest magizh-muted">
                          {notification.type}
                        </span>
                      )}
                    </div>

                    {notification.message && (
                      <p className="magizh-muted mt-3 leading-7">
                        {notification.message}
                      </p>
                    )}

                    <p className="magizh-muted mt-4 text-xs">
                      {new Date(
                        notification.created_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                      className="shrink-0 border border-[#252525] px-4 py-2 text-sm font-semibold transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}