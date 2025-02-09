import simpleGit, {SimpleGit} from 'simple-git';
import path from 'path';
import tmp from "tmp";
import shell from "shelljs";
import {logger} from "../server";
import {GitCredentials, GitopsRepository} from "../interfaces/configuration_file/gitops_configuration";
import {CurrentConfiguration} from "../interfaces/current_configurations";

export class GitService {
    constructor() {
    }

    buildGitRemoteUrl(gitCredentials: GitCredentials, gitRepo: GitopsRepository): string {
        return `https://${gitCredentials.username}:${gitCredentials.access_token}@${gitRepo.url}`;
    }

    async updateImageTag(currentConfiguration: CurrentConfiguration, newImageTag: string): Promise<void> {

        /// Set the variables
        const tempGitDirectory = path.join(tmp.dirSync().name, new Date().getTime().toString());
        const absoluteValuesPath = path.join(tempGitDirectory, currentConfiguration.environment.values_file);

        // Clone the repository
        const url = this.buildGitRemoteUrl(currentConfiguration.git_configuration!.credentials, currentConfiguration.git_configuration!.repository);
        const branch = currentConfiguration.git_configuration!.repository.default_branch;
        const gitCommand = `git clone ${url} ${tempGitDirectory} --branch ${branch}`;
        const gitOutput = shell.exec(gitCommand);
        if (gitOutput.code !== 0) {
            throw new Error(`Failed to clone repository: ${gitOutput.stderr}`);
        }

        // Update the image tag in the values file
        const command = `yq -i e '.${currentConfiguration.project.yaml_key}|="${newImageTag}"' ${absoluteValuesPath}`;
        const output = shell.exec(command);
        if (output.code !== 0) {
            throw new Error(`Failed to update image tag in values file: ${output.stderr}`);
        }

        // Add the changes to git
        const gitAddCommand = `cd ${tempGitDirectory} && git add .`;
        const gitAddOutput = shell.exec(gitAddCommand);
        if (gitAddOutput.code !== 0) {
            throw new Error(`Failed to add changes to git: \nstdout:${gitAddOutput.stderr}\nstderr:${gitAddOutput.stderr}`);
        }

        // Setup the git config
        const gitConfigCommand = `cd ${tempGitDirectory} && git config user.email "${currentConfiguration.git_configuration!.credentials.email}" && git config user.name "${currentConfiguration.git_configuration!.credentials.username}"`;
        const gitConfigOutput = shell.exec(gitConfigCommand);
        if (gitConfigOutput.code !== 0) {
            throw new Error(`Failed to set git config: \nstdout:${gitConfigOutput.stderr}\nstderr:${gitConfigOutput.stderr}`);
        }

        // Commit the changes
        const gitCommitCommand = `cd ${tempGitDirectory} && git commit -m "BOT: Update ${currentConfiguration.project.id} (${currentConfiguration.environment.name}) to ${newImageTag}"`;
        const gitCommitOutput = shell.exec(gitCommitCommand);
        if (gitCommitOutput.code !== 0) {
            throw new Error(`Failed to commit changes to git: \nstdout:${gitCommitOutput.stderr}\nstderr:${gitCommitOutput.stderr}`);
        }

        // Push the changes
        const gitPushCommand = `cd ${tempGitDirectory} && git push`;
        const gitPushOutput = shell.exec(gitPushCommand);
        if (gitPushOutput.code !== 0) {
            throw new Error(`Failed to push changes to git: \nstdout:${gitPushOutput.stderr}\nstderr:${gitPushOutput.stderr}`);
        }
    }
}