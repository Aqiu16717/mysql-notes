# 标签注册表 — mysql-notes

> **唯一权威来源。** 所有标签以此为基准。禁止同义词。  
> 维护者：@mns-archivist | 最后更新：2026-05-16

---

## 产品标签

| 标签 | 产品 | 范围 |
|---|---|---|
| `#mysql` | Oracle MySQL 上游 | MySQL 8.0/8.4/9.x（Oracle 官方） |
| `#aurora` | Amazon Aurora MySQL | Aurora 1.x/2.x/3.x |
| `#percona` | Percona Server / XtraDB Cluster | Percona 8.0.x |
| `#mariadb` | MariaDB Server | MariaDB 10.x/11.x |
| `#heatwave` | Oracle MySQL HeatWave | HeatWave on OCI/AWS |
| `#tidb` | PingCAP TiDB | TiDB 6.x/7.x/8.x |
| `#oceanbase` | 蚂蚁 OceanBase | OceanBase 4.x |
| `#frankenmysql` | 其他 MySQL 分支 | DoltDB、MyRocks 独立版等 |

**规则：**
- 纯 Oracle MySQL 上游笔记用 `#mysql`
- 跨产品笔记同时标多个产品标签

---

## 模块标签

| 标签 | 模块 | MySQL 源码路径 |
|---|---|---|
| `#innodb` | InnoDB 存储引擎 | `storage/innobase/` |
| `#binlog` | 二进制日志 | `sql/binlog.*`、`libbinlogevents/` |
| `#replication` | 复制（异步/半同步/MGR） | `sql/rpl_*`、`plugin/group_replication/` |
| `#optimizer` | 查询优化器 | `sql/sql_optimizer.*`、`sql/opt_*` |
| `#executor` | 查询执行器 | `sql/sql_executor.*`、`sql/iterators/` |
| `#parser` | SQL 解析器/词法 | `sql/sql_yacc.yy`、`sql/sql_lex.*` |
| `#dd` | 数据字典 | `sql/dd/` |
| `#ddl` | DDL 操作 | `sql/sql_table.*`、`sql/dd/` |
| `#server` | 服务器层通用（THD/连接/线程调度） | `sql/sql_*`（兜底） |

**规则：**
- 用最具体的模块标签。跨模块笔记标所有相关标签
- `#server` 用于 THD、连接处理、线程调度等无法归入其他模块的内容

---

## 类型标签

| 标签 | 类型 | 说明 | 主要生产者 |
|---|---|---|---|
| `#source-code` | 源码批注 | 带版本标签的源码阅读，含调用图 | @mns-reader |
| `#architecture` | 架构设计 | 模块设计、接口契约、边界分析 | @mysql-arch、@mns-comparator |
| `#paper` | 论文卡片 | SIGMOD/VLDB/OSDI 论文摘要 + 产品映射 | @mns-hunter |
| `#comparison` | 产品对比 | 跨产品功能矩阵、决策树 | @mns-comparator |
| `#tutorial` | 教程/报告 | 结构化长文，含目录和摘要 | @mns-scribe |
| `#learning-card` | 学习卡片 | 浓缩速查，"一张图看懂" | @mns-scribe |
| `#experiment` | 实验/基准 | 测试结果、性能数据 | @mysql-test、@mns-comparator |
| `#faq` | FAQ 条目 | 常见问题 + 简洁回答 | @mns-scribe |
| `#bulletin` | 情报简报 | 版本发布、CVE、周报 | @mns-scout |

**规则：**
- `#tutorial` = 逐步深入的教学内容（"从头学懂一个模块"）
- `#learning-card` = 浓缩速查卡片（"30 秒刷新记忆"）
- `#comparison` = 任何跨产品对比或选型指南
- `#paper` = 必须含 `paper:` 元数据块（venue、year、maturity、keywords）
- `#bulletin` = 难度固定为 `#beginner`（面向最广泛读者）

---

## 难度标签

| 标签 | 面向读者 | 预期 |
|---|---|---|
| `#beginner` | MySQL 新手 | 解释基础概念，假定具备通用计算机知识 |
| `#intermediate` | 熟悉 MySQL 的开发者 | 假定了解模块基础，深入讲解机制 |
| `#advanced` | MySQL 专家 | 探讨罕见边界情况、源码级细节、并发语义 |

**规则：** 难度反映**读者**水平，不是素材难度。论文卡片经 @mns-scribe 简化后可以标 `#beginner`。

---

## 论文卡片模板

```yaml
---
title: "论文标题 (年份)"
date: YYYY-MM-DD
tags: [#产品, #模块, #paper, #难度]
source: [论文 DOI / arXiv 链接]
paper:
  venue: SIGMOD | VLDB | OSDI | FAST | CIDR
  year: YYYY
  maturity: Research Prototype | Industrial Adoption | Widely Deployed
  keywords: 关键词1, 关键词2, 关键词3
product_mapping:
  aurora: adopted | partially | not adopted | N/A
  percona: adopted | partially | not adopted | N/A
  mysql_upstream: adopted | partially | not adopted | N/A
  mariadb: adopted | partially | not adopted | N/A
---
```

`maturity` 三档：
- **Research Prototype**：实验室原型，未进入产品
- **Industrial Adoption**：已被工业界采纳但未大规模部署
- **Widely Deployed**：已大规模生产部署（需有发布公告佐证）

---

## 标准 Front Matter

```yaml
---
title: "笔记标题"
date: YYYY-MM-DD
tags: [#产品, #模块, #类型, #难度]
source: [url1, url2]
version: "MySQL 9.6.0 / Aurora 3.04 / Percona 8.0.33"
author: "@你的handle"
---
```

---

## 禁止的同义词

| 禁用 | 应使用 | 原因 |
|---|---|---|
| `#inno-db` | `#innodb` | 规范拼写 |
| `#inno` | `#innodb` | 含义模糊 |
| `#bin-log` | `#binlog` | 规范拼写 |
| `#mgr` | `#replication` | MGR 属于复制模块 |
| `#aurora3` | `#aurora` + version 字段 | 版本号在 Front Matter 中，不在标签中 |
| `#percona8` | `#percona` + version 字段 | 同上 |
| `#beginner-level`、`#easy` | `#beginner` | 唯一规范难度标签 |
| `#expert` | `#advanced` | 同上 |
| `#article` | `#tutorial` 或 `#learning-card` | 要具体 |

---

## 标签验证清单

每篇笔记入库前检查：
1. [ ] 至少一个产品标签
2. [ ] 至少一个模块标签
3. [ ] 恰好一个类型标签
4. [ ] 恰好一个难度标签
5. [ ] 未使用禁用同义词
6. [ ] `source` 字段非空（URL 或引用）
7. [ ] `version` 字段存在且具体到小版本
