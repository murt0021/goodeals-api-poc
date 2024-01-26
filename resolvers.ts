import axios from "axios";
import pool from "./db";
import format from "pg-format";

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

const storeToMerchantIdMap: { [key: string]: string } = {
  loblaws: "2018",
  metro: "2269",
  walmart: "234",
};

export const resolvers = {
  Query: {
    items: async (_: any, args: { postalCode: string; store: string }) => {
      const currentDate = new Date().toISOString();
      const merchantId = storeToMerchantIdMap[args.store.toLowerCase()];

      if (!merchantId) {
        throw new Error("Invalid store name");
      }

      try {
        const dbResponse = await pool.query(
          "SELECT * FROM historical_prices WHERE merchant_id = $1 AND valid_from <= $2 AND valid_to >= $3",
          [merchantId, currentDate, currentDate]
        );

        if (dbResponse.rows.length > 0) {
          return dbResponse.rows;

        } else {
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

          const insertData = filteredItems.map((item) => [
            item.id,
            item.name,
            merchantId,
            item.merchant_name,
            item.current_price,
            new Date(item.valid_from),
            new Date(item.valid_to),
          ]);

          if (insertData.length > 0) {
            const insertQuery = format(
              "INSERT INTO historical_prices (item_id, name, merchant_id, merchant_name, current_price, valid_from, valid_to) VALUES %L",
              insertData
            );
            await pool.query(insertQuery);
          }

          return filteredItems;
        }
      } catch (error) {
        throw new Error("Failed to process request");
      }
    },
  },
};
