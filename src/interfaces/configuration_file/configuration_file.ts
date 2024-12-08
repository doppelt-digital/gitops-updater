import {GitOpsConfiguration} from "./gitops_configuration";
import {DockerComposeConfiguration} from "./docker_compose_configuration";
import {Project} from "./projects";

export interface ConfigurationFile {
    readonly projects: Project[];
    readonly docker_compose_configuration: DockerComposeConfiguration;
    readonly gitops_configuration: GitOpsConfiguration;
}