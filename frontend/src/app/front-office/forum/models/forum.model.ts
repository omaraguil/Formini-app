export interface Forum {
    id?: number;
    userId: number;
    formationId: number;
    title: string;
    content: string;
    createdAt?: string; // LocalDateTime from Spring
}

export interface PostRequest {
    userId: number;
    formationId: number;
    title: string;
    content: string;
}

export interface PostResponse extends Forum { }
