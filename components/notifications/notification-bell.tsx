'use client';

import React, { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Bell, Heart, MessageCircle, Users, Calendar, Trash2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like':
                return <Heart size={16} className="text-red-500" />;
            case 'comment':
                return <MessageCircle size={16} className="text-blue-500" />;
            case 'friend_request':
                return <Users size={16} className="text-green-500" />;
            case 'message':
                return <MessageCircle size={16} className="text-purple-500" />;
            case 'event':
            case 'event_reminder':
                return <Calendar size={16} className="text-yellow-500" />;
            default:
                return <Bell size={16} className="text-gray-500" />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.related_url) {
            router.push(notification.related_url);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-zinc-800 rounded-full transition"
            >
                <Bell size={20} className="text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-[500px] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h3 className="text-white font-bold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                    <Bell size={48} className="mb-3 opacity-50" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-zinc-800 transition cursor-pointer group ${!notification.is_read ? 'bg-zinc-800/50' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-zinc-600 text-xs mt-1">
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true
                                                        })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition"
                                                >
                                                    <Trash2 size={14} className="text-zinc-500" />
                                                </button>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
