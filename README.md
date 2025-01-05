# GitOps Updater

This is a simple tool, that you can use to update your GitOps repository with the latest changes from your application repositories.

### Installation
##### Via Helm (Recommended)
```bash
helm repo add doppelt-digital-gitops-updater https://doppelt-digital.github.io/gitops-updater
helm install gitops-updater doppelt-digital-gitops-updater/gitops-updater --namespace gitops-updater --create-namespace
```

### Usage
Add the following command to the CI/CD pipeline for example of your backend or frontend to update your GitOps repository with the latest changes from your application repositories.
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"${GITOPS_UPDATER_PROJECT_NAME}\",\"project_secret\":\"${GITOPS_UPDATER_SECRET_PROD}\",\"new_image_tag\":\"${MY_COMMIT_ID}\"}" \
  "${GITOPS_UPDATER_URL}"
```

### What does it do?
The GitOps Updater can update any kind of yaml in your repository. This can be used for repositories with values for helm charts to be deployed by ArgoCD or any other tool like docker-compose which is deployed by a ansible pipeline.