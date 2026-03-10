import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database';

import { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    subscription: RealtimeChannel | null;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    subscribeToNotifications: (userId: string) => void;
    unsubscribeFromNotifications: () => void;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    deleteAllNotifications: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    subscription: null,

    fetchNotifications: async (userId: string) => {
        try {
            set({ isLoading: true });

            const { data, error } = await supabase
                .from('notifications')
                .select('*, cars(id, brand, model, plate_number)') // Join with cars
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const notifications = data as unknown as Notification[];
            const unreadCount = notifications.filter(n => !n.is_read).length;

            set({ notifications, unreadCount, isLoading: false });

            // Automatically subscribe if not already subscribed
            const currentSubscription = get().subscription;
            if (!currentSubscription) {
                get().subscribeToNotifications(userId);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            set({ isLoading: false });
        }
    },

    subscribeToNotifications: (userId: string) => {
        // Unsubscribe from any existing subscription first
        get().unsubscribeFromNotifications();

        console.log('Subscribing to realtime notifications...');
        const subscription = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('Realtime notification received!', payload);
                    // Fetch notifications again to ensure we have joined data (e.g., car details)
                    void get().fetchNotifications(userId);
                }
            )
            .subscribe();

        set({ subscription });
    },

    unsubscribeFromNotifications: () => {
        const { subscription } = get();
        if (subscription) {
            void supabase.removeChannel(subscription);
            set({ subscription: null });
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            const { notifications } = get();
            const updatedNotifications = notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            );

            set({
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.is_read).length
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllAsRead: async (userId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;

            // Update local state
            const { notifications } = get();
            const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));

            set({
                notifications: updatedNotifications,
                unreadCount: 0
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },

    deleteNotification: async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            const { notifications } = get();
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);

            set({
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.is_read).length
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    },

    deleteAllNotifications: async (userId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            set({
                notifications: [],
                unreadCount: 0
            });
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    }
}));
