/// Project Configuration
export interface Project {
    readonly id: string;
    readonly yaml_key: string;
    readonly environments: ProjectEnvironment[];
    readonly gitops_repo_id: string;
    readonly docker_compose_server_id: string;
}

export interface ProjectEnvironment {
    readonly name: string;
    readonly values_file: string;
    readonly secret: SecretReference;
}

export interface SecretReference {
    readonly raw_value: string;
}