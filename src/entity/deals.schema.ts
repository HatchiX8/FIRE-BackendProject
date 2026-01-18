import { EntitySchema } from 'typeorm';
import type { UserEntity } from './user.schema.js';

export interface dealsEntity {
  tradeId: string;
  userId: string;
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  totalCost: string; // numeric(12,2)
  price: string; // numeric(12,2)
  quantity: number;
  note?: string | null;
  dealDate: Date;
  createdAt: Date;
  updatedAt: Date;

  user?: UserEntity;
}

export const DealsSchema = new EntitySchema<dealsEntity>({
  name: 'deals',
  tableName: 'deals',
  columns: {
    tradeId: {
      name: 'trade_id',
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    userId: {
      name: 'user_id',
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    stockId: {
      name: 'stock_id',
      type: 'varchar',
      length: 30,
      nullable: false,
    },
    stockName: {
      name: 'stock_name',
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    type: {
      name: 'type',
      type: 'varchar',
      length: 10,
      nullable: false,
    },
    totalCost: {
      name: 'total_cost',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: false,
    },
    price: {
      name: 'price',
      type: 'numeric',
      precision: 12,
      scale: 2,
      nullable: false,
    },
    quantity: {
      name: 'quantity',
      type: 'int',
      nullable: false,
    },
    note: {
      name: 'note',
      type: 'text',
      nullable: true,
    },
    dealDate: {
      name: 'deal_date',
      type: 'date',
      nullable: false,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP',
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
      default: () => 'CURRENT_TIMESTAMP',
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
