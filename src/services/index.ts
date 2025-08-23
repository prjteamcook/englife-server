import fs from 'fs';
import Joi from 'joi';
import * as path from 'path';
import {
  Router,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express';
import { join as pathJoin } from 'path/posix';
import { HTTPMethod } from '@/types';
import { validator } from '@/middlewares';

import aiRouter from './ai';

export const routers = [aiRouter];

interface KeyValue<T> {
  [key: string]: T;
}

export interface Route {
  method: HTTPMethod;
  description?: string;
  path: string;
  middlewares?: RequestHandler[];
  handler: RequestHandler;
  validateSchema?: KeyValue<Joi.Schema>;
  querySchema?: KeyValue<Joi.Schema>;
}

// 임포트 된 서비스 (서비스 디렉토리 명 추가)
export interface Service {
  code?: string;
  name: string;
  baseURL: string;
  routes: Route[];
}

// 각 서비스 정의 시 사용되는 인터페이스
export interface ServiceSchema {
  name: string;
  baseURL: string;
  routes: Route[];
}

const wrapper =
  (asyncFn: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await asyncFn(req, res, next);
    } catch (error) {
      return next(error);
    }
  };

/**
 * 여러 서비스의 라우트를 통합하여 Express Router 인스턴스를 생성합니다.
 *
 * 각 서비스는 baseURL, code, routes 등의 정보를 포함하며,
 * 각 route에 대해 HTTP 메서드, 경로, 미들웨어, 스키마 검증, 핸들러를 등록합니다.
 * 
 * @param services 라우트와 관련 정보를 담고 있는 Service 객체 배열
 * @returns 통합된 라우트가 등록된 Express Router 인스턴스
 */
const createService = (services: Service[]) => {
  const router = Router();

  for (const { routes, baseURL, code } of services) {
    for (const route of routes) {
      router[route.method](pathJoin(baseURL, route.path), [
        ...(route.middlewares ? route.middlewares.map(wrapper) : []),
        ...(route.validateSchema
          ? [validator(Joi.object(route.validateSchema))]
          : []),
        wrapper(route.handler),
      ]);
    }
  }

  return router;
};

export const services = fs
  .readdirSync(__dirname, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const importedServices = services.map<Service>((name) => {
  return {
    code: name,
    ...require(path.join(__dirname, name)).default,
  };
});

export const serviceRouter = createService(importedServices);
