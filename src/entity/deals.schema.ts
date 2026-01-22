import { EntitySchema } from 'typeorm';
import type { UserEntity } from './user.schema.js';
import type { LotsEntity } from './lots.schema.js';

export interface DealsEntity {
  tradeId: string;
  userId: string;
  lotId: string;
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell';
  totalCost: string; // numeric(12,2)
  sellCost: string; // numeric(12,2)
  price: string; // numeric(12,2)
  quantity: number;
  realizedPnl: string; // numeric(14,2)
  dealDate: Date;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;

  isVoided?: boolean;
  voidedAt: Date;

  user?: UserEntity;
  lot?: LotsEntity;
}

export const DealsSchema = new EntitySchema<DealsEntity>({
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
      nullable: false,
    },

    lotId: {
      name: 'lot_id',
      type: 'uuid',
      nullable: false, // 舊資料可先 null；新流程 buy/sell 建議必填
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
    sellCost: {
      name: 'sell_cost',
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
    realizedPnl: {
      name: 'realized_pnl',
      type: 'numeric',
      precision: 14,
      scale: 2,
      nullable: false,
      default: 0,
    },
    dealDate: {
      name: 'deal_date',
      type: 'date',
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
      default: () => 'CURRENT_TIMESTAMP',
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
      default: () => 'CURRENT_TIMESTAMP',
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
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },

    lot: {
      type: 'many-to-one',
      target: 'lots',
      joinColumn: { name: 'lot_id' },
      nullable: true,
      onDelete: 'SET NULL', // lots 不建議刪，但若刪了也不讓 deals 爆掉
    },
  },

  indices: [
    { name: 'idx_deals_user_date', columns: ['userId', 'dealDate'] },
    { name: 'idx_deals_user_type', columns: ['userId', 'type'] },
    { name: 'idx_deals_lot', columns: ['lotId'] },
  ],
});
