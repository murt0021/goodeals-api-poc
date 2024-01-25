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
            const currentDate = new Date();
            try {
                // Check the database for valid items first
                const dbResponse = yield db_1.default.query("SELECT * FROM historical_prices WHERE merchant_id = $1 AND valid_from <= $2 AND valid_to >= $3", [args.store, currentDate, currentDate]);
                if (dbResponse.rows.length > 0) {
                    // Return valid items from the database
                    return dbResponse.rows;
                }
                else {
                    // Fetch from the third-party API if no valid items in the database
                    const apiResponse = yield axios_1.default.get(`https://backflipp.wishabi.com/flipp/items/search?locale=en-ca&postal_code=${args.postalCode}&q=${args.store}`);
                    const data = apiResponse.data;
                    const filteredItems = data.items.filter((item) => item.name != null &&
                        item.current_price != null &&
                        item.merchant_id != null);
                    // Insert new items into the database
                    for (const item of filteredItems) {
                        const validFrom = new Date(item.valid_from);
                        const validTo = new Date(item.valid_to);
                        yield db_1.default.query("INSERT INTO historical_prices (item_id, item_name, merchant_id, current_price, valid_from, valid_to) VALUES ($1, $2, $3, $4, $5, $6)", [
                            item.id,
                            item.name,
                            item.merchant_id,
                            item.current_price,
                            validFrom,
                            validTo,
                        ]);
                    }
                    return filteredItems;
                }
            }
            catch (error) {
                throw new Error("Failed to process request");
            }
        }),
    },
};
