import {GitCredentials, GitopsRepository} from "./configuration_file/gitops_configuration";
import {DockerComposeServer} from "./configuration_file/docker_compose_configuration";
import {Project, ProjectEnvironment} from "./configuration_file/projects";

export interface CurrentConfigurationGit {
    credentials: GitCredentials;
    repository: GitopsRepository;
}

export interface CurrentConfigurationDockerCompose {
    server: DockerComposeServer;
}

export interface CurrentConfiguration {
    project: Project;
    environment: ProjectEnvironment;
    git_configuration: CurrentConfigurationGit | null;
    docker_compose_configuration: CurrentConfigurationDockerCompose | null;
}