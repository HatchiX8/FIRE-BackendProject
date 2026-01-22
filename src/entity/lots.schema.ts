import { EntitySchema } from 'typeorm';
import type { UserEntity } from './user.schema.js';

export interface LotsEntity {
  lotId: string;
  userId: string;
  stockId: string;
  stockName: string;

  buyDate: Date;
  buyPrice: string; // numeric(12,2)
  buyQuantity: number;
  remainingQuantity: number;
  remainingCost: string; // numeric(14,2)
  buyAmount: string; // numeric(14,2)
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;

  isVoided?: boolean;
  voidedAt: Date;

  user?: UserEntity;
}

export const LotsSchema = new EntitySchema<LotsEntity>({
  name: 'lots',
  tableName: 'lots',
  columns: {
    lotId: {
      name: 'lot_id',
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },

    userId: {
      name: 'user_id',
      type: 'uuid',
      nullable: false,
    },

    stockId: {
      name: 'stock_id',
      type: 'varchar',
      length: 10,
      nullable: false,
    },

    stockName: {
      name: 'stock_name',
      type: 'varchar',
      length: 50,
      nullable: false,
    },

    buyDate: {
      name: 'buy_date',
      type: 'date',
      nullable: false,
    },

    buyPrice: {
      name: 'buy_price',
      type: 'numeric',
      precision: 12,
      scale: 4,
      nullable: false,
    },

    buyQuantity: {
      name: 'buy_quantity',
      type: 'int',
      nullable: false,
    },

    remainingQuantity: {
      name: 'remaining_quantity',
      type: 'int',
      nullable: false,
    },
    remainingCost: {
      name: 'remaining_cost',
      type: 'numeric',
      precision: 14,
      scale: 2,
      nullable: false,
    },
    buyAmount: {
      name: 'buy_amount',
      type: 'numeric',
      precision: 14,
      scale: 2,
      nullable: false,
    },

    note: {
      name: 'note',
      type: 'varchar',
      length: 100,
      nullable: true,
    },

    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      createDate: true,
    },

    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
    },

    isVoided: {
      name: 'is_voided',
      type: 'boolean',
      nullable: false,
      default: false,
    },

    voidedAt: {
      name: 'voided_at',
      type: 'timestamptz',
      nullable: true,
    },
  },

  relations: {
    user: {
      type: 'many-to-one',
      target: 'users',
      joinColumn: {
        name: 'user_id',
      },
      onDelete: 'CASCADE',
    },
  },

  indices: [
    {
      name: 'idx_lots_user_open',
      columns: ['userId'],
      where: 'remaining_quantity > 0',
    },
    {
      name: 'idx_lots_stock',
      columns: ['stockId'],
    },
    {
      name: 'idx_lots_user_stock',
      columns: ['userId', 'stockId'],
    },
  ],
});
