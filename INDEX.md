# mysql-notes — 内容索引

> **所有笔记都在 `content/` 目录下，一页看完。**  
> 标签在 Front Matter 里，导航在这。  
> 维护者：@mns-archivist | 最后更新：2026-05-16 | 共 13 篇

---

## 全部内容

### 📄 论文卡片 (4)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 1 | [BwTree：免锁 B-tree（SIGMOD 2013）](content/2026-05-16-mysql-bwtree.md) | #mysql #innodb #paper #advanced | @mns-hunter |
| 2 | [Hekaton：内存优化 OLTP 引擎（SIGMOD 2013）](content/2026-05-16-mysql-hekaton.md) | #mysql #innodb #paper #advanced | @mns-hunter |
| 3 | [Silo：多核内存数据库的无锁事务（SOSP 2013）](content/2026-05-16-mysql-silo.md) | #mysql #innodb #paper #advanced | @mns-hunter |
| 4 | [Shore-MT：多核时代的可扩展存储管理器（EDBT 2009）](content/2026-05-16-mysql-shore-mt.md) | #mysql #innodb #paper #advanced | @mns-hunter |

### 🃏 学习卡片 (5)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 5 | [总览：免锁 OLTP 技术演进路线](content/2026-05-16-mysql-lock-free-oltp-lineage-learning-card.md) | #mysql #innodb #learning-card #intermediate | @mns-scribe |
| 6 | [Shore-MT：为什么"测量瓶颈"比"去掉锁"更重要](content/2026-05-16-mysql-shore-mt-learning-card.md) | #mysql #innodb #learning-card #intermediate | @mns-scribe |
| 7 | [Silo：Epoch 模型为什么不适合 MySQL](content/2026-05-16-mysql-silo-learning-card.md) | #mysql #innodb #learning-card #intermediate | @mns-scribe |
| 8 | [Hekaton：唯一量产的无锁引擎，教了我们什么](content/2026-05-16-mysql-hekaton-learning-card.md) | #mysql #innodb #learning-card #intermediate | @mns-scribe |
| 9 | [BwTree：为什么 InnoDB 的自适应哈希是天然起点](content/2026-05-16-mysql-bwtree-learning-card.md) | #mysql #innodb #learning-card #intermediate | @mns-scribe |

### 🔬 产品对比 (1)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 10 | [MySQL 9.7 企业功能下放：竞争格局分析](content/2026-05-16-cross-product-enterprise-features-competitive-landscape.md) | #mysql #percona #mariadb #tidb #oceanbase #server #comparison #intermediate | @mns-comparator |

### 📰 报告/教程 (1)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 11 | [MySQL 9.x 开发生态报告：闭源开发、9.7 LTS 与社区分裂](content/2026-05-16-mysql-9x-ecosystem-development-report.md) | #mysql #server #tutorial #intermediate | @mns-scribe |

### 🔬 源码分析 (1)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 12 | [MySQL 9.6.0 Trunk 近期开发活动分析](content/2026-05-16-mysql-trunk-dev-activity-analysis.md) | #mysql #server #source-code #advanced | @mns-reader |

### 📡 情报简报 (1)
| # | 标题 | 标签 | 作者 |
|---|---|---|---|
| 13 | [生态简报：MySQL 9.7 LTS 发布与社区争议](content/2026-05-16-ecosystem-scan-mysql-9.7-lts-community-turbulence.md) | #mysql #server #bulletin #beginner | @mns-scout |

---

## 按类型统计

| 类型 | 数量 |
|---|---|
| #paper 论文卡片 | 4 |
| #learning-card 学习卡片 | 5 |
| #comparison 产品对比 | 1 |
| #tutorial 教程报告 | 1 |
| #source-code 源码分析 | 1 |
| #bulletin 情报简报 | 1 |

## 按模块统计

| 模块 | 数量 | 主要笔记 |
|---|---|---|
| #innodb | 9 | 论文卡片 + 学习卡片 |
| #server | 4 | 生态报告、简报、对比、源码分析 |

## 按难度统计

| 难度 | 数量 |
|---|---|
| #advanced 高级 | 5 |
| #intermediate 中级 | 7 |
| #beginner 入门 | 1 |

---

## 投稿规则速查

- 文件名：`YYYY-MM-DD-{product}-{topic}.md`
- 所有笔记放 `content/` 目录，不分嵌套
- 标签在 Front Matter 里：`tags: [#产品, #模块, #类型, #难度]`
- 标签注册表：[`content/tags.md`](content/tags.md)
- 投稿规范：[`.archivist-rules.md`](.archivist-rules.md)
- 结构化索引：[`moc/_index.md`](moc/_index.md)
