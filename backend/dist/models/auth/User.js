"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(180),
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user',
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'users',
    hooks: {
        afterFind: (result) => {
            if (!result)
                return;
            const strip = (u) => {
                // escondendo hash por padrão
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash, ...rest } = u.get({ plain: true });
                u.toJSON = () => rest;
            };
            if (Array.isArray(result)) {
                result.forEach(strip);
            }
            else {
                strip(result);
            }
        },
    },
});
//# sourceMappingURL=User.js.map