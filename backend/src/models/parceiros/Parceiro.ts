import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../../db/sequelize";

export class Parceiro
  extends Model<InferAttributes<Parceiro>, InferCreationAttributes<Parceiro>>
{
  declare id: CreationOptional<number>;
  declare name: string;
  declare category: string;
  declare description: string | null;
  declare featuredProducts: string | null;
  declare location: string;
  declare city: string;
  declare phone: string;
  declare openingHours: string;
  declare couponCode: string;
  declare validUntil: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Parceiro.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featuredProducts: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    openingHours: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    couponCode: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "parceiros",
  },
);
