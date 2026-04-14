"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parceiro = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
class Parceiro extends sequelize_1.Model {
}
exports.Parceiro = Parceiro;
Parceiro.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    featuredProducts: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING(180),
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(40),
        allowNull: false,
    },
    openingHours: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    couponCode: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    validUntil: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: "parceiros",
});
//# sourceMappingURL=Parceiro.js.map