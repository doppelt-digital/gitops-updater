/// GitOps Configuration
export interface GitOpsConfiguration {
    readonly git_accounts: GitCredentials[];
    readonly repositories: GitopsRepository[];
}

export interface GitCredentials {
    readonly id: string;
    readonly username: string;
    readonly access_token: string;
    readonly email: string;
}

export interface GitopsRepository {
    readonly id: string;
    readonly default_branch: string;
    readonly git_account_id: string
    readonly url: string;
}