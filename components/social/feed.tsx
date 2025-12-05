'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { SocialPost } from '@/types/feed';
import { PostCard } from './post-card';
import { CreatePost } from './create-post';
import { Loader2 } from 'lucide-react';

interface FeedProps {
    userId?: string; // If provided, shows only posts from this user (Profile Wall)
}

export function Feed({ userId }: FeedProps) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('social_posts')
                .select(`
                    *,
                    profiles!social_posts_user_id_fkey(username, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Check likes for current user
            let postsWithLikes = data as SocialPost[];
            if (user) {
                const { data: likes } = await supabase
                    .from('social_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', postsWithLikes.map(p => p.id));

                const likedPostIds = new Set(likes?.map(l => l.post_id));
                postsWithLikes = postsWithLikes.map(p => ({
                    ...p,
                    liked_by_user: likedPostIds.has(p.id)
                }));
            }

            setPosts(postsWithLikes);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, user]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostCreated = () => {
        fetchPosts();
    };

    const handlePostDeleted = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    if (loading && posts.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {!userId && <CreatePost onPostCreated={handlePostCreated} />}

            {posts.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                    <p>No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                    ))}
                </div>
            )}
        </div>
    );
}
