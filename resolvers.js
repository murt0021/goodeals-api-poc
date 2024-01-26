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
const db_1 = __importDefault(require("./db"));
const pg_format_1 = __importDefault(require("pg-format"));
const storeToMerchantIdMap = {
    loblaws: "2018",
    metro: "2269",
    walmart: "234"
};
exports.resolvers = {
    Query: {
        items: (_, args) => __awaiter(void 0, void 0, void 0, function* () {
            const currentDate = new Date().toISOString();
            const merchantId = storeToMerchantIdMap[args.store.toLowerCase()]; // Convert store name to merchant_id
            if (!merchantId) {
                throw new Error("Invalid store name");
            }
            try {
                const dbResponse = yield db_1.default.query("SELECT * FROM historical_prices WHERE merchant_id = $1 AND valid_from <= $2 AND valid_to >= $3", [merchantId, currentDate, currentDate]);
                console.log(dbResponse, "a dbresponse");
                if (dbResponse.rows.length > 0) {
                    console.log(dbResponse.rows, "colunas da dbresponse");
                    return dbResponse.rows;
                }
                else {
                    const apiResponse = yield axios_1.default.get(`https://backflipp.wishabi.com/flipp/items/search?locale=en-ca&postal_code=${args.postalCode}&q=${args.store}`);
                    const data = apiResponse.data;
                    const filteredItems = data.items.filter((item) => item.name != null &&
                        item.current_price != null &&
                        item.merchant_id != null);
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
                        const insertQuery = (0, pg_format_1.default)("INSERT INTO historical_prices (item_id, name, merchant_id, merchant_name, current_price, valid_from, valid_to) VALUES %L", insertData);
                        yield db_1.default.query(insertQuery);
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
