import { EntitySchema } from 'typeorm';

export type StockInfoEntity = {
  stockId: string;
  stockName: string;

  missingDays: number;
  isActive: boolean;
  lastSeen: string | null;
  note: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export const StockInfoSchema = new EntitySchema<StockInfoEntity>({
  name: 'StockMetadata',
  tableName: 'stock_metadata',
  columns: {
    stockId: {
      name: 'stock_id',
      type: 'varchar',
      length: 10,
      primary: true,
    },
    stockName: {
      name: 'stock_name',
      type: 'varchar',
      length: 100,
      nullable: false,
    },
    missingDays: {
      name: 'missing_days',
      type: 'int',
      default: 0,
    },
    isActive: {
      name: 'is_active',
      type: 'boolean',
      default: true,
    },
    lastSeen: {
      name: 'last_seen',
      type: 'date',
      nullable: true,
    },
    note: {
      name: 'note',
      type: 'text',
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
  },
});
