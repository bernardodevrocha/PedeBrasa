import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../db/sequelize';

export class Review
  extends Model<InferAttributes<Review>, InferCreationAttributes<Review>>
{
  declare id: CreationOptional<number>;
  declare bookingId: number;
  declare churrasqueiroId: number;
  declare userId: number;
  declare rating: number;
  declare comment: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    churrasqueiroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'reviews',
  },
);
