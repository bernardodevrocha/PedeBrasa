"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChurrasqueiroParceiro = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
class ChurrasqueiroParceiro extends sequelize_1.Model {
}
exports.ChurrasqueiroParceiro = ChurrasqueiroParceiro;
ChurrasqueiroParceiro.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    churrasqueiroId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    parceiroId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: "churrasqueiro_parceiros",
    indexes: [
        {
            unique: true,
            fields: ["churrasqueiroId", "parceiroId"],
        },
    ],
});
//# sourceMappingURL=ChurrasqueiroParceiro.js.map