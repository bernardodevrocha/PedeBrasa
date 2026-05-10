"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sequelize_1 = require("sequelize");
const defaultPath = path_1.default.join(__dirname, '..', '..', 'data', 'pedebrasa.sqlite');
const storagePath = process.env.DB_PATH || defaultPath;
const databaseUrl = process.env.DATABASE_URL;
const logging = process.env.DB_LOGGING === 'true' ? console.log : false;
function createSequelize() {
    if (databaseUrl) {
        const options = {
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
        return new sequelize_1.Sequelize(databaseUrl, options);
    }
    fs_1.default.mkdirSync(path_1.default.dirname(storagePath), { recursive: true });
    return new sequelize_1.Sequelize({
        dialect: 'sqlite',
        storage: storagePath,
        logging,
    });
}
exports.sequelize = createSequelize();
//# sourceMappingURL=sequelize.js.map