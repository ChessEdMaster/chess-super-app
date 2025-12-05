'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostProps {
    onPostCreated: (post?: any) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [showImageInput, setShowImageInput] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageUrl) return;
        if (!user) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('social_posts')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    media_url: imageUrl || null,
                    media_type: imageUrl ? 'image' : 'none'
                })
                .select(`
                    *,
                    profiles!social_posts_user_id_fkey(username, avatar_url)
                `)
                .single();

            if (error) throw error;

            setContent('');
            setImageUrl('');
            setShowImageInput(false);
            toast.success('Post created!');
            // @ts-ignore
            onPostCreated(data);
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0 flex items-center justify-center text-zinc-400 font-bold overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            user?.email?.[0].toUpperCase()
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none min-h-[60px]"
                        />

                        {showImageInput && (
                            <div className="mb-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setShowImageInput(false); setImageUrl(''); }}
                                    className="p-2 text-zinc-500 hover:text-red-400"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {imageUrl && (
                            <div className="mb-3 relative rounded-lg overflow-hidden max-h-60 border border-zinc-800">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImageInput(!showImageInput)}
                                    className={`p-2 rounded-full transition-colors ${showImageInput ? 'text-blue-400 bg-blue-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-blue-400'}`}
                                >
                                    <ImageIcon size={20} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!content.trim() && !imageUrl)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
