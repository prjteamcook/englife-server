import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  gpt_api: process.env.GPT_API,
  cors_origin: process.env.CORS_ORIGIN || '*',
  node_env: process.env.NODE_ENV || 'development',
};
