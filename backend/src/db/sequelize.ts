import path from 'path';
import fs from 'fs';
import { Sequelize, type Options } from 'sequelize';

const defaultPath = path.join(__dirname, '..', '..', 'data', 'pedebrasa.sqlite');
const storagePath = process.env.DB_PATH || defaultPath;
const databaseUrl = process.env.DATABASE_URL;

const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

function createSequelize() {
  if (databaseUrl) {
    const options: Options = {
      dialect: 'postgres',
      logging,
    };

    if (process.env.DB_SSL !== 'false') {
      options.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      };
    }

    return new Sequelize(databaseUrl, options);
  }

  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  return new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging,
  });
}

export const sequelize = createSequelize();

