import App from './app';
import config from './config';
import { logger } from './resources';

// default port: 3000
const port: number = typeof config.port === 'string' ? parseInt(config.port) : config.port;
const { app } = new App();

app
  .listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  })
  .on('error', (error) => {
    logger.error(error);
  });
