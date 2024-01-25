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
const fastify_1 = __importDefault(require("fastify"));
const mercurius_1 = __importDefault(require("mercurius"));
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const buildServer = () => __awaiter(void 0, void 0, void 0, function* () {
    const server = (0, fastify_1.default)();
    server.register(mercurius_1.default, {
        schema: schema_1.schema,
        resolvers: resolvers_1.resolvers,
        graphiql: true,
    });
    server.get("/search", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const { postalCode, store } = request.query;
        if (!postalCode || !store) {
            reply.code(400).send({ error: "Postal code and store are required" });
            return;
        }
        try {
            const result = yield resolvers_1.resolvers.Query.items(null, { postalCode, store });
            reply.send(result);
        }
        catch (error) {
            reply.code(500).send({ error: "Failed to process request" });
        }
    }));
    return server;
});
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield buildServer();
    try {
        yield server.listen(3000);
        console.log(`Server is listening on port 3000`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
});
start();
