<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">

## Description

API NestJS para focos de calor con configuracion basada en variables de entorno, validacion centralizada y soporte para PostgreSQL con Docker.

## Project setup

```bash
$ yarn install
```

## Environment variables

Usa `.env.template` como base para crear tu archivo `.env`.

Variables principales:

- `PORT`: puerto donde expone la API.
- `NODE_ENV`: `development`, `test` o `production`.
- `TZ`: zona horaria de la aplicacion. Por defecto `America/La_Paz`.
- `MAP_KEY`: clave obligatoria para integraciones de mapas e ingestas automaticas.
- `DATABASE_URL`: cadena completa de conexion a PostgreSQL, pensada especialmente para Neon. Si esta vacia, se usan las variables `DB_*`.
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`: conexion desglosada a PostgreSQL.
- `DB_SSL`: habilita SSL para la base de datos.
- `DB_SYNCHRONIZE`: controla `synchronize` de TypeORM.
- `DB_LOGGING`: habilita logs SQL de TypeORM.

La API valida estas variables al arrancar y detiene la ejecucion si falta alguna obligatoria o si tiene formato invalido.

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Docker

Para levantar PostgreSQL en Docker:

```bash
docker compose up -d
```

Detalles de la configuracion:

- Solo PostgreSQL corre dentro de Docker.
- La API corre localmente con `yarn start`, `yarn start:dev` o `yarn start:prod`.
- PostgreSQL usa la zona horaria `America/La_Paz`.
- `docker-compose.yml` toma los valores desde `.env`.
- La API local se conecta usando `DB_HOST=localhost` y el `DB_PORT` publicado.
- Los datos de PostgreSQL se guardan en el volumen `postgres_data`.

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
