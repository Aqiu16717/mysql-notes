---
title: "Hekaton：SQL Server 的内存优化 OLTP 引擎（2013）"
date: 2026-05-16
tags: [#mysql, #innodb, #paper, #advanced]
source: ["SIGMOD 2013", "https://dl.acm.org/doi/10.1145/2463676.2463710"]
version: "MySQL 9.6.0"
paper:
  venue: SIGMOD
  year: 2013
  maturity: Widely Deployed
  keywords: latch-free, lock-free, BwTree, MVCC, multi-versioning, OLTP, memory-optimized, SQL Server, industrial
product_mapping:
  aurora: not adopted
  percona: not adopted
  mysql_upstream: not adopted
  mariadb: not adopted
author: "@mns-hunter"
---

# Hekaton（SIGMOD 2013）
## SQL Server 的内存优化 OLTP 引擎

**作者：** Cristian Diaconu、Craig Freedman、Erik Ismert 等（Microsoft）

---

## 1. 背景

到 2011-2013 年，Microsoft 的 SQL Server 团队面临一个残酷的现实：为 90 年代基于磁盘的 OLTP 所设计的锁管理器和闩锁系统，在现代硬件上消耗了 30-40% 的 CPU 周期。即使使用内存表（DBCC PINTABLE），瓶颈在于*架构*而非存储介质。

Hekaton 是 Microsoft 的答案：一个从零构建的内存 OLTP 引擎，**没有闩锁、没有锁、没有锁管理器**。与 Silo（研究原型）不同，Hekaton 作为生产功能随 SQL Server 2014 一起发布。

---

## 2. 问题

SQL Server 传统引擎存在三个架构瓶颈：

1. **锁管理器 CPU 开销**：即使有页级和行级锁，锁管理器的哈希表、死锁检测图遍历和锁升级逻辑在 OLTP 负载下仍消耗约 15% 周期。
2. **B 树页闩锁争用**：经典的闩锁耦合协议（闩锁父页 → 闩锁子页 → 释放父页）在根页和近根页上产生级联争用。
3. **解释执行开销**：编译后的 T-SQL 经过查询处理器中的逐语句执行，产生每语句的设置/拆除开销，这对于短 OLTP 事务来说占主导地位。

---

## 3. 方案

Hekaton 的架构建立在四个支柱上，全部为生产环境（而不仅是研究原型）设计：

### 3.1 无闩锁索引（哈希 + 范围）
- **哈希索引**：在桶链表上使用 CAS 实现无锁。每个桶是一个单向链表。插入在链表头使用 CAS；删除使用标记后 CAS。无全局锁表，无每桶闩锁。
- **范围索引**：**BwTree**——一种无闩锁的 B 树变体（见单独的 BwTree 卡片）。使用映射表间接层，使得结构修改（分裂/合并）通过 CAS 在映射表上执行，而非在页节点上加闩锁。
- **完全无页闩锁**：读者从不获取闩锁。写者使用 CAS 进行原子状态转换。

### 3.2 多版本并发控制（MVCC）
- 每一行有**开始时间戳**和**结束时间戳**（非事务 ID，而是来自单调递增计数器的全局提交时间戳）。
- **快照隔离**作为默认隔离级别（可选的序列化验证）。
- 事务读取其 **[begin, end)** 区间包含事务开始时间的版本。
- 更新：插入 begin=commit_timestamp 的新版本，设置旧版本的 end=commit_timestamp。
- **无读锁，无读写冲突**：读者从不阻塞写者，写者从不阻塞读者。

### 3.3 本地编译存储过程
- Hekaton 使用专用编译器将 T-SQL 存储过程编译为**本地机器码**（C → DLL）。
- 消除了逐语句解释执行的开销。
- 编译后的过程通过函数调用直接访问 Hekaton 表，在热路径上完全绕过 SQL Server 查询处理器。
- 结果：亚毫秒存储过程执行（对比解释执行的 T-SQL 1-10ms）。

### 3.4 乐观多版本并发控制
- 提交时的**验证阶段**：检查是否有任何事务修改了本事务读集中的行，且提交时间在本事务的开始时间和提交时间之间。
- 如果验证通过：分配提交时间戳，使所有版本可见，写入持久化存储。
- 如果验证失败：中止并重试（应用程序的责任）。
- **无等待图，无死锁检测**：冲突通过中止重试而非等待来解决。

---

## 4. 权衡

| 收益 | 代价 |
|---|---|
| OLTP 工作负载上比基于磁盘的 SQL Server 吞吐量提升 5-20 倍 | **应用程序必须处理中止重试**：Hekaton 中止冲突事务而不是阻塞，但应用程序代码必须重试（否则有数据丢失风险） |
| 零闩锁争用，零锁管理器开销 | **所有数据必须装入内存**：Hekaton 表是内存优化的——没有基于磁盘的 Hekaton 表。持久性通过事务日志 + 检查点文件实现，但工作集必须在 RAM 中 |
| 本地编译消除解释执行开销 | **Hekaton 表上无 DML 触发器、无外键、无 CHECK 约束**（SQL Server 2014 时）——T-SQL 功能子集 |
| MVCC 完全消除读写冲突 | **垃圾回收**：旧版本必须由后台"版本清理"线程清理——在高更新率下，如果清理线程跟不上，版本链将无限增长 |
| 生产级：受支持、有文档、已发布 | **仅快照隔离（默认）或序列化**：无 READ COMMITTED、无 REPEATABLE READ——隔离级别功能面缩减 |

---

## 5. 论文摘要中未提及的失败模式

**来自生产经验和后续论文：**

1. **垃圾回收（GC）尾部延迟**：Hekaton 的版本清理器是一个协作线程。在持续高更新率工作负载下（如单表 100K 更新/秒），每键版本链常规超过 1 万行。版本清理器滞后，此时一个点读需要 1 万次指针遍历而非 1 次。隐含后果：当 GC 跟不上时，Hekaton 的吞吐量退化 40-60%（Microsoft 自有性能团队在 2015 年技术文档中记录）。

2. **本地编译冷启动**：本地编译存储过程的首次执行需要 C 编译 + JIT DLL 加载。对于调用 50+ 张表的存储过程，编译可能需要数秒。Microsoft 在 SQL Server 2016 中增加了"预编译全部"选项来缓解。

3. **验证中止风暴**：在单行高争用下（如 100 个并发事务更新同一计数器），乐观验证对 90%+ 的事务失败。每次中止消耗 CPU，重试循环产生正反馈死亡螺旋。缓解方案是对热点行做哈希分区（如计数器用 8 个桶行），但这需要 schema 变更。

4. **检查点文件碎片化**：Hekaton 的持久化模型写入检查点文件（数据 + 增量）。在大量插入/删除更替下，检查点文件碎片化，恢复时间随碎片数量线性增长。Microsoft 在 SQL Server 2016 中增加了自动合并。

5. **DMV（动态管理视图）盲点**：Hekaton 的 `sys.dm_db_xtp_*` DMV 不能直接暴露版本链长度或 GC 队列深度。DBA 在生产 Hekaton 表无声退化时才付出惨痛代价发现了这一点。SQL Server 2017 通过 `sys.dm_db_xtp_gc_cycle_time` 及相关 DMV 修复。

---

## 6. MySQL 代码邻近度

### 若将 Hekaton 的无闩锁 + MVCC 模型移植到 MySQL：

| MySQL 区域 | 文件 | 变更内容 |
|---|---|---|
| MVCC（Read View） | `storage/innobase/read/read0read.cc` | InnoDB 的 Read View 使用事务 ID 而非时间戳。需要切换到全局提交时间戳计数器（类似 Hekaton）用于 MVCC 版本可见性。`ReadView::m_low_limit_id` → `ReadView::m_commit_ts`。 |
| 锁系统 | `storage/innobase/lock/lock0lock.cc` | **Hekaton 表无需锁系统。**无行锁、无间隙锁、无 next-key 锁。基于验证的冲突检测替代整个锁等待图。 |
| 行版本 | `storage/innobase/row/row0vers.cc` | Hekaton 的版本链使用 begin/end 时间戳，非 InnoDB 基于 undo log 的版本管理（`trx_undo_prev_version_build`）。需要为内存优化表设计新的版本存储模型。 |
| B+树页 | `storage/innobase/btr/btr0cur.cc` | 用 CAS 结构修改（BwTree）替换页闩锁。页分裂不再持有闩锁——使用映射表间接。 |
| 垃圾回收 | `storage/innobase/row/row0purge.cc` | InnoDB 的 purge 线程操作 undo log。Hekaton 的版本清理器操作行版本链。数据结构不同，问题相同：GC 跟不上。 |
| Handler API | `sql/handler.h`、`sql/handler.cc` | 新的 `ha_hekaton` handler：无 `external_lock()`（无锁），无 `rnd_lock()`/`index_lock()`（无闩锁），新的 `retry_on_abort()` 回调。 |
| 本地编译 | 全新：`sql/xtp_compile/` | MySQL 没有存储过程编译管线。Hekaton 的本地编译需要一个新的 MySQL 插件，用于 LLVM 为基础的 T-SQL → 本地代码编译。 |

### MySQL 特有障碍：
- **InnoDB 的 undo log 是崩溃恢复的基础。**Hekaton 的 MVCC 将版本行内存储——无 undo log。移植到 MySQL 需要一个新的存储引擎（通过 handlerton 可插拔）或并行的版本存储系统。
- **MySQL 的复制依赖 binlog 位置 + GTID。**Hekaton 的提交时间戳排序不能干净地映射到 binlog 的序列事件流。MySQL 中的 Hekaton 式引擎需要一个按时间戳排序的提交对应的新 binlog 事件类型。
- **`performance_schema` 对每次锁等待进行测量。**消除锁意味着这些测量必须改变——Hekaton 表上的 `events_waits_current` 锁等待将消失，这破坏了所有查询它的监控工具。

---

## 7. 产品映射

| 产品 | 状态 | 证据 |
|---|---|---|
| **SQL Server（Hekaton）** | 广泛部署 | 随 SQL Server 2014 发布，经 SQL Server 2022 不断改进。GA 功能。 |
| **Aurora** | 未采纳 | Aurora 使用完全不同的模型：日志即数据库加分布式存储。闩锁消除无意义，因为 Aurora 的计算层没有传统意义上需要闩锁的磁盘页。 |
| **Percona** | 未采纳 | 没有带无闩锁索引的内存优化表引擎。 |
| **MySQL 上游** | 未采纳 | MySQL 有 `MEMORY` 引擎（哈希索引，表级锁）——完全不像 Hekaton。`InnoDB` 引擎有 MVCC 但使用传统的基于锁的并发机制。 |
| **MariaDB** | 未采纳 | MariaDB 的 MyRocks 和 InnoDB 都使用传统锁机制。无无闩锁引擎。 |
| **TiDB** | 部分采纳 | TiKV（TiDB 的存储层）使用 MVCC + 乐观事务（Percolator 模型），共享了 Hekaton "提交时乐观验证"的理念。但 TiKV 使用 Raft 做复制，而非无闩锁索引。 |
| **OceanBase** | 部分采纳 | OceanBase 的内存事务引擎内部使用 MVCC + 无锁数据结构，有一些概念类似 Hekaton，但它是分布式 shared-nothing 架构——并发模型不同。 |

---

## 8. 性能论断（附实验条件）

**声称：**OLTP 工作负载上比传统基于磁盘的 SQL Server 吞吐量提升 5-20 倍。亚毫秒存储过程执行。

**实验条件：**
- **硬件：**双插槽 12 核 Intel Xeon X5670（24 逻辑核），96 GB RAM
- **数据集：**自定义 OLTP 工作负载（非 TPC-C——Hekaton 使用更简单的 schema：orders、order_lines、customers）
- **工作负载：**100% 内存，本地编译存储过程
- **对比对象：**SQL Server 2012 基于磁盘的引擎（带内存 DBCC PINTABLE 表，有页闩锁但无磁盘 I/O）
- **关键结果：**单表插入工作负载 1.1M 事务/秒（对比基于磁盘引擎 50K = 22 倍）。多表关联工作负载：250K TPS（对比 15K = 16.7 倍）。

**注意事项：**
- "20 倍"声明针对单表插入工作负载——最简单可能的 OLTP 操作
- 对比对象是有页闩锁的基于磁盘的引擎，而非已做闩锁优化的引擎
- 非 TPC-C 基准——不同 schema，不同争用模式
- 本地编译开启（对解释执行的 T-SQL 对比不公平）
- Hekaton 的吞吐量在间隔分析查询时会显著退化（论文中未提及）
- GC 开销未计入吞吐量数字（在无持续版本更替的静态系统上运行）

---

## 9. MySQL 生态启示

1. **工业生产部署的故事是最有价值的部分。**Hekaton 是本集群中唯一一个发版到数百万用户的论文。它的失败模式（GC 尾部延迟、验证中止风暴、检查点文件碎片化）是*真实的*——由生产环境中的 DBA 发现，而非在实验室中。如果 MySQL 未来考虑无闩锁引擎，Hekaton 的生产教训比 Silo 的洁净室基准更有价值。

2. **Hekaton 证明了"无锁的乐观 MVCC"在大规模下可行。**核心洞见——基于提交时间戳的 MVCC + 乐观验证替代了锁管理器——已在数十亿生产事务中得到验证。这是 InnoDB 的锁管理器（`lock0lock.cc`）原则上可以被替代的最强证据。

3. **本地编译是 MySQL 缺乏的巨大差异化能力。**Hekaton 的编译存储过程消除了 `sp_instr` 解释执行带来的 CPU 开销。MySQL 的存储过程执行（遍历 `sp_head::execute()`）是纯解释的，没有编译路径。对于以存储过程为主的 OLTP 工作负载，这是 10-100 倍的延迟差异。MySQL 没有任何关于存储过程编译的 WL。

4. **隔离级别功能面的收缩是 MySQL 真正的采纳障碍。**Hekaton 只支持快照隔离和序列化。MySQL 用户日常使用 `READ COMMITTED` 和 `REPEATABLE READ`（默认）。MySQL 中一个抛弃这些隔离级别的 Hekaton 式引擎将面临巨大的向后兼容阻力。

---

## 参见
- Silo 论文卡片（shared-nothing 基于 epoch 的方案，研究原型）
- BwTree 论文卡片（Hekaton 内部使用的无闩锁 B 树）
- Shore-MT 论文卡片（传统基于锁的基线）
- @mns-reader：InnoDB MVCC Read View 代码路径（`read0read.cc`、`trx0trx.cc`）
- @mns-comparator：SQL Server Hekaton vs. MySQL InnoDB OLTP 功能对比
