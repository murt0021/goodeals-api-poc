import axios from "axios";
import pool from "./db"; // Import the database connection

interface ApiResponse {
  items: Array<{
    _L1: String;
    _L2: String;
    name: String | null;
    id: Number;
    merchant_name: String;
    merchant_id: String | null;
    valid_from: string;
    valid_to: string;
    current_price: String | null;
    original_price: String;
    sale_story: String;
    clean_image_url: String;
  }>;
}

export const resolvers = {
  Query: {
    items: async (_: any, args: { postalCode: string; store: string }) => {
      const currentDate = new Date();
      try {
        // Check the database for valid items first
        const dbResponse = await pool.query(
          "SELECT * FROM historical_prices WHERE merchant_id = $1 AND valid_from <= $2 AND valid_to >= $3",
          [args.store, currentDate, currentDate]
        );

        if (dbResponse.rows.length > 0) {
          // Return valid items from the database
          return dbResponse.rows;
        } else {
          // Fetch from the third-party API if no valid items in the database
          const apiResponse = await axios.get(
            `https://backflipp.wishabi.com/flipp/items/search?locale=en-ca&postal_code=${args.postalCode}&q=${args.store}`
          );
          const data: ApiResponse = apiResponse.data;
          const filteredItems = data.items.filter(
            (item) =>
              item.name != null &&
              item.current_price != null &&
              item.merchant_id != null
          );

          // Insert new items into the database
          for (const item of filteredItems) {
            const validFrom = new Date(item.valid_from);
            const validTo = new Date(item.valid_to);
            await pool.query(
              "INSERT INTO historical_prices (item_id, item_name, merchant_id, current_price, valid_from, valid_to) VALUES ($1, $2, $3, $4, $5, $6)",
              [
                item.id,
                item.name,
                item.merchant_id,
                item.current_price,
                validFrom,
                validTo,
              ]
            );
          }

          return filteredItems;
        }
      } catch (error) {
        throw new Error("Failed to process request");
      }
    },
  },
};
