import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.port,
  gpt_api: process.env.GPT_API,
};
