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
        return `https://oauth2:${gitCredentials.access_token}@${gitRepo.url}`;
    }

    async updateImageTag(currentConfiguration: CurrentConfiguration, newImageTag: string): Promise<void> {

        /// Set the variables
        const tempGitDirectory = tmp.dirSync({mode: 755, keep: true}).name;
        const absoluteValuesPath = path.join(tempGitDirectory, currentConfiguration.environment.name);

        // Init git
        const git: SimpleGit = simpleGit({
            config: [
                `user.name=${currentConfiguration.git_configuration!.credentials.username}`,
                `user.email=${currentConfiguration.git_configuration!.credentials.email}`
            ],
            binary: '/usr/bin/git',
            baseDir: tempGitDirectory,
            maxConcurrentProcesses: 10
        });

        // Clone the repository
        logger.info("Cloning into " + tempGitDirectory);
        await git.clone(this.buildGitRemoteUrl(currentConfiguration.git_configuration!.credentials, currentConfiguration.git_configuration!.repository), tempGitDirectory, ['--branch', currentConfiguration.git_configuration!.repository.default_branch]);
        logger.info("Successfully cloned repository");

        // Read the current values file and update it
        const command = `yq -i e '.${currentConfiguration.environment.values_file}|="${newImageTag}"' ${absoluteValuesPath}`;
        const output = shell.exec(command);
        if (output.code !== 0) {
            throw new Error(`Failed to update image tag in values file: ${output.stderr}`);
        }

        // Commit and push changes
        await git.add(absoluteValuesPath);
        await git.commit(`BOT: Update ${currentConfiguration.project.id} (${currentConfiguration.environment.name}) to ${newImageTag}`);
        await git.push();
    }
}