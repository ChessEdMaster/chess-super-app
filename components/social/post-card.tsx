'use client';

import React, { useState } from 'react';
import { SocialPost } from '@/types/feed';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface PostCardProps {
    post: SocialPost;
    onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.liked_by_user || false);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const handleLike = async () => {
        if (!user || isLikeLoading) return;
        setIsLikeLoading(true);

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await supabase.from('social_likes').insert({ post_id: post.id, user_id: user.id });
            } else {
                await supabase.from('social_likes').delete().match({ post_id: post.id, user_id: user.id });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const { error } = await supabase.from('social_posts').delete().eq('id', post.id);
            if (error) throw error;
            toast.success('Post deleted');
            onDelete?.(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4 hover:border-zinc-700 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.user_id}`}>
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold overflow-hidden cursor-pointer">
                            {post.profiles?.avatar_url ? (
                                <img src={post.profiles.avatar_url} alt={post.profiles.username} className="w-full h-full object-cover" />
                            ) : (
                                post.profiles?.username?.[0].toUpperCase()
                            )}
                        </div>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.user_id}`}>
                            <p className="text-white font-bold hover:underline cursor-pointer">{post.profiles?.username}</p>
                        </Link>
                        <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                {user?.id === post.user_id && (
                    <button onClick={handleDelete} className="text-zinc-500 hover:text-red-400 p-2">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="mb-3">
                {post.content && <p className="text-zinc-200 text-sm whitespace-pre-wrap mb-3">{post.content}</p>}

                {post.media_url && post.media_type === 'image' && (
                    <div className="rounded-lg overflow-hidden border border-zinc-800">
                        <img src={post.media_url} alt="Post content" className="w-full h-auto max-h-96 object-cover" />
                    </div>
                )}

                {/* Placeholder for Game/Analysis embeds */}
                {post.game_id && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">♟️</div>
                        <div>
                            <p className="text-sm font-bold text-white">Chess Game</p>
                            <p className="text-xs text-zinc-500">View match details</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span>{likesCount}</span>
                </button>

                <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                    <MessageCircle size={18} />
                    <span>{post.comments_count}</span>
                </button>

                <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-green-400 transition-colors">
                    <Share2 size={18} />
                    <span>{post.shares_count}</span>
                </button>
            </div>
        </div>
    );
}
