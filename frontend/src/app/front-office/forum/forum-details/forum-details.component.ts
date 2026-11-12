import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Forum } from '../models/forum.model';
import { ForumService } from '../services/forum.service';
import { CommentResponse } from '../models/comment.model';
import { ReactionCountResponse, ReactionType } from '../models/reaction.model';

@Component({
    selector: 'app-forum-details',
    templateUrl: './forum-details.component.html',
    styleUrls: ['./forum-details.component.scss']
})
export class ForumDetailsComponent implements OnInit {
    forum: Forum | undefined;
    comments: CommentResponse[] = [];
    reactionCounts: ReactionCountResponse = { likeCount: 0, dislikeCount: 0 };
    loading = true;
    forumId: number | null = null;
    newComment = '';
    submittingComment = false;
    ReactionType = ReactionType;
    isReacting = false;
    currentReactionType: ReactionType | null = null;

    userMappings: { [key: number]: { name: string, avatar: string } } = {
        10: { name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=12' },
        1: { name: 'Admin', avatar: 'https://i.pravatar.cc/150?img=32' },
        2: { name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=45' }
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private forumService: ForumService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.forumId = +params['id'];
            this.loadForum();
        });
    }

    loadForum(): void {
        if (this.forumId) {
            this.loading = true;
            this.forumService.getForumById(this.forumId).subscribe({
                next: (forum) => {
                    this.forum = forum;
                    this.loadComments();
                    this.loadReactions();
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading forum:', error);
                    this.loading = false;
                }
            });
        }
    }

    loadComments(): void {
        if (this.forumId) {
            this.forumService.getComments(this.forumId).subscribe({
                next: (comments) => this.comments = comments,
                error: (err) => console.error('Error loading comments:', err)
            });
        }
    }

    loadReactions(): void {
        if (this.forumId) {
            this.forumService.getReactionCounts(this.forumId).subscribe({
                next: (counts) => this.reactionCounts = counts,
                error: (err) => console.error('Error loading reactions:', err)
            });
        }
    }

    onReact(type: ReactionType): void {
        if (!this.forumId) return;

        // Optimistic Update
        const previousCounts = { ...this.reactionCounts };

        if (type === ReactionType.LIKE) {
            this.reactionCounts.likeCount++;
        } else {
            this.reactionCounts.dislikeCount++;
        }

        this.isReacting = true;
        this.currentReactionType = type;

        this.forumService.reactToPost(this.forumId, { userId: 10, type }).subscribe({
            next: () => {
                setTimeout(() => this.isReacting = false, 600);
                this.loadReactions(); // Final sync
            },
            error: (err) => {
                console.error('Error reacting:', err);
                this.reactionCounts = previousCounts;
                this.isReacting = false;
                this.currentReactionType = null;
            }
        });
    }

    addComment(): void {
        if (this.forumId && this.newComment.trim()) {
            this.submittingComment = true;
            this.forumService.addComment(this.forumId, {
                userId: 10, // Mock current user
                content: this.newComment
            }).subscribe({
                next: (comment) => {
                    this.comments.push(comment);
                    this.newComment = '';
                    this.submittingComment = false;
                },
                error: (err) => {
                    console.error('Error adding comment:', err);
                    this.submittingComment = false;
                }
            });
        }
    }

    getAuthorInfo(userId: number) {
        return this.userMappings[userId] || { name: `User ${userId}`, avatar: `https://i.pravatar.cc/150?u=${userId}` };
    }

    goBack(): void {
        this.router.navigate(['/forum']);
    }

    editForum(): void {
        if (this.forumId) {
            this.router.navigate(['/forum', this.forumId, 'edit']);
        }
    }

    deleteForum(): void {
        if (this.forumId && confirm('Are you sure you want to delete this forum?')) {
            this.forumService.deleteForum(this.forumId).subscribe({
                next: () => {
                    this.router.navigate(['/forum']);
                },
                error: (error) => {
                    console.error('Error deleting forum:', error);
                }
            });
        }
    }

    formatDate(date: any): string {
        if (!date) return 'Just now';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
