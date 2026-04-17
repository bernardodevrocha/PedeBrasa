"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../db/sequelize");
const Conversation_1 = require("./Conversation");
class Message extends sequelize_1.Model {
}
exports.Message = Message;
Message.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    conversationId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: Conversation_1.Conversation,
            key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    senderId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_2.sequelize,
    tableName: "chat_messages",
    indexes: [
        {
            fields: ["conversationId", "createdAt"],
        },
        {
            fields: ["senderId", "createdAt"],
        },
    ],
});
Conversation_1.Conversation.hasMany(Message, {
    foreignKey: "conversationId",
    as: "messages",
});
Message.belongsTo(Conversation_1.Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
});
//# sourceMappingURL=Message.js.map