export enum ReactionType {
    LIKE = 'LIKE',
    DISLIKE = 'DISLIKE'
}

export interface ReactionRequest {
    userId: number;
    type: ReactionType;
}

export interface ReactionCountResponse {
    likeCount: number;
    dislikeCount: number;
    postId?: number;
}
