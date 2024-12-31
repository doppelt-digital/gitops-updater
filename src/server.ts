import express from 'express';
import winston from 'winston';
import {GitService} from "./services/git";
import {ConfigurationService} from "./services/configuration_service";
import {DockerComposeService} from "./services/docker_compose_service";
import {ImageTagUpdateRequestDto} from "./interfaces/dto/image_tag_update_request_dto";

const {combine, timestamp, json, printf} = winston.format;

const app = express();

const configurationService = new ConfigurationService(ConfigurationService.readFromJson());
configurationService.validateConfiguration();
const gitService = new GitService();
const dockerComposeService = new DockerComposeService();

const timestampFormat = 'DD-MM-YYYY HH:mm:ss';

export const logger = winston.createLogger({
    level: 'debug',
    format: combine(
        timestamp({format: timestampFormat}),
        json(),
        printf(({timestamp, level, message, ...data}) => {
            const response = {
                level,
                timestamp,
                message,
                data,
            };

            return JSON.stringify(response);
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

app.use(express.json());

app.get('/api/v1/healthz/readiness', (req, res) => {
    res.json({status: 'ok', message: 'Server is ready to accept requests.'});
});

app.get('/api/v1/healthz/liveness', (req, res) => {
    res.json({status: 'ok', message: 'Server is running.'});
});


app.post('/api/v1/update-image-tag', async (req: any, res: any) => {
    logger.info("Received request to update image tag");
    try {
        const imageTagUpdateRequest: ImageTagUpdateRequestDto = req.body;
        console.log("Got request", imageTagUpdateRequest);
        const currentConfiguration = configurationService.getCurrentConfiguration(imageTagUpdateRequest);

        if (currentConfiguration.docker_compose_configuration != null) {
            await dockerComposeService.updateImageTag(currentConfiguration, imageTagUpdateRequest.new_image_tag);
        } else if (currentConfiguration.git_configuration != null) {
            await gitService.updateImageTag(currentConfiguration, imageTagUpdateRequest.new_image_tag);
        }
        const message = `Updated image tag to ${imageTagUpdateRequest.new_image_tag} for project ${currentConfiguration.project.id} on environment ${currentConfiguration.environment.name}.`;
        logger.info(message);
        res.json({
            status: 'success',
            message: message
        });
    } catch (e: any) {
        logger.error(e.message);
        res.status(400).json({status: 'error', message: e.message});
    }
});

app.listen(3000, () => {
    logger.info('Server started on port 3000');
});