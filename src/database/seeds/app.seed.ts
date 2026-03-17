// import { Factory, Seeder } from 'typeorm-seeding';
// import * as faker from 'faker';
// import { Role } from '../../modules/roles/entities/role.entity';
// import { User } from '../../modules/users/entities/user.entity';
// import { DataSource } from 'typeorm';

// export default class AppSeeder implements Seeder {
//   public async run(factory: Factory, connection: DataSource): Promise<any> {
//     const entities = [Role, User];

//     for (const singleEntity of entities) {
//       const repository = connection.getRepository(singleEntity);
//       await repository.query(
//         `TRUNCATE TABLE "${repository.metadata.tableName}" CASCADE;`,
//       );
//     }

//     await connection
//       .createQueryBuilder()
//       .insert()
//       .into(Role)
//       .values([
//         {
//           id: 'cbe9a461-8369-453e-a5be-29c403b03ed0',
//           name: 'Administrator',
//           description: 'Administrator Role',
//           slug: 'administrator',
//         },
//         {
//           id: '1b6d3b36-5158-4fc4-9cf7-edaf37714b00',
//           name: 'User',
//           description: 'User Role',
//           slug: 'user',
//         },
//       ])
//       .execute();

//     await connection
//       .createQueryBuilder()
//       .insert()
//       .into(User)
//       .values([
//         {
//           firstName: 'Admin',
//           lastName: 'Admin',
//           email: 'admin@example.com',
//           password:
//             '$2b$10$nAcoWCCNoPXuIgfOfJM86OK1GW9cEW6qhLKYkHC/bEffARLpdRZHC',
//           roleId: 'cbe9a461-8369-453e-a5be-29c403b03ed0',
//           phoneNumber: faker.phone.phoneNumber(),
//         },
//       ])
//       .execute();

//     // await connection
//     // .createQueryBuilder()
//     // .insert()
//     // .into()
//     // .values([

//     // ])
//     // .execute();
//   }
// }
