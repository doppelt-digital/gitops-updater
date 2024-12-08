import fs from "fs";
import path from "path";
import {ConfigurationFile} from "../interfaces/configuration_file/configuration_file";
import {Project, ProjectEnvironment, SecretReference} from "../interfaces/configuration_file/projects";
import {ImageTagUpdateRequestDto} from "../interfaces/dto/image_tag_update_request_dto";
import {GitCredentials, GitopsRepository} from "../interfaces/configuration_file/gitops_configuration";
import {CurrentConfiguration, CurrentConfigurationDockerCompose, CurrentConfigurationGit} from "../interfaces/current_configurations";

export class ConfigurationService {
    protected configurationFile: ConfigurationFile;

    constructor(configurationFile: ConfigurationFile) {
        this.configurationFile = configurationFile;
    }

    static readFromJson(): ConfigurationFile {
        const jsonFile = fs.readFileSync(path.join(process.cwd(), "configuration.json"));
        return JSON.parse(jsonFile.toString());
    }

    private getProjectById(projectId: string): Project {
        const project = this.configurationFile.projects.find(project => project.id === projectId);
        if (project == null) {
            throw new Error(`Project with ID ${projectId} not found`);
        } else {
            return project;
        }
    }

    public validateConfiguration(): void {
        const projects = this.configurationFile.projects;
        if (projects.length === 0) {
            throw new Error("No projects found in configuration file");
        }
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            if (project.gitops_repo_id == null && project.docker_compose_server_id == null) {
                throw new Error(`Please configure gitops_repo_id or docker_compose_server_id for project ${project.id}`);
            }
            if (project.environments.length === 0) {
                throw new Error(`No environments found for project ${project.id}`);
            }
            if (project.gitops_repo_id != null) {
                const gitOpsRepositoryConfiguration = this.configurationFile.gitops_configuration.repositories.find((r: GitopsRepository) => r.id === project.gitops_repo_id);
                if (gitOpsRepositoryConfiguration == null) {
                    throw new Error(`Gitops repository not found for project ${project.id}`);
                }
                const credentials = this.configurationFile.gitops_configuration.git_accounts.find((c: GitCredentials) => c.id === gitOpsRepositoryConfiguration.git_account_id);
                if (credentials == null) {
                    throw new Error(`Credentials not found for project ${project.id}`);
                }
            }
            if (project.docker_compose_server_id != null) {
                const dockerComposeServer = this.configurationFile.docker_compose_configuration.server.find((s) => s.id === project.docker_compose_server_id);
                if (dockerComposeServer == null) {
                    throw new Error(`Docker Compose server not found for project ${project.id}`);
                }
            }
            for (let j = 0; j < project.environments.length; j++) {
                const environment = project.environments[j];
                if (this.getSecretValue(environment.secret) == null) {
                    throw new Error(`No secret found for environment ${environment.name} in project ${project.id}`);
                }
                if (environment.values_file == null || environment.values_file === "") {
                    throw new Error(`No values file found for environment ${environment.name} in project ${project.id}`);
                }
            }
        }
    }

    /// Load the secret value from the secret reference. Should be used later for sealed secrets and references to kubernetes secrets
    private getSecretValue(secretReference: SecretReference) {
        if (secretReference.raw_value == null) {
            throw new Error("No secret found");
        }
        return secretReference.raw_value;
    }


    private getProjectEnvironmentBySecret(project: Project, secret: string):
        ProjectEnvironment {
        const environment = project.environments.find(environment => this.getSecretValue(environment.secret) == secret);
        if (environment == null) {
            throw new Error(`Environment with secret ${secret} not found for project ${project.id}`);
        } else {
            if (this.getSecretValue(environment.secret) !== secret) {
                throw new Error(`Invalid secret for project ${project.id}`);
            } else {
                return environment;
            }
        }
    }

    private getGitOpsConfiguration(project: Project):
        CurrentConfigurationGit {
        const gitOpsRepositoryConfiguration = this.configurationFile.gitops_configuration.repositories.find((r: GitopsRepository) => r.id === project.gitops_repo_id);
        if (gitOpsRepositoryConfiguration == null) {
            throw new Error(`Gitops repository not found for project ${project.id}`);
        } else {
            const credentials = this.configurationFile.gitops_configuration.git_accounts.find((c: GitCredentials) => c.id === gitOpsRepositoryConfiguration.git_account_id);
            if (credentials == null) {
                throw new Error(`Credentials not found for project ${project.id}`);
            } else {
                return {
                    credentials: credentials,
                    repository: gitOpsRepositoryConfiguration
                };
            }

        }
    }

    private getDockerComposeConfiguration(project: Project):
        CurrentConfigurationDockerCompose {
        const dockerComposeServer = this.configurationFile.docker_compose_configuration.server.find((s) => s.id === project.docker_compose_server_id);
        if (dockerComposeServer == null) {
            throw new Error(`Docker Compose server not found for project ${project.id}`);
        }
        return {
            server: dockerComposeServer
        };
    }

    getCurrentConfiguration(imageTagUpdateRequest
                            :
                            ImageTagUpdateRequestDto
    ):
        CurrentConfiguration {
        const project = this.getProjectById(imageTagUpdateRequest.project_id);
        const currentEnvironment = this.getProjectEnvironmentBySecret(project, imageTagUpdateRequest.project_secret);
        if (project.gitops_repo_id == null && project.docker_compose_server_id == null) {
            throw new Error(`Please configure gitops_repo_id or docker_compose_server_id for project ${project.id}`);
        }
        if (project.gitops_repo_id != null) {
            return {
                project: project,
                environment: currentEnvironment,
                git_configuration: this.getGitOpsConfiguration(project),
                docker_compose_configuration: null
            }
        } else if (project.docker_compose_server_id != null) {
            return {
                project: project,
                environment: currentEnvironment,
                git_configuration: null,
                docker_compose_configuration: this.getDockerComposeConfiguration(project),
            }
        } else {
            throw new Error(`Please configure gitops_repo_id or docker_compose_server_id for project ${project.id}`);
        }
    }
}