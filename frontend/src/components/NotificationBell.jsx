
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load notifications"
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      if (!document.hidden) loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function markAsRead(notification) {
    if (busyId !== null) return;

    setBusyId(notification.id);

    try {
      if (!notification.isRead) {
        await api.patch(
          `/notifications/${notification.id}/read`
        );
      }

      await loadNotifications();

      // Only navigate to routes supported by this application.
      const allowedPaths = [
        "/dashboard",
        "/citizens",
        "/requests",
        "/permits",
        "/finance",
        "/projects",
        "/reports",
        "/users-roles",
        "/settings",
        "/community",
        "/documents"
      ];

      if (allowedPaths.includes(notification.link)) {
        setOpen(false);
        navigate(notification.link);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to update notification"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    if (busyId !== null) return;

    setBusyId("all");

    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to mark notifications as read"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(event, id) {
    event.stopPropagation();

    if (busyId !== null) return;

    setBusyId(id);

    try {
      await api.delete(`/notifications/${id}`);
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to delete notification"
      );
    } finally {
      setBusyId(null);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications(true);
        }}
        className="relative cursor-pointer text-slate-500 hover:text-blue-600"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[380px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <h3 className="font-bold text-[#17365D]">
                Notifications
              </h3>
              <p className="text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={busyId !== null}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell
                  size={28}
                  className="mx-auto mb-3 text-slate-300"
                />
                <p className="text-sm font-medium text-slate-600">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-2 border-b border-slate-100 p-4 ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-blue-50/70"
                  }`}
                >
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => markAsRead(notification)}
                    className="min-w-0 flex-1 text-left disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}

                      <p className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </button>

                  <button
                    type="button"
                    aria-label="Delete notification"
                    title="Delete notification"
                    disabled={busyId !== null}
                    onClick={event =>
                      deleteNotification(event, notification.id)
                    }
                    className="shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
