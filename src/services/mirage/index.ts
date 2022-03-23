import {
  createServer,
  Factory,
  Model,
  Response,
  ActiveModelSerializer,
} from "miragejs";
import faker from "faker";

type User = {
  name: string;
  email: string;
  created_at: string;
};

export function makeServer() {
  const server = createServer({
    serializers: {
      application: ActiveModelSerializer,
    },

    models: {
      user: Model.extend<Partial<User>>({} as User),
    },

    factories: {
      user: Factory.extend({
        name(i: number) {
          return `User${i + 1}`;
        },
        email() {
          return faker.internet.email().toLowerCase();
        },
        createdAt() {
          return faker.date.recent(10); // Recente de 10dias
        },
      }),
    },

    seeds(server) {
      server.createList("user", 50); // ('nome do factories', quantos usuarios)
    },

    routes() {
      this.namespace = "api"; // /api/~
      this.timing = 750; // Criar delay de 750ms

      this.get("/users", function (schema, request) {
        const { page = 1, per_page = 10 } = request.queryParams;

        const total = schema.all("user").length;

        // 10 - 20
        const pageStart = (Number(page) - 1) * Number(per_page); // page 2 * 10 = 20
        const pageEnd = pageStart + Number(per_page); // 20 + 10 = 30

        const users = this.serialize(schema.all("user"))
          .users.sort((a, b) => a.createdAt - b.createdAt)
          .slice(pageStart, pageEnd);

        return new Response(200, { "x-total-count": String(total) }, { users });
      });

      this.get("/users/:id");
      this.post("/users");

      this.namespace = ""; // Resetar a rota para que o next consiga utilizar a rota "api"
      this.passthrough(); // Apos passar pela mirage, passar na propria rota
    },
  });

  return server;
}
