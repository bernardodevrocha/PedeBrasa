import path from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize';

const defaultPath = path.join(__dirname, '..', '..', 'data', 'pedebrasa.sqlite');
const storagePath = process.env.DB_PATH || defaultPath;

fs.mkdirSync(path.dirname(storagePath), { recursive: true });

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
});

