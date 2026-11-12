import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Forum, PostRequest, PostResponse } from '../models/forum.model';
import { CommentRequest, CommentResponse } from '../models/comment.model';
import { ReactionRequest, ReactionCountResponse } from '../models/reaction.model';

@Injectable({
    providedIn: 'root'
})
export class ForumService {
    private apiUrl = 'http://localhost:8080/api/posts';

    constructor(private http: HttpClient) { }

    // --- Posts ---
    getForums(): Observable<PostResponse[]> {
        return this.http.get<PostResponse[]>(this.apiUrl);
    }

    getForumById(id: number): Observable<PostResponse> {
        return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
    }

    createForum(post: PostRequest): Observable<PostResponse> {
        return this.http.post<PostResponse>(this.apiUrl, post);
    }

    updateForum(id: number, post: PostRequest): Observable<PostResponse> {
        return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, post);
    }

    // --- Comments ---
    getComments(postId: number): Observable<CommentResponse[]> {
        return this.http.get<CommentResponse[]>(`${this.apiUrl}/${postId}/comments`);
    }

    addComment(postId: number, request: CommentRequest): Observable<CommentResponse> {
        return this.http.post<CommentResponse>(`${this.apiUrl}/${postId}/comments`, request);
    }

    // --- Reactions ---
    reactToPost(postId: number, request: ReactionRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${postId}/reactions`, request);
    }

    getReactionCounts(postId: number): Observable<ReactionCountResponse> {
        return this.http.get<ReactionCountResponse>(`${this.apiUrl}/${postId}/reactions/count`);
    }

    // --- Delete ---
    deleteForum(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
