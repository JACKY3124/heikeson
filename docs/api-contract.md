# API 接口契约文档

> 本文档定义前后端交互的接口规范，双方必须严格遵守。接口一旦确定，不允许随意修改。如需变更，必须经过双方确认并更新文档。

## 基础配置

- **基础路径**: `/api`
- **请求格式**: `application/json`
- **响应格式**: `application/json`
- **统一响应结构**:
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 一、认证模块（Auth）

### 1. 用户注册

| 属性 | 值 |
|------|------|
| **路径** | `/api/auth/register` |
| **方法** | `POST` |

**请求体**:
```json
{
  "username": "string (必填，长度3-20)",
  "password": "string (必填，长度6-20)",
  "nickname": "string (选填)",
  "email": "string (选填，邮箱格式)"
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "jacky",
    "nickname": "Jacky",
    "role": "player",
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

**失败响应** (400):
```json
{
  "code": 400,
  "message": "用户名已存在",
  "data": null
}
```

### 2. 用户登录

| 属性 | 值 |
|------|------|
| **路径** | `/api/auth/login` |
| **方法** | `POST` |

**请求体**:
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "jacky",
    "nickname": "Jacky",
    "role": "player",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. 获取当前用户信息

| 属性 | 值 |
|------|------|
| **路径** | `/api/auth/me` |
| **方法** | `GET` |
| **Header** | `Authorization: Bearer {token}` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "jacky",
    "nickname": "Jacky",
    "role": "player",
    "email": "2493027871@qq.com"
  }
}
```

## 二、赛事模块（Competition）

### 赛事状态机说明

| 状态 | 说明 | 用户操作 |
|------|------|----------|
| `draft` | 草稿状态 | 不可报名，不可提交作品 |
| `registration_open` | 报名期 | 可报名，不可提交作品 |
| `registration_closed` | 报名截止 | 不可报名，不可提交作品 |
| `competition_running` | 比赛进行中 | 不可报名，可提交作品（仅审核通过者） |
| `judging` | 评审期 | 不可报名，不可提交作品 |
| `results_announced` | 结果公布 | 不可报名，不可提交作品 |

### 1. 获取赛事列表

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions` |
| **方法** | `GET` |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | `draft/registration_open/registration_closed/competition_running/judging/results_announced` |
| `page` | int | 否 | 页码，默认1 |
| `size` | int | 否 | 每页数量，默认10 |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "2024年度黑客松大赛",
        "description": "比赛描述...",
        "competitionType": "team",
        "status": "registration_open",
        "startTime": "2024-01-15 09:00:00",
        "endTime": "2024-01-20 18:00:00",
        "registrationOpenTime": "2024-01-01 09:00:00",
        "registrationDeadline": "2024-01-10 23:59:59",
        "minTeamSize": 1,
        "maxTeamSize": 5,
        "currentParticipants": 120,
        "maxParticipants": 500,
        "isVirtual": false,
        "location": "北京市海淀区"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
```

### 2. 获取赛事详情

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}` |
| **方法** | `GET` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "2024年度黑客松大赛",
    "description": "比赛描述...",
    "competitionType": "team",
    "status": "registration_open",
    "startTime": "2024-01-15 09:00:00",
    "endTime": "2024-01-20 18:00:00",
    "registrationOpenTime": "2024-01-01 09:00:00",
    "registrationDeadline": "2024-01-10 23:59:59",
    "minTeamSize": 1,
    "maxTeamSize": 5,
    "currentParticipants": 120,
    "maxParticipants": 500,
    "isVirtual": false,
    "location": "北京市海淀区",
    "scoreDimensions": [
      {"id": 1, "name": "创新性", "weight": 0.3, "maxScore": 100},
      {"id": 2, "name": "技术难度", "weight": 0.3, "maxScore": 100},
      {"id": 3, "name": "完成度", "weight": 0.4, "maxScore": 100}
    ],
    "rules": ["规则1", "规则2", "规则3"],
    "prizes": [
      {"rank": 1, "description": "一等奖", "amount": 50000},
      {"rank": 2, "description": "二等奖", "amount": 30000},
      {"rank": 3, "description": "三等奖", "amount": 10000}
    ],
    "organizers": ["主办方1", "主办方2"],
    "categories": ["人工智能", "Web开发"]
  }
}
```

## 三、报名模块（Registration）

### 报名状态说明

| 状态 | 说明 | 可提交作品 |
|------|------|------------|
| `not_registered` | 未报名 | 否 |
| `pending` | 待审核 | 否 |
| `approved` | 已通过 | 是 |
| `rejected` | 已拒绝 | 否 |
| `withdrawn` | 已退赛 | 否 |

### 1. 报名赛事

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/register` |
| **方法** | `POST` |
| **Header** | `Authorization: Bearer {token}` |

**请求体**:
```json
{
  "teamName": "string (团队赛必填，个人赛可选)",
  "region": "string (必填，赛区)",
  "captainName": "string (必填，队长姓名)",
  "captainPhone": "string (必填，队长电话)",
  "captainEmail": "string (必填，队长邮箱)",
  "members": [
    {
      "fullName": "string (必填)",
      "phone": "string (必填)",
      "email": "string (必填)"
    }
  ],
  "agreeIP": true,
  "agreeParticipation": true
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "报名提交成功，等待审核",
  "data": {
    "id": 1,
    "competitionId": 1,
    "userId": 1,
    "teamId": 1,
    "status": "pending",
    "registeredAt": "2024-01-05 10:00:00"
  }
}
```

**失败响应** (400):
```json
{
  "code": 400,
  "message": "报名已截止",
  "data": null
}
```

### 2. 获取报名状态

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/registration/status` |
| **方法** | `GET` |
| **Header** | `Authorization: Bearer {token}` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "approved",
    "team": {
      "id": 1,
      "name": "梦之队",
      "region": "south",
      "members": [
        {"id": 1, "username": "jacky", "name": "Jacky", "role": "captain"},
        {"id": 2, "username": "tom", "name": "Tom", "role": "member"}
      ]
    },
    "captainName": "Jacky",
    "captainPhone": "13800138000",
    "captainEmail": "jacky@example.com",
    "registeredAt": "2024-01-05 10:00:00",
    "reviewedAt": "2024-01-06 10:00:00",
    "reviewComment": "审核通过"
  }
}
```

### 3. 退赛

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/registration/withdraw` |
| **方法** | `POST` |
| **Header** | `Authorization: Bearer {token}` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "退赛成功",
  "data": null
}
```

## 四、作品提交模块（Submission）

### 1. 提交作品

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/submissions` |
| **方法** | `POST` |
| **Header** | `Authorization: Bearer {token}` |

**请求体**:
```json
{
  "title": "string (必填，作品名称)",
  "description": "string (选填，作品描述)",
  "fileUrl": "string (必填，文件URL)",
  "fileSize": 1024,
  "isDraft": false
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "提交成功",
  "data": {
    "id": 1,
    "title": "智能助手",
    "description": "作品描述...",
    "fileUrl": "/uploads/xxx.zip",
    "fileSize": 1024,
    "status": "pending",
    "submittedAt": "2024-01-18 15:00:00"
  }
}
```

### 2. 获取我的提交列表

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/submissions` |
| **方法** | `GET` |
| **Header** | `Authorization: Bearer {token}` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "智能助手",
      "description": "作品描述...",
      "status": "pending",
      "submittedAt": "2024-01-18 15:00:00"
    }
  ]
}
```

## 五、评分模块（Scoring）

### 1. 获取作品评分

| 属性 | 值 |
|------|------|
| **路径** | `/api/submissions/{id}/scores` |
| **方法** | `GET` |
| **Header** | `Authorization: Bearer {token}` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "submissionId": 1,
    "aiScore": 85,
    "expertScore": 88,
    "totalScore": 86.5,
    "aiDetails": [
      {"dimension": "创新性", "score": 80},
      {"dimension": "技术难度", "score": 85},
      {"dimension": "完成度", "score": 90}
    ],
    "expertDetails": [
      {"dimension": "创新性", "score": 85, "comment": "创意不错"},
      {"dimension": "技术难度", "score": 90, "comment": "技术实现较好"},
      {"dimension": "完成度", "score": 89, "comment": "功能完整"}
    ]
  }
}
```

## 六、排名模块（Ranking）

### 1. 获取排行榜

| 属性 | 值 |
|------|------|
| **路径** | `/api/competitions/{id}/rankings` |
| **方法** | `GET` |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | `individual/team`，默认根据赛事类型 |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "rank": 1,
      "teamName": "梦之队",
      "members": ["jacky", "tom"],
      "totalScore": 95,
      "aiScore": 94,
      "expertScore": 96
    },
    {
      "rank": 2,
      "teamName": "挑战者队",
      "members": ["alice", "bob"],
      "totalScore": 92,
      "aiScore": 90,
      "expertScore": 94
    }
  ]
}
```

## 七、评论模块（Comment）

### 1. 获取评论列表

| 属性 | 值 |
|------|------|
| **路径** | `/api/submissions/{id}/comments` |
| **方法** | `GET` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "content": "这个作品很棒！",
      "user": {"id": 2, "username": "tom", "nickname": "Tom"},
      "createdAt": "2024-01-19 10:00:00",
      "likes": 5,
      "replies": [
        {"id": 2, "content": "同意！", "user": {...}}
      ]
    }
  ]
}
```

### 2. 发表评论

| 属性 | 值 |
|------|------|
| **路径** | `/api/submissions/{id}/comments` |
| **方法** | `POST` |
| **Header** | `Authorization: Bearer {token}` |

**请求体**:
```json
{
  "content": "string (必填)",
  "parentId": 1 (选填，回复评论时使用)
}
```

## 八、公告模块（Announcement）

### 1. 获取公告列表

| 属性 | 值 |
|------|------|
| **路径** | `/api/announcements` |
| **方法** | `GET` |

**成功响应** (200):
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "比赛时间调整通知",
      "content": "比赛时间调整为...",
      "priority": "high",
      "createdAt": "2024-01-01 10:00:00"
    }
  ]
}
```

---

## 接口变更流程

1. 如需修改接口，在文档中标记为 **"待确认"**
2. 前后端负责人确认后，更新文档版本号
3. 双方按新版本开发，旧接口保留至少一个版本周期

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2024-07-07 | 初始版本，包含基础认证、赛事、报名、提交、评分、排名、评论、公告接口 |