'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Users,
    Calendar,
    MessageSquare,
    Heart,
    Send,
    Plus,
    Crown,
    Shield,
    UserPlus,
    Loader2,
    ArrowLeft,
    Globe,
    Lock,
    Settings,
    LogOut,
    Pin
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    banner_url: string | null;
    owner_id: string;
    is_public: boolean;
    member_count: number;
    created_at: string;
    owner?: {
        username?: string;
        avatar_url?: string;
    };
}

interface ClubMember {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profile?: {
        username?: string;
        avatar_url?: string;
    };
}

interface ClubPost {
    id: string;
    title: string | null;
    content: string;
    pgn_data: string | null;
    image_url: string | null;
    author_id: string;
    likes_count: number;
    comments_count: number;
    is_pinned: boolean;
    created_at: string;
    author?: {
        username?: string;
        avatar_url?: string;
    };
    is_liked?: boolean;
}

interface ClubEvent {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    start_date: string;
    end_date: string | null;
    location: string | null;
    max_participants: number | null;
    participants_count: number;
    organizer_id: string;
}

export default function ClubDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [posts, setPosts] = useState<ClubPost[]>([]);
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'events'>('posts');
    const [newPostContent, setNewPostContent] = useState('');
    const [creatingPost, setCreatingPost] = useState(false);

    // Event creation state
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventLocation, setNewEventLocation] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && slug) {
            loadClubData();
        }
    }, [user, slug]);

    const loadClubData = async () => {
        try {
            // Carregar club
            const { data: clubData, error: clubError } = await supabase
                .from('clubs')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (clubError) throw clubError;
            if (!clubData) {
                router.push('/clubs');
                return;
            }

            // Carregar propietari
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', clubData.owner_id)
                .single();

            setClub({
                ...clubData,
                owner: ownerProfile || undefined
            });

            // Carregar membres


            const { data: membersData, error: membersError } = await supabase
                .from('club_members')
                .select('*, profile:profiles(username, avatar_url)')
                .eq('club_id', clubData.id)
                .order('role', { ascending: false })
                .order('joined_at', { ascending: true });

            if (membersError) {
                console.warn('Error loading members (join might have failed):', membersError);
                // Fallback: carregar sense perfil si falla el join
                if (!membersData) {
                    const { data: rawMembers } = await supabase
                        .from('club_members')
                        .select('*')
                        .eq('club_id', clubData.id);
                    setMembers(rawMembers as any || []);
                }
            } else {
                setMembers(membersData || []);
            }

            // Comprovar si l'usuari és membre
            if (user) {
                const userMembership = membersData?.find(m => m.user_id === user.id);
                setIsMember(!!userMembership);
                setUserRole(userMembership?.role || null);

                if (userMembership) {
                    // Carregar posts només si és membre
                    loadPosts(clubData.id);
                    loadEvents(clubData.id);
                }
            }
        } catch (error) {
            console.error('Error loading club:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPosts = async (clubId: string) => {
        try {
            const { data: postsData } = await supabase
                .from('club_posts')
                .select('*, author:profiles(username, avatar_url)')
                .eq('club_id', clubId)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20);

            if (postsData && user) {
                const postIds = postsData.map(p => p.id);
                const { data: likes } = await supabase
                    .from('club_post_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', postIds);

                const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
                const postsWithLikes = postsData.map(post => ({
                    ...post,
                    is_liked: likedPostIds.has(post.id)
                }));

                setPosts(postsWithLikes);
            } else {
                setPosts(postsData || []);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    const loadEvents = async (clubId: string) => {
        try {
            const { data: eventsData } = await supabase
                .from('club_events')
                .select('*')
                .eq('club_id', clubId)
                .eq('is_active', true)
                .gte('start_date', new Date().toISOString())
                .order('start_date', { ascending: true })
                .limit(10);

            setEvents(eventsData || []);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const createEvent = async () => {
        if (!user || !club || !newEventTitle.trim() || !newEventDate) return;

        setCreatingEvent(true);
        try {
            const { error } = await supabase
                .from('club_events')
                .insert({
                    club_id: club.id,
                    organizer_id: user.id,
                    title: newEventTitle.trim(),
                    description: newEventDescription.trim() || null,
                    start_date: new Date(newEventDate).toISOString(),
                    location: newEventLocation.trim() || 'Online',
                    event_type: 'tournament', // Default type
                    is_active: true,
                    participants_count: 0
                });

            if (error) throw error;

            setNewEventTitle('');
            setNewEventDescription('');
            setNewEventDate('');
            setNewEventLocation('');
            loadEvents(club.id);
            alert('Event creat correctament!');
        } catch (error: any) {
            console.error('Error creating event:', error);
            alert(error.message || 'Error al crear l\'event');
        } finally {
            setCreatingEvent(false);
        }
    };

    const joinClub = async () => {
        if (!user || !club) return;

        try {
            const { error } = await supabase
                .from('club_members')
                .insert({
                    club_id: club.id,
                    user_id: user.id,
                    role: 'member'
                });

            if (error) throw error;
            setIsMember(true);
            setUserRole('member');
            loadClubData();
        } catch (error: any) {
            console.error('Error joining club:', error);
            // Si l'error és de clau duplicada, vol dir que ja és membre.
            // Ho tractem com un èxit i recarreguem.
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                setIsMember(true);
                loadClubData();
                return;
            }
            alert(error.message || 'Error al unir-se al club');
        }
    };

    const leaveClub = async () => {
        if (!user || !club) return;

        if (!confirm('Estàs segur que vols sortir del club?')) return;

        try {
            const { error } = await supabase
                .from('club_members')
                .delete()
                .eq('club_id', club.id)
                .eq('user_id', user.id);

            if (error) throw error;
            setIsMember(false);
            setUserRole(null);
            setPosts([]);
            setEvents([]);
            loadClubData();
        } catch (error: any) {
            console.error('Error leaving club:', error);
            alert(error.message || 'Error al sortir del club');
        }
    };

    const createPost = async () => {
        if (!user || !club || !newPostContent.trim()) return;

        setCreatingPost(true);
        try {
            const { error } = await supabase
                .from('club_posts')
                .insert({
                    club_id: club.id,
                    author_id: user.id,
                    content: newPostContent.trim()
                });

            if (error) throw error;
            setNewPostContent('');
            loadPosts(club.id);
            // Optional: Add toast here
        } catch (error: any) {
            console.error('Error creating post:', error);
            alert(error.message || 'Error al crear el post');
        } finally {
            setCreatingPost(false);
        }
    };

    const toggleLike = async (postId: string, isLiked: boolean) => {
        if (!user) return;

        try {
            if (isLiked) {
                await supabase
                    .from('club_post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('club_post_likes')
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });
            }
            if (club) loadPosts(club.id);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Club no trobat</h2>
                    <Link href="/clubs" className="text-purple-400 hover:text-purple-300">
                        Tornar als clubs
                    </Link>
                </div>
            </div>
        );
    }

    const canPost = isMember && (userRole === 'owner' || userRole === 'admin' || userRole === 'moderator' || userRole === 'member');
    const canManage = userRole === 'owner' || userRole === 'admin';

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
            {/* BANNER */}
            {club.banner_url && (
                <div className="w-full h-64 bg-gradient-to-r from-purple-900/50 to-slate-900 relative">
                    <img
                        src={club.banner_url}
                        alt={club.name}
                        className="w-full h-full object-cover opacity-50"
                    />
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* HEADER */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/clubs"
                            className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        {club.image_url ? (
                            <img
                                src={club.image_url}
                                alt={club.name}
                                className="w-20 h-20 rounded-full border-4 border-purple-500/50"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center border-4 border-purple-500/50">
                                <Users className="text-purple-400" size={40} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{club.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <div className="flex items-center gap-1">
                                    {club.is_public ? <Globe size={14} /> : <Lock size={14} />}
                                    <span>{club.is_public ? 'Públic' : 'Privat'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>{club.member_count} membres</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isMember ? (
                            <>
                                {canManage && (
                                    <button
                                        onClick={() => router.push(`/clubs/manage/${club.id}`)}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        <Settings size={18} />
                                        Configuració
                                    </button>
                                )}
                                <button
                                    onClick={leaveClub}
                                    className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg transition border border-red-500/30"
                                >
                                    <LogOut size={18} />
                                    Sortir
                                </button>
                            </>
                        ) : (
                            club.is_public && (
                                <button
                                    onClick={joinClub}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition"
                                >
                                    <UserPlus size={18} />
                                    Unir-se
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* DESCRIPTION */}
                {club.description && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                        <p className="text-slate-300">{club.description}</p>
                    </div>
                )}

                {/* TABS */}
                {isMember && (
                    <div className="flex gap-4 mb-6 border-b border-slate-800">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`px-4 py-2 font-medium transition ${activeTab === 'posts'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <MessageSquare size={18} className="inline mr-2" />
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 font-medium transition ${activeTab === 'members'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Users size={18} className="inline mr-2" />
                            Membres ({members.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 font-medium transition ${activeTab === 'events'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Calendar size={18} className="inline mr-2" />
                            Events ({events.length})
                        </button>
                    </div>
                )}

                {/* CONTENT */}
                {!isMember ? (
                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                        <Lock className="mx-auto text-slate-700 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">
                            {club.is_public ? 'Uniu-vos al club per veure el contingut' : 'Aquest club és privat'}
                        </h3>
                        {club.is_public && (
                            <button
                                onClick={joinClub}
                                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition"
                            >
                                Unir-se al Club
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {activeTab === 'posts' && (
                            <div className="space-y-6">
                                {/* CREATE POST */}
                                {canPost && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                        <textarea
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder="Comparteix alguna cosa amb el club..."
                                            rows={4}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none mb-4"
                                        />
                                        <button
                                            onClick={createPost}
                                            disabled={!newPostContent.trim() || creatingPost}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {creatingPost ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin" size={16} />
                                                    Publicant...
                                                </span>
                                            ) : (
                                                'Publicar'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* POSTS LIST */}
                                {posts.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                                        <MessageSquare className="mx-auto text-slate-700 mb-4" size={64} />
                                        <p className="text-slate-400">Encara no hi ha posts</p>
                                    </div>
                                ) : (
                                    posts.map((post) => (
                                        <div
                                            key={post.id}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                {post.author?.avatar_url ? (
                                                    <img
                                                        src={post.author.avatar_url}
                                                        alt={post.author.username}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                        <Users size={20} className="text-purple-400" />
                                                    </div>
                                                )}
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-white">
                                                            {post.author?.username || 'Usuari'}
                                                        </span>
                                                        {post.is_pinned && (
                                                            <Pin size={14} className="text-purple-400" />
                                                        )}
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(post.created_at).toLocaleDateString('ca-ES')}
                                                        </span>
                                                    </div>
                                                    {post.title && (
                                                        <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                                                    )}
                                                    <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 pt-4 border-t border-slate-800">
                                                <button
                                                    onClick={() => toggleLike(post.id, post.is_liked || false)}
                                                    className={`flex items-center gap-2 transition ${post.is_liked
                                                        ? 'text-red-400'
                                                        : 'text-slate-400 hover:text-red-400'
                                                        }`}
                                                >
                                                    <Heart
                                                        size={18}
                                                        className={post.is_liked ? 'fill-current' : ''}
                                                    />
                                                    <span>{post.likes_count}</span>
                                                </button>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <MessageSquare size={18} />
                                                    <span>{post.comments_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
                                    >
                                        {member.profile?.avatar_url ? (
                                            <img
                                                src={member.profile.avatar_url}
                                                alt={member.profile.username}
                                                className="w-12 h-12 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                <Users size={24} className="text-purple-400" />
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <div className="font-bold text-white">
                                                {member.profile?.username || 'Usuari'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                {member.role === 'owner' && <Crown size={12} />}
                                                {member.role === 'admin' && <Shield size={12} />}
                                                {member.role === 'moderator' && <Shield size={12} />}
                                                <span className="capitalize">{member.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="space-y-4">
                                {canManage && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Crear Nou Event</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Títol</label>
                                                <input
                                                    type="text"
                                                    value={newEventTitle}
                                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                                    placeholder="Títol de l'event"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Data i Hora</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newEventDate}
                                                    onChange={(e) => setNewEventDate(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Ubicació</label>
                                                <input
                                                    type="text"
                                                    value={newEventLocation}
                                                    onChange={(e) => setNewEventLocation(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                                    placeholder="Ex: Online, Sala d'Actes..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Descripció</label>
                                                <textarea
                                                    value={newEventDescription}
                                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white resize-none"
                                                    rows={3}
                                                    placeholder="Detalls de l'event..."
                                                />
                                            </div>
                                            <button
                                                onClick={createEvent}
                                                disabled={!newEventTitle || !newEventDate || creatingEvent}
                                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
                                            >
                                                {creatingEvent ? 'Creant...' : 'Crear Event'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {events.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                                        <Calendar className="mx-auto text-slate-700 mb-4" size={64} />
                                        <p className="text-slate-400">No hi ha events programats</p>
                                    </div>
                                ) : (
                                    events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                                        >
                                            <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                            {event.description && (
                                                <p className="text-slate-300 mb-4">{event.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {new Date(event.start_date).toLocaleDateString('ca-ES', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1">
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    <span>
                                                        {event.participants_count}
                                                        {event.max_participants && ` / ${event.max_participants}`}{' '}
                                                        participants
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

