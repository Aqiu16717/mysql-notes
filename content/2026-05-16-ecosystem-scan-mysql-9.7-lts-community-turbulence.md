---
title: "生态简报：MySQL 9.7.0 LTS 发布与社区动荡"
date: 2026-05-16
tags: [#mysql, #server, #bulletin, #beginner]
source:
  - "https://dev.mysql.com/doc/relcontent/mysql/9.7/en/news-9-7-0.html"
  - "https://blogs.oracle.com/mysql/mysql-9-7-is-out-and-the-community-wins"
  - "https://planet.mysql.com/?tag_search=25057"
  - "https://blogs.oracle.com/mysql/strengthening-the-mysql-community-highlights-from-our-third-public-discussion"
version: "MySQL 9.7.0 LTS (2026-04-21) / MySQL 9.6.0 trunk (local)"
author: "@mns-scout"
bulletin_type: "生态周报"
---

## MySQL 9.7.0 LTS 发布（2026-04-21）

MySQL 9.7.0 于 2026 年 4 月 21 日正式 GA，是自 MySQL 8.4 之后的首个主要 LTS 版本（5 年 Premier + 3 年 Extended，支持至约 2032 年）。同日 MySQL 8.0.46 作为 8.0 系列最终版发布，8.0 正式 EOL。

### 8 项企业功能下放社区版

| 功能领域 | 下放内容 | 原锁定范围 |
|---|---|---|
| 查询优化 | Hypergraph Optimizer（DPhyp bushy tree） | Enterprise/HeatWave |
| 应用开发 | JSON Duality Views 完整 DML（INSERT/UPDATE/DELETE） | 原仅 DDL |
| 可观测性 | OpenTelemetry 遥测（logs/metrics/traces via OTLP） | Enterprise |
| 复制监控 | 复制应用器指标、GR 流控统计、多线程复制吞吐量 | Enterprise |
| 高可用 | 自动驱逐与重加入（auto-eviction & rejoin） | Enterprise |
| 高可用 | Up-to-date Aware 主节点选举 | Enterprise |
| 安全 | PBKDF2 + SHA-512 密码存储 | Enterprise |
| 安全 | 动态数据遮蔽（Dynamic Data Masking） | Enterprise |

### Hypergraph Optimizer

- 传统优化器：左深树，多表 JOIN 枚举空间有限
- Hypergraph：超图建模，DPhyp bushy tree 枚举，NL join vs hash join 基于成本抉择
- 默认关闭，hint 支持不完整 — 建议灰度先测
- 启用：`SET optimizer_switch='hypergraph_optimizer=on'`

### 安全变更

- `mysql_native_password` 彻底移除 — 全部强制 `caching_sha2_password`
- PBKDF2 抗暴力破解增强（默认 10,000 rounds）
- OpenID Connect 支持（9.1 引入）

---

## 社区争议（2025 Q3 – 2026 Q1）

### 公开开发关闭
- GitHub `mysql/mysql-server` trunk 自 2025-12-23 后零 commit（确认：~5 个月无新提交）
- 本地 `git fetch` 确认：无新数据
- 9.7 LTS 开发完全闭门进行

### 工程团队缩减
- Percona 创始人 Peter Zaitsev 估计：MySQL 工程团队缩减 60–70%（2025 年 9 月）
- 影响范围覆盖 optimizer、InnoDB、replication 等核心模块

### 社区公开信
- 500+ 开发者联名要求建立厂商中立的 MySQL 基金会（Oracle 拒绝）
- 248 名数据库工程师（来自 Percona、MariaDB、PlanetScale、DigitalOcean、Pinterest 等）在 2026 年 2 月发表公开信，称 MySQL 为"遗产技术"

### Oracle 回应（2026 年 4 月）
- 宣布"新时代"：更多功能开放、改善路线图透明度、重新考虑基金会模式
- MySQL 9.7 LTS 在 OSC 2026 Nagoya（日本，4 月 29 日）展示

### Innovation Release 采纳率低迷
- Percona PMM 遥测：Innovation Releases 采纳率仅 ~1%
- Percona 跳过全部 7 个 Innovation Release（9.0→9.6），直接从 8.0 跳 9.7 LTS

---

## MySQL 9.x 版本时间线

| 版本 | 发布日期 | 类型 |
|---|---|---|
| 9.0.1 | 2024-07 | Innovation |
| 9.1.0 | 2024-10 | Innovation |
| 9.2.0 | 2025-01 | Innovation |
| 9.3.0 | 2025-04 | Innovation |
| 9.4.0 | 2025-07 | Innovation |
| 9.5.0 | 2025-10 | Innovation |
| 9.6.0 | 2026-01 | Innovation |
| 9.7.0 LTS | 2026-04-21 | 首个 9.x LTS |

---

## VECTOR / AI 现状

- `VECTOR` 数据类型和 HNSW 索引已在 9.0 引入
- `DISTANCE()` 函数仍锁定在 HeatWave on OCI — Community Edition 可存向量但不能做相似度搜索
- 本地 trunk 可见 HeatWave 相关 WL：WL#16849（vector store load）、WL#16859（GenAI）

---

## 本地代码变更关联（2025-12 最后活跃窗口）

来自 @mns-reader 和 @mns-comparator 的分析：

| 主题 | 投入 | 关键项 |
|---|---|---|
| GTID 库重写 (WL#16076) | 39 commits (29%) | `libs/mysql/` 全新库体系 |
| Lakehouse/Parquet | 4+ WLs | 文件数据放置、nested types、load validation |
| Audit Log + OTEL | 3 WLs | 组件化 (WL#12716)、OTEL 日志 (WL#17167) |
| FK Cascading (WL#11249) | 从引擎层提升到 SQL 层 | 解决 20+ 年 binlog 一致性问题 |
| InnoDB | 6 commits | 全部 bugfix，零架构变更 |

---

## 影响评估

1. **8.0 EOL 强制迁移窗口** — 但 Innovation Release 采纳率仅 1%，9.7 LTS 是真正起跑线
2. **Hypergraph Optimizer 进社区** — 实质利好，但需灰度验证
3. **VECTOR 锁定** — 目前最大社区痛点之一，直接推动用户评估 pgvector/TiDB/MariaDB 替代
4. **闭源开发模式** — 持续侵蚀社区信任，利好 Percona/MariaDB 生态
5. **对 mysql-notes 项目** — 9.7 LTS 将是未来所有分析的目标版本基线
