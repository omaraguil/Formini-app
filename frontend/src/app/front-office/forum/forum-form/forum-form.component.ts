import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Forum, PostRequest, PostResponse } from '../models/forum.model';
import { ForumService } from '../services/forum.service';

@Component({
    selector: 'app-forum-form',
    templateUrl: './forum-form.component.html',
    styleUrls: ['./forum-form.component.scss']
})
export class ForumFormComponent implements OnInit {
    forum: PostRequest = {
        title: '',
        content: '',
        userId: 10, // Mock current user
        formationId: 5 // Mock formation
    };

    isEditMode = false;
    forumId: number | null = null;
    loading = false;
    imagePreview: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private forumService: ForumService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.forumId = +params['id'];
                this.loadForum();
            }
        });
    }

    loadForum(): void {
        if (this.forumId) {
            this.loading = true;
            this.forumService.getForumById(this.forumId).subscribe({
                next: (forum: PostResponse) => {
                    if (forum) {
                        this.forum = forum;
                        // imagePreview handled statically or via other logic if needed
                    }
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading forum:', error);
                    this.loading = false;
                }
            });
        }
    }

    saveForum(): void {
        if (!this.validateForm()) {
            return;
        }

        this.loading = true;

        if (this.isEditMode && this.forumId) {
            // Map strictly for update
            const updatePayload: PostRequest = {
                title: this.forum.title,
                content: this.forum.content,
                userId: this.forum.userId,
                formationId: this.forum.formationId
            };

            this.forumService.updateForum(this.forumId, updatePayload).subscribe({
                next: (response) => {
                    this.router.navigate(['/forum', response.id]);
                },
                error: (error: any) => {
                    console.error('Error updating forum:', error);
                    this.loading = false;
                }
            });
        } else {
            // Map strictly for create
            const createPayload: PostRequest = {
                title: this.forum.title,
                content: this.forum.content,
                userId: this.forum.userId,
                formationId: this.forum.formationId
            };

            this.forumService.createForum(createPayload).subscribe({
                next: (createdForum) => {
                    this.router.navigate(['/forum', createdForum.id]);
                },
                error: (error) => {
                    console.error('Error creating forum:', error);
                    this.loading = false;
                }
            });
        }
    }

    validateForm(): boolean {
        if (!this.forum.title?.trim()) {
            alert('Please enter a title');
            return false;
        }
        if (!this.forum.content?.trim()) {
            alert('Please enter content');
            return false;
        }
        return true;
    }

    cancel(): void {
        if (this.isEditMode && this.forumId) {
            this.router.navigate(['/forum', this.forumId]);
        } else {
            this.router.navigate(['/forum']);
        }
    }

    onImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                // In production, upload to server and get URL
                // Skipping backend mapping as requested
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.imagePreview = null;
    }
}
