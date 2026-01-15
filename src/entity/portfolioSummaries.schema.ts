import { EntitySchema } from 'typeorm';
import type { UserEntity } from './user.schema.js';
export type UserCapitalEntity = {
  userId: string;
  totalInvest: string;
  costTotal: string;
  updatedAt: Date;

  user?: UserEntity;
};
export const UserCapitalSchema = new EntitySchema<UserCapitalEntity>({
  name: 'userCapitals',
  tableName: 'user_capitals',
  columns: {
    userId: {
      name: 'user_id',
      type: 'uuid',
      primary: true,
      nullable: false,
    },

    totalInvest: {
      name: 'total_invest',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: false,
      default: 0,
    },

    costTotal: {
      name: 'cost_total',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: false,
      default: 0,
    },

    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
      nullable: false,
    },
  },

  relations: {
    user: {
      type: 'one-to-one',
      target: 'users',
      joinColumn: { name: 'user_id', referencedColumnName: 'userId' },
    },
  },
});
