import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../db/sequelize';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export class Booking
  extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>>
{
  declare id: CreationOptional<number>;
  declare userId: number;
  declare churrasqueiroId: number;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare totalPrice: number;
  declare status: CreationOptional<BookingStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    churrasqueiroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'bookings',
  },
);
