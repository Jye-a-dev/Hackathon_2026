# NestJS Server Template

## Clone repo này

```bash
git clone https://github.com/Jye-a-dev/template_nest_server.git
```

Template khởi tạo cho backend API theo hướng module rõ ràng, dùng:

- Node.js
- NestJS
- TypeScript
- Jest
- ESLint
- Prettier
- Cấu trúc module theo controller/service/repository
- Placeholder cho Swagger/OpenAPI
- Placeholder cho PostgreSQL provider

Template này phù hợp khi bạn muốn bắt đầu nhanh với một REST API server theo style NestJS, nhưng vẫn giữ cấu trúc thư mục đủ rõ để scale tiếp khi dự án lớn hơn.

## 1. Project này đang setup theo kiểu nào?

Repo hiện tại là kiểu:

`Node.js + NestJS + TypeScript + Jest`

Đây là setup phù hợp cho:

- REST API backend
- Backend cho React/Vue/Next client riêng
- Admin API
- Service nhỏ hoặc vừa
- Dự án cần module system rõ từ đầu
- Team muốn thống nhất format controller, service, DTO, entity, repository
- Dự án có khả năng mở rộng thêm Swagger, database, auth, guard, interceptor

Hiện tại repo vẫn là NestJS starter nhẹ. Một số file như `database`, `swagger`, `config`, `validators` đang là placeholder để bạn triển khai tiếp theo nhu cầu thật của dự án.

## 2. Khi nào nên dùng từng kiểu setup Node backend?

### Node.js + Express + JavaScript

Dùng khi:

- muốn làm nhanh
- API nhỏ
- chưa cần TypeScript
- dự án prototype hoặc demo ngắn hạn

Cài cơ bản:

```bash
npm init -y
npm install express dotenv cors
```

### Node.js + Express + TypeScript

Dùng khi:

- muốn code an toàn hơn
- project có nhiều request/response type
- team làm việc lâu dài
- cần bắt lỗi sớm bằng typecheck

Cài thêm TypeScript:

```bash
npm install express dotenv cors
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
```

### Node.js + Express + TypeScript + Swagger + Zod

Dùng khi:

- muốn framework nhẹ
- cần validate request body/query/params
- muốn tự kiểm soát route/controller/service
- không cần dependency injection hoặc module system mạnh

Kiểu này hợp với API nhỏ hoặc vừa, nơi team muốn ít convention hơn NestJS.

### NestJS

Đây là kiểu setup của repo này.

Nên dùng NestJS khi bạn cần:

- framework opinionated hơn
- dependency injection rõ ràng
- decorator-based architecture
- module system lớn, chuẩn enterprise
- controller/service/provider tách bạch
- guard, pipe, interceptor, filter theo chuẩn Nest
- team muốn một kiến trúc thống nhất ngay từ đầu

Nếu bạn chỉ cần một server demo rất nhỏ, có thể không cần NestJS. Nhưng nếu dự án có khả năng lớn dần, NestJS giúp giữ cấu trúc ổn định hơn.

## 3. Cài và chạy project

### Yêu cầu

- Node.js 20+
- npm 10+

### Cài dependency

```bash
npm install
```

### Chạy môi trường dev

```bash
npm run start:dev
```

### Chạy bình thường

```bash
npm run start
```

### Build production

```bash
npm run build
```

### Chạy bản build

```bash
npm run start:prod
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

### Test

```bash
npm run test
```

### Test e2e

```bash
npm run test:e2e
```

### Test coverage

```bash
npm run test:cov
```

## 4. URL mặc định

Sau khi chạy dev server:

- Server root: `http://localhost:3000`

Port mặc định đang lấy từ:

```ts
process.env.PORT ?? 3000
```

trong file:

```text
src/main.ts
```

Hiện repo chưa mount API prefix hoặc Swagger UI thật. Các folder `swagger` và `config` đang là nơi để setup phần này sau.

## 5. Cấu trúc thư mục hiện tại

```text
src/
├─ @types/
│  ├─ @types.md
│  └─ index.d.ts
├─ common/
│  ├─ common.md
│  ├─ filters/
│  │  └─ filters.md
│  ├─ guards/
│  │  └─ guards.md
│  ├─ interceptors/
│  │  └─ interceptors.md
│  ├─ middlewares/
│  │  └─ middlewares.md
│  └─ pipes/
│     └─ pipes.md
├─ config/
│  ├─ config.md
│  ├─ app.config.ts
│  └─ env.config.ts
├─ constants/
│  ├─ constants.md
│  └─ app.constant.ts
├─ database/
│  ├─ database.md
│  ├─ database.module.ts
│  └─ pg.provider.ts
├─ modules/
│  ├─ modules.md
│  ├─ users/
│  │  └─ users.md
│  └─ template_modules/
│     ├─ template_modules.md
│     ├─ template-modules.controller.ts
│     ├─ template-modules.service.ts
│     ├─ template-modules.module.ts
│     ├─ template-modules.swagger.ts
│     ├─ dto/
│     │  ├─ dto.md
│     │  ├─ create-template-module.dto.ts
│     │  ├─ update-template-module.dto.ts
│     │  └─ query-template-module.dto.ts
│     ├─ entities/
│     │  ├─ entities.md
│     │  └─ template-module.entity.ts
│     ├─ interfaces/
│     │  ├─ interfaces.md
│     │  └─ template-module.interface.ts
│     └─ repositories/
│        ├─ repositories.md
│        └─ template-modules.repository.ts
├─ swagger/
│  ├─ swagger.md
│  └─ swagger.config.ts
├─ utils/
│  ├─ utils.md
│  └─ response.util.ts
├─ validators/
│  ├─ validators.md
│  └─ uuid.validator.ts
├─ src.md
├─ app.controller.spec.ts
├─ app.controller.ts
├─ app.module.ts
├─ app.service.ts
└─ main.ts
```

Ý nghĩa chính:

- `@types/`: khai báo type global hoặc module augmentation
- `common/`: filter, guard, interceptor, middleware, pipe dùng chung
- `config/`: cấu hình app và env
- `constants/`: hằng số dùng chung
- `database/`: module/provider database
- `modules/`: nơi đặt các module nghiệp vụ
- `modules/template_modules/`: module mẫu để copy khi tạo feature mới
- `modules/users/`: nơi dành cho module users
- `swagger/`: cấu hình Swagger/OpenAPI
- `utils/`: helper dùng chung
- `validators/`: validator dùng chung
- `main.ts`: entry bootstrap Nest app
- `app.module.ts`: root module của app

## 6. Luồng chạy hiện tại của app

Luồng cơ bản:

1. `src/main.ts` import `AppModule`
2. `NestFactory.create(AppModule)` tạo Nest application
3. `AppModule` đăng ký controller và provider cấp app
4. Nest nhận request qua platform Express mặc định
5. Request đi vào controller tương ứng
6. Controller gọi service
7. Service xử lý business logic
8. App listen tại `process.env.PORT` hoặc `3000`

Tóm tắt:

```text
main.ts
-> app.module.ts
-> module.module.ts
-> module.controller.ts
-> module.service.ts
-> module.repository.ts
```

## 7. Cách tạo một module mới theo style của repo này

Mỗi module nên có cấu trúc:

```text
src/modules/products/
├─ dto/
│  ├─ create-product.dto.ts
│  ├─ update-product.dto.ts
│  └─ query-product.dto.ts
├─ entities/
│  └─ product.entity.ts
├─ interfaces/
│  └─ product.interface.ts
├─ repositories/
│  └─ products.repository.ts
├─ products.controller.ts
├─ products.service.ts
├─ products.module.ts
└─ products.swagger.ts
```

Ý nghĩa từng phần:

- `dto`: định nghĩa shape dữ liệu request
- `entities`: định nghĩa model dữ liệu lưu trữ
- `interfaces`: định nghĩa TypeScript contract dùng chung
- `repositories`: xử lý truy xuất dữ liệu
- `controller`: nhận request, gọi service, trả response
- `service`: business logic chính của module
- `module`: đăng ký controller/provider/import/export với Nest
- `swagger`: metadata tài liệu API cho module

Có thể copy folder:

```text
src/modules/template_modules
```

Sau đó đổi tên folder và prefix file theo module thật.

Ví dụ:

```text
template-modules.controller.ts
-> products.controller.ts
```

## 8. Quy tắc đặt tên đang dùng

### Folder

Repo hiện tại đang dùng:

- `snake_case` cho folder module mẫu: `template_modules`
- tên ngắn, rõ nghĩa cho folder core: `common`, `config`, `database`, `modules`

Nếu tên module có nhiều từ, nên dùng `snake_case` cho folder:

- `template_modules`
- `user_profiles`
- `order_items`

### File trong module

Dùng format kebab-case theo feature:

```text
module-name.controller.ts
module-name.service.ts
module-name.module.ts
module-name.swagger.ts
```

Ví dụ:

```text
products.controller.ts
products.service.ts
products.module.ts
products.swagger.ts
```

### DTO

Dùng format:

```text
create-module-name.dto.ts
update-module-name.dto.ts
query-module-name.dto.ts
```

Ví dụ:

```text
create-product.dto.ts
update-product.dto.ts
query-product.dto.ts
```

### Entity, interface, repository

Dùng format:

```text
product.entity.ts
product.interface.ts
products.repository.ts
```

Repository thường dùng danh từ số nhiều vì xử lý collection dữ liệu.

## 9. Swagger trong repo này

Repo hiện có placeholder:

```text
src/swagger/swagger.config.ts
src/modules/template_modules/template-modules.swagger.ts
```

Mục tiêu:

- tách metadata Swagger khỏi controller
- giữ controller gọn hơn
- chuẩn hóa tài liệu API theo từng module

Hiện tại project chưa cài package Swagger. Khi cần bật Swagger thật, có thể cài:

```bash
npm install @nestjs/swagger swagger-ui-express
```

Sau đó setup trong `src/main.ts`, ví dụ:

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('NestJS Server Template API')
  .setDescription('NestJS TypeScript API template')
  .setVersion('1.0.0')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Docs sau đó có thể chạy tại:

```text
http://localhost:3000/docs
```

## 10. Env trong repo này

Hiện tại app đọc trực tiếp:

```text
process.env.PORT
```

trong `src/main.ts`.

Repo có placeholder:

```text
src/config/env.config.ts
src/config/app.config.ts
```

Khi cần quản lý env rõ hơn, có thể thêm:

```bash
npm install @nestjs/config
```

Ví dụ file `.env` sau này:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

SWAGGER_ROUTE=/docs
SWAGGER_TITLE=NestJS Server Template API
SWAGGER_VERSION=1.0.0
SWAGGER_DESCRIPTION=NestJS TypeScript API template

DATABASE_URL=postgres://postgres:postgres@localhost:5432/nest_server_template
```

Ý nghĩa:

- `NODE_ENV`: môi trường chạy app
- `PORT`: port server
- `API_PREFIX`: prefix chung cho API nếu có bật global prefix
- `SWAGGER_ROUTE`: đường dẫn Swagger UI
- `SWAGGER_TITLE`: tên hiển thị trong Swagger
- `SWAGGER_VERSION`: version API
- `SWAGGER_DESCRIPTION`: mô tả API
- `DATABASE_URL`: connection string database nếu dùng PostgreSQL

## 11. Validation trong repo này

NestJS thường validate request bằng:

- DTO
- `class-validator`
- `class-transformer`
- `ValidationPipe`

Hiện repo đã có chỗ đặt DTO:

```text
src/modules/template_modules/dto/
```

và validator dùng chung:

```text
src/validators/
```

Khi cần bật validation thật, có thể cài:

```bash
npm install class-validator class-transformer
```

Sau đó setup global pipe trong `src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);
```

Controller không nên tự validate thủ công nếu DTO và pipe đã xử lý được.

## 12. Error handling trong repo này

NestJS có cơ chế exception mặc định và hỗ trợ custom exception filter.

Repo hiện đã có folder:

```text
src/common/filters/
```

Mục tiêu khi triển khai filter:

- response lỗi thống nhất
- format lỗi dễ đọc
- tách xử lý lỗi khỏi controller/service
- gom logging hoặc mapping exception vào một nơi

Khi module có lỗi nghiệp vụ, service nên throw exception phù hợp như:

```text
BadRequestException
NotFoundException
UnauthorizedException
ForbiddenException
```

## 13. Database trong repo này

Repo hiện có placeholder:

```text
src/database/database.module.ts
src/database/pg.provider.ts
```

Mục tiêu:

- gom setup database vào một module riêng
- cung cấp provider để inject vào repository/service
- tránh để logic kết nối database rải rác trong controller hoặc service

Hiện project chưa cài package `pg`. Khi cần dùng PostgreSQL, có thể cài:

```bash
npm install pg
npm install -D @types/pg
```

Nếu dùng ORM như Prisma, Drizzle, TypeORM hoặc Sequelize, có thể thay phần `database` theo ORM đó.

## 14. Quy tắc tổ chức code nên giữ

- Controller chỉ nên nhận request, gọi service, trả response
- Service chứa business logic
- Repository chứa logic truy xuất dữ liệu
- DTO định nghĩa dữ liệu request
- Entity định nghĩa dữ liệu lưu trữ
- Interface/type định nghĩa contract dùng chung
- Swagger metadata nên tách khỏi controller nếu controller bắt đầu dài
- Utils nên là helper tổng quát, không phụ thuộc module cụ thể
- Config nên tập trung trong `src/config`
- Không nên nhồi business logic vào `main.ts` hoặc `app.module.ts`

## 15. Cách scale project khi API lớn hơn

Khi app tăng độ phức tạp, có thể mở rộng thêm:

- `auth/`
- `roles/`
- `permissions/`
- `repositories/`
- `schemas/`
- `jobs/`
- `queues/`
- `emails/`
- `storage/`
- `cache/`
- `logger/`
- `tests/`

Ví dụ:

```text
src/
├─ common/
├─ config/
├─ database/
├─ modules/
│  ├─ auth/
│  ├─ users/
│  ├─ products/
│  └─ orders/
├─ swagger/
├─ utils/
└─ validators/
```

Nếu team đi theo feature-based architecture, có thể giữ DTO, entity, interface, repository, controller, service trong từng module như template hiện tại.

## 16. Khi nào nên tách repository?

Nên tách repository khi:

- service bắt đầu có nhiều query database
- nhiều service dùng chung một cách truy xuất dữ liệu
- muốn test business logic dễ hơn
- muốn đổi database/ORM ít ảnh hưởng service
- muốn controller/service không phụ thuộc trực tiếp vào query raw

Ví dụ:

```text
src/modules/products/repositories/products.repository.ts
```

Không cần tách quá sớm nếu module vẫn rất nhỏ.

## 17. Checklist khi tạo API project mới

- clone repo
- cài dependency
- đổi tên project trong `package.json`
- kiểm tra `PORT`
- tạo module mới từ `template_modules`
- import module mới vào `AppModule`
- viết DTO trước khi viết controller
- giữ business logic trong service
- tách truy xuất dữ liệu vào repository khi bắt đầu có database
- chạy lint/build/test trước khi commit

## 18. Gợi ý hướng phát triển tiếp cho template này

Nếu muốn biến template này thành base mạnh hơn, có thể thêm:

- `@nestjs/config`
- Swagger thật bằng `@nestjs/swagger`
- global validation pipe
- auth flow
- JWT strategy
- refresh token
- role/permission guard
- request logger interceptor
- centralized exception filter
- PostgreSQL provider hoàn chỉnh
- Prisma hoặc Drizzle
- migration setup
- Dockerfile
- Docker Compose cho database
- CI check build/lint/test
- rate limit
- security headers bằng Helmet
- API response format chuẩn hóa

## 19. Tóm tắt

Nếu bạn muốn một setup backend cân bằng giữa:

- dễ bắt đầu
- dễ đọc
- dễ scale
- có kiến trúc module rõ
- có dependency injection
- dễ mở rộng Swagger/database/auth sau này

thì `Node.js + NestJS + TypeScript` là lựa chọn rất thực dụng.

Template này đang đi theo hướng đó:

- entry rõ
- root module rõ
- common layer rõ
- module mẫu rõ
- folder có tài liệu song ngữ
- dễ copy module để phát triển tiếp

---
