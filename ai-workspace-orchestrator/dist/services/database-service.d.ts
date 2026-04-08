export interface User {
    id: string;
    name: string;
    email: string;
    posts?: Post[];
}
export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: Date;
}
export declare class DatabaseService {
    private users;
    private posts;
    getAllUsersWithPosts(): Promise<User[]>;
    getPostsByUserId(userId: string): Promise<Post[]>;
    searchPosts(query: string): Promise<Post[]>;
    getUserById(id: string): Promise<User | null>;
    getAllUsersWithPostsOptimized(): Promise<User[]>;
}
export declare const dbService: DatabaseService;
//# sourceMappingURL=database-service.d.ts.map