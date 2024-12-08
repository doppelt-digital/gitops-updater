import {CurrentConfiguration} from "../interfaces/current_configurations";

export class DockerComposeService {

    async updateImageTag(currentConfiguration: CurrentConfiguration, new_image_tag: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}