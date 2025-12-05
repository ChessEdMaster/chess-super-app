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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const POSTS_PER_PAGE = 10;

    const fetchPosts = useCallback(async (pageIndex: number, isRefresh = false) => {
        if (pageIndex === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            const from = pageIndex * POSTS_PER_PAGE;
            const to = from + POSTS_PER_PAGE - 1;

            let query = supabase
                .from('social_posts')
                .select(`
                    *,
                    profiles!social_posts_user_id_fkey(username, avatar_url)
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }

            // Check likes for current user
            let postsWithLikes = data as SocialPost[];
            if (user && postsWithLikes.length > 0) {
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

            if (isRefresh || pageIndex === 0) {
                setPosts(postsWithLikes);
            } else {
                setPosts(prev => [...prev, ...postsWithLikes]);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userId, user]);

    useEffect(() => {
        fetchPosts(0);
    }, [fetchPosts]);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    };

    const handlePostCreated = (newPost?: SocialPost) => {
        if (newPost) {
            setPosts(prev => [newPost, ...prev]);
        } else {
            // Fallback if no post object returned
            fetchPosts(0, true);
        }
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
        <div className="max-w-2xl mx-auto pb-8">
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

            {hasMore && posts.length > 0 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="text-sm text-zinc-400 hover:text-white font-medium disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Loading...
                            </span>
                        ) : (
                            'Load More Posts'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
