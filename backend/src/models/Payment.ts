import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export class Payment
  extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>>
{
  declare id: CreationOptional<number>;
  declare bookingId: number;
  declare amount: number;
  declare status: CreationOptional<PaymentStatus>;
  declare provider: string | null;
  declare transactionId: string | null;
  declare idempotencyKey: string | null;
  declare stripeClientSecret: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Payment.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    idempotencyKey: {
      type: DataTypes.STRING(190),
      allowNull: true,
      unique: true,
    },
    stripeClientSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'payments',
  },
);
