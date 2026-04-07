import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../../db/sequelize";

export class ChurrasqueiroParceiro
  extends Model<
    InferAttributes<ChurrasqueiroParceiro>,
    InferCreationAttributes<ChurrasqueiroParceiro>
  >
{
  declare id: CreationOptional<number>;
  declare churrasqueiroId: number;
  declare parceiroId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ChurrasqueiroParceiro.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    churrasqueiroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    parceiroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "churrasqueiro_parceiros",
    indexes: [
      {
        unique: true,
        fields: ["churrasqueiroId", "parceiroId"],
      },
    ],
  },
);
