'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { SocialComment } from '@/types/feed';
import { Loader2, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CommentSectionProps {
    postId: string;
    onCommentCountChange?: (count: number) => void;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<SocialComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('social_comments')
                .select(`
                    *,
                    profiles!social_comments_user_id_fkey(username, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setComments(data || []);
            onCommentCountChange?.(data?.length || 0);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('social_comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: newComment.trim()
                });

            if (error) throw error;

            setNewComment('');
            await loadComments();
            toast.success('Comment added');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            const { error } = await supabase
                .from('social_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            setComments(prev => prev.filter(c => c.id !== commentId));
            onCommentCountChange?.(comments.length - 1);
            toast.success('Comment deleted');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-zinc-500" size={20} />
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-3 border-t border-zinc-800">
            {/* Comment Input */}
            {user && (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400 font-bold shrink-0">
                        {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-center text-zinc-600 text-sm py-2">No comments yet. Be the first!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                            <Link href={`/profile/${comment.user_id}`}>
                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400 font-bold overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-zinc-700">
                                    {comment.profiles?.avatar_url ? (
                                        <img src={comment.profiles.avatar_url} alt={comment.profiles.username} className="w-full h-full object-cover" />
                                    ) : (
                                        comment.profiles?.username?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1">
                                <div className="bg-zinc-900 rounded-lg px-3 py-2">
                                    <Link href={`/profile/${comment.user_id}`}>
                                        <p className="text-xs font-bold text-white hover:underline cursor-pointer">
                                            {comment.profiles?.username || 'User'}
                                        </p>
                                    </Link>
                                    <p className="text-sm text-zinc-300">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 px-3">
                                    <span className="text-xs text-zinc-600">
                                        {new Date(comment.created_at).toLocaleDateString('en', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    {user?.id === comment.user_id && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-xs text-zinc-600 hover:text-red-400 transition"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
