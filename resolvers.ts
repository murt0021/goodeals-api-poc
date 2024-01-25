import axios from 'axios';

interface ApiResponse {
  items: Array<{
    _L1: String,
    _L2: String,
    name: String | null,
    merchant_name: String,
    merchant_id: String | null,
    valid_from: String,
    valid_to: String,
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
        return data.items.filter(item => 
          item.name != null && 
          item.current_price != null && 
          item.merchant_id != null
        );
      } catch (error) {
        throw new Error('Failed to fetch data');
      }
    }
  }
};
