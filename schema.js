"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
exports.schema = (0, graphql_1.buildSchema)(`
  type Item {
    _L1: String
    _L2: String
    name: String
    id: String
    merchant_id: String
    merchant_name: String
    valid_from: String
    valid_to: String
    current_price: String
    original_price: String
    sale_story: String
    clean_image_url: String
  }

  type Query {
    items(postalCode: String!, store: String!): [Item]
  }
`);
