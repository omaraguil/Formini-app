import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Forum } from '../models/forum.model';
import { ReactionType } from '../models/reaction.model';
import { ForumService } from '../services/forum.service';
import { EventService } from '../../events/services/event.service';
import { Event } from '../../events/models/event.model';

interface ForumWithExtras extends Forum {
    likeCount?: number;
    dislikeCount?: number;
    authorName?: string;
    avatarUrl?: string;
    staticImage?: string;
    isReacting?: boolean;
    reactionType?: ReactionType | null;
}

@Component({
    selector: 'app-forum-list',
    templateUrl: './forum-list.component.html',
    styleUrls: ['./forum-list.component.scss']
})
export class ForumListComponent implements OnInit {
    forums: ForumWithExtras[] = [];
    loading = true;
    ReactionType = ReactionType;

    // Map userId to static names/avatars for demonstration
    userMappings: { [key: number]: { name: string, avatar: string } } = {
        10: { name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=12' },
        1: { name: 'Admin', avatar: 'https://i.pravatar.cc/150?img=32' },
        2: { name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=45' }
    };

    // Static images for posts
    staticPostImages = [
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop'
    ];

    // User profile data
    user = {
        name: 'John Doe',
        role: 'Software Engineer',
        avatar: 'https://i.pravatar.cc/150?img=12',
        postsCount: 24,
        connectionsCount: 156
    };

    events: Event[] = [];
    loadingEvents = false;
    eventsError: string | null = null;

    constructor(
        private forumService: ForumService,
        private eventService: EventService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadForums();
        this.loadEvents();
    }

    loadEvents(): void {
        this.loadingEvents = true;
        this.eventsError = null;
        this.eventService.getEvents().subscribe({
            next: (events) => {
                this.events = (events || []).slice(0, 3);
                this.loadingEvents = false;
            },
            error: (err) => {
                console.error('Error loading events:', err);
                this.events = [];
                this.eventsError = 'Failed to load events.';
                this.loadingEvents = false;
            }
        });
    }

    loadForums(): void {
        this.loading = true;
        this.forumService.getForums().subscribe({
            next: (posts) => {
                if (posts.length === 0) {
                    this.forums = [];
                    this.loading = false;
                    return;
                }

                // For each post, fetch reaction counts
                const requests = posts.map(post =>
                    this.forumService.getReactionCounts(post.id!)
                );

                forkJoin(requests).subscribe({
                    next: (counts) => {
                        this.forums = posts.map((post, index) => ({
                            ...post,
                            likeCount: counts[index].likeCount,
                            dislikeCount: counts[index].dislikeCount,
                            authorName: this.userMappings[post.userId]?.name || `User ${post.userId}`,
                            avatarUrl: this.userMappings[post.userId]?.avatar || `https://i.pravatar.cc/150?u=${post.userId}`,
                            staticImage: this.staticPostImages[index % this.staticPostImages.length]
                        }));
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Error fetching reaction counts:', err);
                        // Still show posts even if counts fail
                        this.forums = posts.map((post, index) => ({
                            ...post,
                            authorName: this.userMappings[post.userId]?.name || `User ${post.userId}`,
                            avatarUrl: this.userMappings[post.userId]?.avatar || `https://i.pravatar.cc/150?u=${post.userId}`,
                            staticImage: this.staticPostImages[index % this.staticPostImages.length]
                        }));
                        this.loading = false;
                    }
                });
            },
            error: (error) => {
                console.error('Error loading forums:', error);
                this.loading = false;
            }
        });
    }

    onReact(event: MouseEvent, postId: number, type: ReactionType): void {
        event.stopPropagation();
        const post = this.forums.find(f => f.id === postId);
        if (!post) return;

        // Optimistic Update
        const previousLikes = post.likeCount || 0;
        const previousDislikes = post.dislikeCount || 0;

        // Simple logic: if clicking like, increment like. 
        // Real logic usually handles toggling/switching, but for "live feel" we increment.
        if (type === ReactionType.LIKE) {
            post.likeCount = (post.likeCount || 0) + 1;
        } else {
            post.dislikeCount = (post.dislikeCount || 0) + 1;
        }

        post.isReacting = true;
        post.reactionType = type;

        this.forumService.reactToPost(postId, { userId: 10, type }).subscribe({
            next: () => {
                // Remove animation class after a short delay
                setTimeout(() => post.isReacting = false, 600);

                // Final Sync with server
                this.forumService.getReactionCounts(postId).subscribe(counts => {
                    post.likeCount = counts.likeCount;
                    post.dislikeCount = counts.dislikeCount;
                });
            },
            error: (err) => {
                console.error('Error reacting to post:', err);
                // Revert on error
                post.likeCount = previousLikes;
                post.dislikeCount = previousDislikes;
                post.isReacting = false;
                post.reactionType = null;
            }
        });
    }

    viewForum(id: number | undefined): void {
        if (id) {
            this.router.navigate(['/forum', id]);
        }
    }

    createForum(): void {
        this.router.navigate(['/forum/create']);
    }

    deleteForum(event: MouseEvent, id: number | undefined): void {
        event.stopPropagation();
        if (id && confirm('Are you sure you want to delete this forum?')) {
            this.forumService.deleteForum(id).subscribe({
                next: () => {
                    this.loadForums();
                },
                error: (error) => {
                    console.error('Error deleting forum:', error);
                }
            });
        }
    }

    formatDate(date: any): string {
        const now = new Date();
        const postDate = new Date(date);
        const diffMs = now.getTime() - postDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return postDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    formatEventDate(date: any): { month: string; day: string } {
        const eventDate = new Date(date);
        return {
            month: eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: eventDate.getDate().toString()
        };
    }
}
