import { ServiceSchema } from '@/services';
import * as controller from './controller';

export default <ServiceSchema>{
  baseURL: '/ai',
  name: 'ai',
  routes: [
    {
      path: '/',
      method: 'get',
      handler: controller.pingpong,
    },
  ],
};
