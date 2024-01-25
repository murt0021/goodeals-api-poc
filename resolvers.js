"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("./db")); // Import the database connection
exports.resolvers = {
    Query: {
        items: (_, args) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`https://backflipp.wishabi.com/flipp/items/search?locale=en-ca&postal_code=${args.postalCode}&q=${args.store}`);
                const data = response.data;
                const filteredItems = data.items.filter(item => item.name != null &&
                    item.current_price != null &&
                    item.merchant_id != null);
                for (const item of filteredItems) {
                    const currentDate = new Date();
                    const validFrom = new Date(item.valid_from);
                    const validTo = new Date(item.valid_to);
                    // Check if there is already valid data
                    const res = yield db_1.default.query('SELECT * FROM historical_prices WHERE item_id = $1 AND merchant_id = $2 AND valid_from <= $3 AND valid_to >= $4', [item.id, item.merchant_id, currentDate, currentDate]);
                    if (res.rowCount === 0) {
                        // No valid data, insert new data
                        yield db_1.default.query('INSERT INTO historical_prices (item_id, item_name, merchant_id, current_price, valid_from, valid_to) VALUES ($1, $2, $3, $4, $5, $6)', [item.id, item.name, item.merchant_id, item.current_price, validFrom, validTo]);
                    }
                }
                return filteredItems;
            }
            catch (error) {
                throw new Error('Failed to fetch data');
            }
        })
    }
};
