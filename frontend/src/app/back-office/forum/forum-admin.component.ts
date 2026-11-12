import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ForumService } from '../../front-office/forum/services/forum.service';
import { PostResponse } from '../../front-office/forum/models/forum.model';
import { RibbonsComponent } from '../../front-office/events/ribbons/ribbons.component';

@Component({
    selector: 'app-forum-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, RibbonsComponent],
    templateUrl: './forum-admin.component.html',
    styleUrls: ['./forum-admin.component.scss']
})
export class ForumAdminComponent implements OnInit {
    forums: PostResponse[] = [];
    loading = true;
    stats = {
        totalPosts: 0,
        totalComments: 0,
        newToday: 0
    };

    searchTerm: string = '';

    constructor(
        private forumService: ForumService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadForums();
    }

    loadForums(): void {
        this.loading = true;
        this.forumService.getForums().subscribe({
            next: (data: PostResponse[]) => {
                this.forums = data;
                this.calculateStats();
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Error loading forums for admin:', error);
                this.loading = false;
            }
        });
    }

    calculateStats(): void {
        this.stats.totalPosts = this.forums.length;
        // Mocking comment counts and "new today" for now
        this.stats.totalComments = this.forums.length * 3;
        this.stats.newToday = Math.floor(this.forums.length / 5);
    }

    deletePost(id: number | undefined): void {
        if (id && confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            this.forumService.deleteForum(id).subscribe({
                next: () => {
                    this.forums = this.forums.filter(f => f.id !== id);
                    this.calculateStats();
                },
                error: (error: any) => {
                    console.error('Error deleting post:', error);
                    alert('Failed to delete post. Please try again.');
                }
            });
        }
    }

    viewPost(id: number | undefined): void {
        if (id) {
            this.router.navigate(['/forum', id]);
        }
    }

    editPost(id: number | undefined): void {
        if (id) {
            this.router.navigate(['/forum/edit', id]);
        }
    }

    get filteredForums() {
        return this.forums.filter(f =>
            f.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            f.content.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    formatDate(dateStr: string | undefined): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
