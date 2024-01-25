import axios from 'axios';
import pool from './db'; // Import the database connection

interface ApiResponse {
  items: Array<{
    _L1: String,
    _L2: String,
    name: String | null,
    id: Number,
    merchant_name: String,
    merchant_id: String | null,
    valid_from: string,
    valid_to: string,
    current_price: String | null,
    original_price: String,
    sale_story: String,
    clean_image_url: String
  }>
}

export const resolvers = {
  Query: {
    items: async (_: any, args: { postalCode: string, store: string }) => {
      try {
        const response = await axios.get(`https://backflipp.wishabi.com/flipp/items/search?locale=en-ca&postal_code=${args.postalCode}&q=${args.store}`);
        const data: ApiResponse = response.data;
        const filteredItems = data.items.filter(item => 
          item.name != null && 
          item.current_price != null && 
          item.merchant_id != null
        );

        for (const item of filteredItems) {
          const currentDate = new Date();
          const validFrom = new Date(item.valid_from);
          const validTo = new Date(item.valid_to);

          // Check if there is already valid data
          const res = await pool.query('SELECT * FROM historical_prices WHERE item_id = $1 AND merchant_id = $2 AND valid_from <= $3 AND valid_to >= $4', [item.id, item.merchant_id, currentDate, currentDate]);
          
          if (res.rowCount === 0) {
            // No valid data, insert new data
            await pool.query('INSERT INTO historical_prices (item_id, item_name, merchant_id, current_price, valid_from, valid_to) VALUES ($1, $2, $3, $4, $5, $6)', [item.id, item.name, item.merchant_id, item.current_price, validFrom, validTo]);
          }
        }

        return filteredItems;
      } catch (error) {
        throw new Error('Failed to fetch data');
      }
    }
  }
};