import { ServiceSchema } from '@/services';
import * as controller from './controller';
import { imageUpload } from './upload-middleware';

export default <ServiceSchema>{
  baseURL: '/ai',
  name: 'ai',
  routes: [
    {
      path: '/',
      method: 'get',
      description: 'AI 서비스 핑퐁 테스트',
      handler: controller.pingpong,
    },
    {
      path: '/analyze-image',
      method: 'post',
      description: '이미지를 분석하고 학습 데이터 기반 예문 생성',
      middlewares: [imageUpload],
      handler: controller.analyzeImageWithLearning,
    },
    {
      path: '/generate-examples',
      method: 'post',
      description: '특정 상황에 대한 영어 예문 생성',
      handler: controller.generateExamplesForSituation,
    },
  ],
};
