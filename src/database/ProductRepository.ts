import { Product } from '../types';

export class ProductRepository {
  private static async executeSQL(sql: string, params: any[] = []): Promise<any> {
    if (typeof window !== 'undefined') {
      if (window.dbAPI && window.dbAPI.executeQuery) {
        return window.dbAPI.executeQuery(sql, params);
      } else {
        const response = await fetch('./api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        return data.result;
      }
    }
    throw new Error('No client or window context found');
  }

  // ۱. دریافت کالاها با کوئری SELECT واقعی
  static async getProducts(): Promise<Product[]> {
    const sql = `SELECT * FROM products ORDER BY title ASC;`;
    const rows = await this.executeSQL(sql);
    
    return (rows || []).map((row: any) => {
      let warehouse_stocks = { wh_central: row.stock_quantity || 0 };
      if (row.warehouse_stocks) {
        try {
          warehouse_stocks = typeof row.warehouse_stocks === 'string' 
            ? JSON.parse(row.warehouse_stocks) 
            : row.warehouse_stocks;
        } catch (e) {
          console.error("Error parsing warehouse stocks", e);
        }
      }
      return {
        id: row.id,
        barcode: row.barcode || '',
        title: row.title || '',
        purchase_price: row.purchase_price || 0,
        sale_price: row.sale_price || 0,
        stock_quantity: row.stock_quantity || 0,
        unit: row.unit || '',
        category_id: row.category_id || null,
        warehouse_stocks
      };
    });
  }

  // ۲. تعریف یا تصحیح کالا با دستورات INSERT و UPDATE واقعی
  static async saveProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const id = product.id || `prod_${Date.now()}`;
    const warehouse_stocks_str = product.warehouse_stocks 
      ? JSON.stringify(product.warehouse_stocks) 
      : JSON.stringify({ wh_central: product.stock_quantity || 0 });

    const checkSql = `SELECT id FROM products WHERE id = ?;`;
    const existing = await this.executeSQL(checkSql, [id]);

    if (existing && existing.length > 0) {
      const updateSql = `
        UPDATE products 
        SET barcode = ?, title = ?, purchase_price = ?, sale_price = ?, stock_quantity = ?, unit = ?, category_id = ?, warehouse_stocks = ? 
        WHERE id = ?;
      `;
      await this.executeSQL(updateSql, [
        product.barcode || '',
        product.title || '',
        product.purchase_price || 0,
        product.sale_price || 0,
        product.stock_quantity || 0,
        product.unit || '',
        product.category_id || null,
        warehouse_stocks_str,
        id
      ]);
    } else {
      const insertSql = `
        INSERT INTO products (id, barcode, title, purchase_price, sale_price, stock_quantity, unit, category_id, warehouse_stocks) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await this.executeSQL(insertSql, [
        id,
        product.barcode || '',
        product.title || '',
        product.purchase_price || 0,
        product.sale_price || 0,
        product.stock_quantity || 0,
        product.unit || '',
        product.category_id || null,
        warehouse_stocks_str
      ]);
    }

    return {
      ...product,
      id,
      warehouse_stocks: product.warehouse_stocks || { wh_central: product.stock_quantity || 0 }
    } as Product;
  }

  // ۳. حذف کالا با دستور DELETE واقعی
  static async deleteProduct(id: string): Promise<boolean> {
    const deleteSql = `DELETE FROM products WHERE id = ?;`;
    await this.executeSQL(deleteSql, [id]);
    return true;
  }

  // ۴. ویرایش گروهی قیمت کل کالاها با دستور UPDATE واقعی به همراه محاسبات ریاضی بومی SQLite
  static async bulkUpdatePrices(percentage: number, roundToNearest: number = 1000): Promise<boolean> {
    const factor = 1 + percentage / 100;
    const bulkSql = `
      UPDATE products 
      SET sale_price = ROUND((sale_price * ${factor}) / ${roundToNearest}) * ${roundToNearest};
    `;
    await this.executeSQL(bulkSql);
    return true;
  }
}
