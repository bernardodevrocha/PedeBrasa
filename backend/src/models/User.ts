import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import { sequelize } from '../db/sequelize';

export type UserRole = 'user' | 'admin';

export class User
  extends Model<InferAttributes<User>, InferCreationAttributes<User>>
{
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare role: CreationOptional<UserRole>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare toJSON: NonAttribute<() => object>;
}

User.init(
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
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      afterFind: (result) => {
        if (!result) return;
        const strip = (u: User) => {
          // escondendo hash por padrão
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash, ...rest } = u.get({ plain: true }) as any;
          (u as any).toJSON = () => rest;
        };
        if (Array.isArray(result)) {
          result.forEach(strip);
        } else {
          strip(result as User);
        }
      },
    },
  },
);

