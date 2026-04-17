import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../../db/sequelize";

export class Conversation extends Model<
  InferAttributes<Conversation>,
  InferCreationAttributes<Conversation>
> {
  declare id: CreationOptional<number>;
  declare participantOneId: number;
  declare participantTwoId: number;
  declare lastMessageAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    participantOneId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    participantTwoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "chat_conversations",
    indexes: [
      {
        unique: true,
        fields: ["participantOneId", "participantTwoId"],
      },
      {
        fields: ["lastMessageAt"],
      },
    ],
  },
);
