import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Friend, FriendRequest, SocialProfile, UserSocialSettings } from '@/types/social';
import { toast } from 'sonner';

export function useSocial() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [searchResults, setSearchResults] = useState<SocialProfile[]>([]);
    const [socialSettings, setSocialSettings] = useState<UserSocialSettings | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchFriends = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('friends')
            .select(`
                *,
                friend:friend_id(username, avatar_url)
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching friends:', error);
        } else {
            setFriends(data as any || []);
        }
    }, [user]);

    const fetchRequests = useCallback(async () => {
        if (!user) return;

        // Incoming requests
        const { data: incoming, error: incomingError } = await supabase
            .from('friend_requests')
            .select(`
                *,
                sender:profiles!fk_friend_requests_sender_profile(username, avatar_url)
            `)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

        if (incomingError) console.error('Error fetching incoming requests:', incomingError);
        else setPendingRequests(incoming as any || []);

        // Sent requests
        const { data: sent, error: sentError } = await supabase
            .from('friend_requests')
            .select(`
                *,
                receiver:profiles!fk_friend_requests_receiver_profile(username, avatar_url)
            `)
            .eq('sender_id', user.id);

        if (sentError) console.error('Error fetching sent requests:', sentError);
        else setSentRequests(sent as any || []);
    }, [user]);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('user_social_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching settings:', error);
        } else if (data) {
            setSocialSettings(data);
        } else {
            // Create default settings if not exist
            const { data: newData, error: createError } = await supabase
                .from('user_social_settings')
                .insert([{ user_id: user.id }])
                .select()
                .single();

            if (!createError && newData) {
                setSocialSettings(newData);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchFriends();
            fetchRequests();
            fetchSettings();
        }
    }, [user, fetchFriends, fetchRequests, fetchSettings]);

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(10);

        if (error) {
            console.error('Error searching users:', error);
            toast.error('Error searching users');
        } else {
            // Filter out self and existing friends/requests could be done here or in UI
            setSearchResults(data as SocialProfile[] || []);
        }
        setLoading(false);
    };

    const sendFriendRequest = async (targetUserId: string) => {
        if (!user) return;

        // Check if already friends
        if (friends.some(f => f.friend_id === targetUserId)) {
            toast.error('Already friends!');
            return;
        }

        // Check if request already sent
        if (sentRequests.some(r => r.receiver_id === targetUserId && r.status === 'pending')) {
            toast.error('Request already sent!');
            return;
        }

        const { error } = await supabase
            .from('friend_requests')
            .insert([{ sender_id: user.id, receiver_id: targetUserId }]);

        if (error) {
            console.error('Error sending request:', error);
            toast.error('Failed to send request');
        } else {
            toast.success('Friend request sent!');
            fetchRequests();
        }
    };

    const acceptRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) {
            console.error('Error accepting request:', error);
            toast.error('Failed to accept request');
        } else {
            toast.success('Friend request accepted!');
            fetchRequests();
            fetchFriends();
        }
    };

    const rejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        } else {
            toast.success('Request rejected');
            fetchRequests();
        }
    };

    const updateSettings = async (newSettings: Partial<UserSocialSettings>) => {
        if (!user) return;
        const { error } = await supabase
            .from('user_social_settings')
            .update(newSettings)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } else {
            toast.success('Settings updated');
            fetchSettings();
        }
    };

    return {
        friends,
        pendingRequests,
        sentRequests,
        searchResults,
        socialSettings,
        loading,
        searchUsers,
        sendFriendRequest,
        acceptRequest,
        rejectRequest,
        updateSettings,
        refresh: () => {
            fetchFriends();
            fetchRequests();
            fetchSettings();
        }
    };
}
