import express from 'express';

import cors from 'cors';
import helmet from 'helmet';

import { serviceRouter } from './services';
import { logger } from './resources';
import { errorHandler } from './middlewares';

/**
 * @class App
 * @description
 * Express 애플리케이션의 초기화, 미들웨어, 라우터, 에러 핸들러, 데모 데이터 생성을 담당하는 클래스입니다.
 *
 * - `initializeMiddlewares`: 보안, CORS, JSON 파싱, Bearer 토큰 인증 등 주요 미들웨어를 등록합니다.
 * - `initializeRouter`: 서비스 라우터와 Swagger 문서 라우터를 등록합니다.
 * - `initializeErrorHandlers`: 글로벌 에러 핸들러를 등록합니다.
 * - `createDemo`: 데모용 Classroom 데이터가 없을 경우 생성합니다.
 * - `convertRoutesToSwagger`: 서비스 스키마를 OpenAPI 3.0 형식의 Swagger Paths 객체로 변환합니다.
 * - `joiSchemaToOpenAPISchema`: Joi 스키마를 OpenAPI 스키마로 변환합니다.
 *
 * @property {express.Application} app Express 애플리케이션 인스턴스
 */
class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRouter();
    this.initializeErrorHandlers();
  }

  private initializeRouter() {
    this.app.use('/', serviceRouter);
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(
      express.json({
        limit: '20mb',
      })
    );

    this.app.use((req, res, next) => {
      logger.info(`[${req.method}] ${req.originalUrl}`);
      next();
    });
  }

  private initializeErrorHandlers() {
    this.app.use(errorHandler);
  }
}

export default App;
