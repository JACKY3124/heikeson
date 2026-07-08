# Hackathon Backend

按项目框架图生成的 Spring Boot 后端工程。

## 技术栈

- Spring Boot 3.3.0
- Java 17
- Spring Data JPA
- Spring Security + JWT
- MySQL
- Lombok
- Maven

## 目录结构

```
backend/
├── pom.xml
└── src/main/
    ├── java/com/hackathon/
    │   ├── HackathonApplication.java
    │   ├── config/          # 配置类
    │   ├── controller/      # 控制层
    │   │   ├── auth/        # 认证相关
    │   │   ├── competition/ # 赛事相关
    │   │   ├── registration/# 报名相关
    │   │   ├── submission/  # 作品提交相关
    │   │   └── scoring/     # 打分相关
    │   ├── service/         # 服务层
    │   │   ├── auth/
    │   │   ├── competition/
    │   │   ├── registration/
    │   │   ├── submission/
    │   │   └── scoring/
    │   ├── repository/      # 数据访问层
    │   ├── entity/          # 实体类
    │   ├── dto/             # 数据传输对象
    │   └── exception/       # 异常处理
    └── resources/
        └── application.properties
```

## 运行前配置

编辑 `src/main/resources/application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hackathon
spring.datasource.username=你的用户名
spring.datasource.password=你的密码
```

确保本地 MySQL 已创建数据库 `hackathon`。

## 运行

```bash
cd backend
mvn spring-boot:run
```

## 默认 API 前缀

所有接口以 `/api` 开头，例如：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/competitions`
- `POST /api/competitions`
- `POST /api/registrations`
- `POST /api/submissions`
- `POST /api/scores`
