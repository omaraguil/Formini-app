export interface Comment {
    id?: number;
    userId: number;
    content: string;
    createdAt?: string;
}

export interface CommentRequest {
    userId: number;
    content: string;
}

export interface CommentResponse extends Comment { }
