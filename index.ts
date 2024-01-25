import Fastify from "fastify";
import mercurius from "mercurius";
import { schema } from "./schema";
import { resolvers } from "./resolvers";

interface QueryParams {
  postalCode: string;
  store: string;
}

const buildServer = async () => {
  const server = Fastify();

  server.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  });

  server.get("/search", async (request, reply) => {
    const { postalCode, store } = request.query as QueryParams;
    if (!postalCode || !store) {
      reply.code(400).send({ error: "Postal code and store are required" });
      return;
    }

    try {
      const result = await resolvers.Query.items(null, { postalCode, store });
      reply.send(result);
    } catch (error) {
      reply.code(500).send({ error: "Failed to process request" });
    }
  });

  return server;
};

const start = async () => {
  const server = await buildServer();
  try {
    await server.listen(3000);
    console.log(`Server is listening on port 3000`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
