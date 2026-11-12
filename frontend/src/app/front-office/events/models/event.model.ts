export interface Event {
    id?: number;
    name: string;
    description: string;
    details: string;
    location: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    date: Date;
    attendees: number;
    category: string;
    createdAt: Date;
    updatedAt?: Date;
    forumTopicId?: number;
}
