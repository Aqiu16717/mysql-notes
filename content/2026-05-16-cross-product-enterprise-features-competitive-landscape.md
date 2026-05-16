---
title: "MySQL 9.7 企业功能下放后竞争格局分析：社区版 vs Percona/MariaDB/TiDB/OceanBase"
date: 2026-05-16
tags: [#mysql, #percona, #mariadb, #tidb, #oceanbase, #server, #comparison, #intermediate]
source:
  - type: bulletin
    ref: "@mns-scout: MySQL 社区动态扫描 (2026-05-16)"
  - type: tutorial
    ref: "@mns-scribe: MySQL 9.x 开发生态报告 (2026-05-16)"
  - url: "https://docs.percona.com/percona-server/8.4/feature-comparison.html"
  - url: "https://blogs.oracle.com/mysql/mysql-9-7-is-out-and-the-community-wins"
  - url: "https://mariadb.com/docs/release-content/community-server/old-releases/11.7/what-is-mariadb-117"
  - url: "https://docs.pingcap.com/tidb/stable"
  - url: "https://en.oceanbase.com/docs/common-oceanbase-database-10000000001784944"
version: "MySQL 9.7.0 LTS / Percona Server 8.4 / MariaDB 11.8 LTS / TiDB 8.1 / OceanBase 4.3.3"
author: "@mns-comparator"
---

# MySQL 9.7 企业功能下放后竞争格局分析：社区版 vs Percona/MariaDB/TiDB/OceanBase

> **一句话结论：** MySQL 9.7 LTS 将 8 项企业功能下放社区版，显著缩小了与 Percona Server 的差距，但对 MariaDB/TiDB/OceanBase 的独特优势（分布式、HTAP、免费向量索引）影响有限。

---

## 1. 功能矩阵：MySQL 9.7 下放的 8 项功能 vs 各竞品

| 下放功能 | MySQL 9.7 CE | Percona 8.4 | MariaDB 11.8 LTS | TiDB 8.1 | OceanBase 4.3 CE |
|---|---|---|---|---|---|
| **Hypergraph 超图优化器** | ✅ 默认开启 | ✅ 继承自上游，非默认 | ❌ 自研优化器 | ❌ Cascades 优化器 | ❌ 自研优化器 |
| **JSON Duality 视图 DML** | ✅ 完整增删改查 | ❌ 无此功能 | ❌ 无此功能 | ❌ 无此功能 | ❌ 无此功能 |
| **OpenTelemetry 可观测性** | ✅ OTLP 原生支持 | ⚠️ 仅 PMM 间接支持，无原生 OTel 追踪插件 | ❌ 无原生 OTel | ✅ CNCF 体系原生支持 | ❌ 无 |
| **复制监控指标** | ✅ Applier 指标 + 流控统计 | ✅ 扩展计数器(853 vs MySQL 434)，仍然领先 | ✅ 自有复制指标 | ✅ 原生分布式追踪 | ✅ Paxos 复制指标 |
| **自动驱逐与重加入** | ✅ 组复制 | ✅ PXC (Galera) | ✅ Galera 自动重加入 | ✅ Raft 自动 Leader 转移 | ✅ Paxos 自动恢复 |
| **最新数据感知选主** | ✅ | ✅ (Galera 加权法定人数) | ✅ (Galera) | ✅ Raft Leader 选举 | ✅ Paxos Leader 选举 |
| **PBKDF2 + SHA-512 密码** | ✅ | ✅ 相同机制 | ✅ 自有认证插件 | ✅ 自有认证 (证书) | ✅ 自有认证 |
| **动态数据脱敏** | ❌ 仍为企业版独占 | ❌ 无原生支持 | ❌ 无原生支持 | ❌ 需第三方 (DataSunrise) | ❌ 社区版未提供 |

---

## 2. 锁功能审计：Oracle 还捏着什么不放

以下功能仍然锁定在 MySQL Enterprise / HeatWave，构成 Oracle 的持续变现壁垒：

| 锁定功能 | MySQL CE | Percona | MariaDB CE | TiDB | OceanBase CE |
|---|---|---|---|---|---|
| **防火墙 (SQL 注入防护)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TDE 透明数据加密** | ❌ | ✅ Keyring 插件 | ✅ 加密插件 | ✅ 存储层 TDE | ❌ 企业版独占 |
| **审计日志** | ❌ | ✅ Audit 插件 | ✅ Audit 插件 | ✅ 审计日志 | ❌ 企业版独占 |
| **LDAP/Kerberos/PAM 认证** | ❌ | ✅ PAM/LDAP | ✅ PAM/LDAP | ✅ 证书认证 | ❌ 企业版独占 |
| **线程池** | ❌ | ✅ 内置 | ✅ 内置 | ✅ 分布式每节点池 | ✅ 内置 |
| **企业级备份** | ❌ 依赖 XtraBackup | ✅ XtraBackup | ✅ Mariabackup | ✅ BR 备份恢复 | ✅ 原生备份 |
| **向量 HNSW 索引** | ❌ HeatWave 独占 | ❌ | ⚠️ 预览阶段 | ❌ 无向量类型 | ✅ 社区版免费 |
| **OLAP 分析加速** | ❌ HeatWave 独占 | ❌ | ✅ ColumnStore 25.10 | ✅ TiFlash 列存免费 | ✅ 列存免费 |
| **AutoML / GenAI** | ❌ HeatWave 独占 | ❌ | ❌ | ❌ | ❌ |

**关键发现：** Percona Server 8.4 填补了 MySQL CE 大部分"锁定"空白（TDE、审计、线程池、PAM/LDAP、XtraBackup）。MariaDB 和 OceanBase 更进一步——提供内置 OLAP/列存引擎且无云锁定。

---

## 3. 竞争影响分析：谁受损最大，谁基本不受影响

### 🔴 Percona Server — 受损最大

**Percona 的历史定位是："MySQL 社区版 + 企业功能，免费提供"。** 8 项功能下放直接侵蚀了这个定位：

| Percona 差异化优势 | MySQL 9.7 后的状态 |
|---|---|
| 扩展性能计数器 (853 vs 434) | 仍领先，但差距缩小 |
| MyRocks 存储引擎 | 仍为 Percona 独有 |
| 线程池 | MySQL CE 仍缺失——关键差异化点 |
| PAM/LDAP 认证 | MySQL CE 仍缺失——关键差异化点 |
| 审计插件 | MySQL CE 仍缺失——关键差异化点 |
| TDE 透明加密 | MySQL CE 仍缺失——关键差异化点 |
| Hypergraph 优化器 | MySQL CE 现在有且默认开启——**优势消失** |
| 复制监控指标 | MySQL CE 现在有——**优势消失** |
| OpenTelemetry | MySQL CE 原生 OTLP，Percona 仅有 PMM——MySQL **反超** |
| XtraBackup | 仍是行业标准工具——优势保留 |

**结论：** Percona 的价值主张从约 12 项独特特性缩减到约 5 项。线程池 + TDE + 审计 + PAM + MyRocks 是最后的护城河。

### 🟡 MariaDB — 中等影响

MariaDB 多年前已与 MySQL 分道扬镳。MySQL 下放的功能与 MariaDB 的独特优势并不直接竞争：

| MariaDB 差异化能力 | 不受 MySQL 9.7 影响 |
|---|---|
| Flashback 闪回查询（时间旅行 SELECT） | MySQL 无此功能 |
| 系统版本表（SQL:2011 时态表） | MySQL 无此功能 |
| 存储引擎多样性（ColumnStore、Spider、Connect） | HeatWave = 仅云端；MariaDB = 可自托管 |
| Galera 集群（同步多主） | MySQL 组复制模型不同 |
| UUID v4/v7、ROW 类型返回 | MySQL 无此功能 |
| Binlog 大事务提交优化（阿里贡献） | MySQL CE 无此功能 |
| Enterprise Platform 2026：AI Copilot、混合搜索 | MySQL 需 HeatWave 才能对标 |

**MySQL 9.7 唯一对 MariaDB 构成挑战的点：** JSON Duality 视图——MariaDB 无等价功能，这是 MySQL 社区版真正的差异化武器。

### 🟢 TiDB — 基本不受影响

TiDB 在完全不同的维度上竞争——分布式 SQL + 水平扩展。MySQL 9.7 CE 完全不触及这个领域：

| TiDB 核心优势 | MySQL 9.7 CE 的处境 |
|---|---|
| 水平扩展（加节点 = 加容量） | MySQL = 单节点（或手动分库分表） |
| HTAP（TiFlash 同集群列存查询） | MySQL 需 HeatWave（仅云端、额外付费） |
| Cloud-native、Kubernetes-native | MySQL 有 K8s Operator 但非主要部署方式 |
| 多地域 Raft 复制 | 组复制仍以单地域为主 |
| 大规模集群 Online DDL | MySQL 有 Online DDL 但仅限单节点 |

**MySQL 9.7 对 TiDB 唯一获得优势的点：** TiDB 无原生 JSON Duality 视图，优化器非超图引擎。MySQL 在单节点查询优化上优于 TiDB。

### 🟢 OceanBase — 基本不受影响

OceanBase 社区版免费开源且具备 MySQL CE 仍无法匹敌的能力：

| OceanBase CE 核心优势 | MySQL 9.7 CE 的处境 |
|---|---|
| 向量类型 + **HNSW 索引**社区版免费！ | MySQL 有向量类型但 HNSW = HeatWave 独占 |
| 列存引擎做 HTAP | MySQL 需 HeatWave（仅云端） |
| LSM-Tree（比 InnoDB 压缩 4-6 倍） | InnoDB 唯一选项 |
| Paxos 高可用自动故障转移 | 组复制（配置更复杂） |
| 分布式事务（多节点原生） | 单节点（跨分片需 XA，非内置） |
| 物化视图 + 查询改写 | MySQL CE 无物化视图 |
| 原生全量+增量备份 | 需 XtraBackup 或 mysqldump |

**MySQL 9.7 对 OceanBase 唯一获得优势的点：** OceanBase CE 无 Oracle 兼容模式、无空间/GIS 类型、无 Performance Schema 函数。MySQL 9.7 CE 有完整的空间支持和 P_S。

---

## 4. 决策树：不同场景选什么

```
需要企业级功能但不想给 Oracle 付费？
├── 单节点 OLTP
│   ├── 需要 TDE/审计/LDAP？ → Percona Server 8.4
│   ├── 需要 Hypergraph 优化器？ → MySQL 9.7 CE（默认开启）
│   └── 需要时间旅行查询/闪回/多引擎？ → MariaDB 11.8 LTS
│
├── 分布式 / HTAP
│   ├── MySQL 兼容 + 列存免费？ → OceanBase 4.3 CE（向量索引也免费！）
│   ├── Cloud-native + K8s 优先？ → TiDB 8.1
│   └── 需要 JSON Duality + HTAP？ → MySQL 9.7 CE + HeatWave（付费）
│
├── 需要向量搜索？
│   ├── 免费 HNSW 向量索引？ → OceanBase 4.3 CE（目前唯一免费选项）
│   ├── 向量预览？ → MariaDB 11.8（预览阶段，慎重）
│   └── 完整向量 + AI 管线？ → HeatWave GenAI（付费）
│
└── 需要 Oracle 兼容？
    └── OceanBase Enterprise（付费）
```

---

## 5. 总结对比表

| 维度 | MySQL 9.7 CE | Percona 8.4 | MariaDB 11.8 LTS | TiDB 8.1 | OceanBase 4.3 CE |
|---|---|---|---|---|---|
| **查询优化器** | Hypergraph 默认 | Hypergraph 继承 | 自研（基于代价） | Cascades | 自研 |
| **OTel 可观测性** | ✅ 原生 | ⚠️ 仅 PMM | ❌ | ✅ CNCF | ❌ |
| **安全（TDE/审计）** | ❌ 企业版 | ✅ 插件 | ✅ 插件 | ✅ 内置 | ❌ 企业版 |
| **线程池** | ❌ | ✅ | ✅ | ✅ 分布式 | ✅ |
| **向量 HNSW 索引** | ❌ HeatWave | ❌ | ⚠️ 预览 | ❌ | ✅ 免费 |
| **HTAP 列存** | ❌ HeatWave | ❌ | ✅ ColumnStore | ✅ TiFlash | ✅ 免费 |
| **分布式扩展** | ❌ 手动分库 | ❌ | ⚠️ Spider 引擎 | ✅ 原生 | ✅ 原生 |
| **JSON Duality** | ✅ 独有 | ❌ | ❌ | ❌ | ❌ |
| **备份工具** | XtraBackup | XtraBackup | Mariabackup | BR | 原生 |
| **开源许可证** | GPLv2 | GPLv2 | GPLv2 | Apache 2.0 | MulanPubL-2.0 |

---

## 6. 总体判断

**MySQL 9.7 CE 是 Oracle 给社区版的最好单节点 MySQL。** Hypergraph 优化器本身就是对旧优化器的代际跨越。JSON Duality 视图确实是独门武器。

但两个结构性问题仍然存在：

1. **VECTOR 类型是"语法糖"——有类型无 HNSW 索引**。能存向量但不能做快速相似度搜索。OceanBase 社区版免费提供 HNSW。
2. **HTAP 仍然锁定在 HeatWave（付费）**——而 MariaDB 和 OceanBase 都有免费的列存引擎。

**给 mysql-notes 读者的建议：**

- MySQL 原生用户需要优化器提升 → 立刻升级到 9.7 CE
- 需要 TDE/审计但不向 Oracle 付费 → Percona 8.4
- 需要 HTAP 或向量搜索且不想云锁定 → OceanBase 4.3 CE 或 MariaDB 11.8
- 需要水平扩展能力 → TiDB 或 OceanBase（均为开源免费）
