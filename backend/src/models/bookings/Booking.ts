import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../../db/sequelize';

export type BookingStatus =
  | 'PENDENTE_ORCAMENTO'
  | 'EM_ANALISE_CHURRASQUEIRO'
  | 'AJUSTADO_PELO_CHURRASQUEIRO'
  | 'APROVADO_PARA_PAGAMENTO'
  | 'RECUSADO'
  | 'PAGO'
  | 'CANCELADO';

export class Booking
  extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>>
{
  declare id: CreationOptional<number>;
  declare userId: number;
  declare churrasqueiroId: number;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare serviceAmount: number;
  declare platformFeeAmount: number;
  declare travelFee: number;
  declare estimatedPrice: number;
  declare approvedPrice: number | null;
  declare totalPrice: number;
  declare partnerId: number | null;
  declare partnerName: string | null;
  declare partnerCouponCode: string | null;
  declare selectedCuts: string | null;
  declare notes: string | null;
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
    serviceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platformFeeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    travelFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estimatedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    approvedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    partnerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    partnerName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    partnerCouponCode: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    selectedCuts: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'EM_ANALISE_CHURRASQUEIRO',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'bookings',
  },
);
