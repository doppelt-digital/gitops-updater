/// Docker Compose Configuration
export interface DockerComposeConfiguration {
    readonly server: DockerComposeServer[];
}

export interface DockerComposeServer {
    readonly id: string;
    readonly username: string;
    readonly password: string | null;
    readonly port: number;
    readonly ssh_private_key: string | null;
    readonly address: string;
}