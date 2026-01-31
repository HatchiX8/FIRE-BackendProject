import { EntitySchema } from 'typeorm';

export type StockPricesEntity = {
  stockId: string;
  stockName: string;
  closePrice: number | null;

  updatedAt: Date;
};

export const StockPricesSchema = new EntitySchema<StockPricesEntity>({
  name: 'currentStockPrices',
  tableName: 'current_stock_prices',
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
    closePrice: {
      name: 'close_price',
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
    },
  },
});
