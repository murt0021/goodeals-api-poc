import Fastify from "fastify";
import mercurius from "mercurius";
import { schema } from "./schema";
import { resolvers } from "./resolvers";

const buildServer = async () => {
  const server = Fastify();

  server.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
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
