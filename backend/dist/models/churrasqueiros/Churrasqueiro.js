"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Churrasqueiro = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
class Churrasqueiro extends sequelize_1.Model {
}
exports.Churrasqueiro = Churrasqueiro;
Churrasqueiro.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    imgChurrasqueiro: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    pricePerHour: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    rating: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'churrasqueiros',
});
//# sourceMappingURL=Churrasqueiro.js.map