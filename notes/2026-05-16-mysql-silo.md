---
title: "Silo：多核内存数据库的高速事务处理（2013）"
date: 2026-05-16
tags: [#mysql, #innodb, #paper, #advanced]
source: ["SOSP 2013", "https://dl.acm.org/doi/10.1145/2517349.2522713"]
version: "MySQL 9.6.0"
paper:
  venue: SOSP
  year: 2013
  maturity: Research Prototype
  keywords: lock-free, epoch-based-reclamation, OLTP, concurrency, deterministic-serialization, in-memory, TPC-C
product_mapping:
  aurora: not adopted
  percona: not adopted
  mysql_upstream: not adopted
  mariadb: not adopted
author: "@mns-hunter"
---

# Silo（SOSP 2013）
## 多核内存数据库的高速事务处理

**作者：** Stephen Tu、Wenting Zheng、Eddie Kohler、Barbara Liskov、Samuel Madden（MIT CSAIL）

---

## 1. 背景

到 2013 年，多核硬件上的 OLTP 引擎已碰壁：当核心数超过 8-16 时，锁争用和闩锁开销消耗了 14-28% 的 CPU 周期（Harizopoulos 等人，SIGMOD 2008）。主流方案——基于两阶段锁（2PL）的细粒度行级锁——在争用下产生了死锁检测开销、锁表争用和上下文切换风暴。

Silo 提出了一个问题：*我们能否为多核时代构建一个完全可序列化的、无锁的 OLTP 引擎？*

---

## 2. 问题

传统 OLTP 引擎将 16-30% 的执行时间消耗在：
- **锁管理器争用**（锁表哈希冲突、死锁检测图遍历）
- **B+树页闩锁争用**（即使使用闩锁耦合，从根到叶的锁定也会阻塞读操作）
- **日志缓冲争用**（单个全局日志互斥锁串行化提交）
- **事务协调开销**（2PL 锁获取/释放、两阶段提交）

问题本质是**架构性的**：这些机制假设内存稀缺且核心数少。在拥有充足 RAM 和 32+ 核心的现代硬件上，争用成本压倒了有效工作。

---

## 3. 方案

Silo 的设计建立在三个支柱上：

### 3.1 基于 Epoch 的组提交
- 时间被划分为**epoch**（周期性递增的全局计数器）
- Epoch E 中的事务在 epoch E-1 中所有事务提交**之后**才提交
- 一个专用的**epoch 线程**推进 epoch 并触发组提交
- 一个 epoch 中的所有写入被批量处理为一次串行提交批次
- 这完全消除了日志互斥锁——只有 epoch 线程接触日志

### 3.2 确定性序列化
- Silo 不为每行加锁，而是根据读/写集合为每个事务分配**事务 ID（TID）**
- 事务在提交时按 TID 顺序序列化
- 读集验证：提交时，每次读取的 TID 必须与其读取时的版本匹配
- 写集应用：所有写入在 epoch 边界原子性地应用
- 无死锁（无锁获取顺序），无锁表

### 3.3 Masstree（无锁 B+树）
- 使用 Masstree（一种缓存友好的 trie+B+树混合结构）作为索引
- Masstree 通过带版本号的叶节点提供无锁点读
- 结构修改（分裂/合并）在内节点上使用 CAS

### 关键创新：基于 Epoch 的内存回收（EBR）
- 每个线程公布其**当前 epoch**
- 垃圾回收时：在 epoch E 中释放的内存只有在**所有线程**都已推进到超过 epoch E 后才能回收
- 快速路径上无引用计数，无 hazard pointer

---

## 4. 权衡

| 收益 | 代价 |
|---|---|
| 接近线性的 32 核扩展（700K TPC-C TPS） | **Epoch 延迟死亡螺旋**：一个慢线程（如长时间运行的 `SELECT`）阻塞所有内存回收 → OOM |
| 零死锁检测开销 | 全或无序列化：epoch 中任一事务冲突则整个 epoch 批次中止 |
| 无锁表，热路径上无闩锁 | 仅内存——原始设计中无基于磁盘的恢复路径 |
| 简化的正确性验证：基于 TID 的序列化图可轻松验证 | 不能容忍线程崩溃——持有过期 epoch 的死线程会永久泄漏内存 |
| 确定性：相同输入 → 相同序列顺序（调试友好） | 组提交延迟底限 = epoch 间隔（取决于配置，约 1-40ms） |

---

## 5. 论文摘要中未提及的失败模式

**来自后续工作（ERMIA，SIGMOD 2016；Foedus，SIGMOD 2014）：**

1. **Epoch 停顿级联效应**：一个扫描 1000 万行的只读事务阻止所有其他线程的内存回收。在 Silo 的 TPC-C 工作负载中（短事务）这个问题被掩盖了，但在生产规模下，任何分析查询都会在几秒内导致 OOM。

2. **中止放大**：在高争用工作负载下（如 50 个线程争用 TPC-C 中同一个仓库），一个冲突事务会导致整个 epoch 批次中止。热点争用下吞吐量崩溃 60-80%。

3. **Masstree 分裂风暴**：在插入密集型工作负载下，Masstree 分裂引发级联 epoch 停顿，因为等待提交的线程必须等待分裂完成的线程推进 epoch。

4. **NUMA 不敏感**：Silo 的原始评估在单插槽 32 核机器上进行。在多插槽 NUMA 上，基于 TID 的序列化产生跨插槽一致性流量，扩展性差（Kim 等人，VLDB 2015，双插槽比单插槽吞吐量损失 50%）。

---

## 6. MySQL 代码邻近度

### 若将 Silo 设计移植到 MySQL，受影响的文件：

| MySQL 区域 | 文件 | 变更内容 |
|---|---|---|
| THD 会话状态 | `sql/sql_class.h`、`sql/sql_class.cc` | 用每线程 epoch 发布替换 `THD::LOCK_thd_data` 互斥锁。新增 `THD::current_epoch` 字段。 |
| 锁系统 | `storage/innobase/lock/lock0lock.cc` | **完全消除 lock_sys** — 确定性序列化下无行锁，仅需读集验证。 |
| 事务系统 | `storage/innobase/trx/trx0sys.cc`、`trx0trx.cc` | 用 epoch 计数器替换 `trx_sys->mutex`。`trx_commit()` 变为 epoch 边界操作。 |
| B+树 | `storage/innobase/btr/btr0cur.cc`、`btr0btr.cc` | 页闩锁（`buf_page_get_gen` 的 `RW_S_LATCH`/`RW_X_LATCH`）替换为版本化读取。需要 BwTree 式 CAS 或 Masstree 式版本化叶节点。 |
| Redo 日志 | `storage/innobase/log/log0log.cc`、`log0write.cc` | `log_sys->mutex` 替换为 epoch 线程。`log_write_up_to()` 变为 epoch 边界批量写入。 |
| 连接处理 | `sql/conn_handler/connection_handler_manager.cc` | THD 创建时初始化每线程 epoch 状态。与现有线程并列启动 epoch 线程。 |
| 服务器主循环 | `sql/mysqld.cc` | 注册 epoch 管理器线程。关闭时必须在释放 THD 前清空所有 epoch。 |

### MySQL 特有障碍：
- **mem_root 生命周期**：Silo 的 EBR 假定在 epoch 推进时调用 `free()`。MySQL 的 `MEM_ROOT` 使用区域语义——不能释放单个对象。需要感知 epoch 的区域或每个 epoch 一个 `MEM_ROOT`。
- **KILL CONNECTION**：Silo 没有等价于 MySQL KILL 的机制。中止 epoch 中期的事务需要 epoch 范围中止或延迟 kill（标志 + 惰性检查）。
- **Binlog 集成**：Silo 的确定性序列顺序不能干净地映射到 binlog 的语句/行格式。epoch 提交批次需要一个能保留顺序的 binlog 事件类型。

---

## 7. 产品映射

| 产品 | 状态 | 证据 |
|---|---|---|
| **Aurora** | 未采纳 | Aurora 的存储层是分布式的、日志结构的——与 Silo 的单节点内存设计根本不同。日志即数据库，而非 epoch 批处理的提交缓冲。 |
| **Percona** | 未采纳 | Percona Server 在服务器层变更上贴近 MySQL 上游。无基于 epoch 的无锁事务提交的证据。 |
| **MySQL 上游** | 未采纳 | WL#11624（争用感知事务调度，MySQL 8.0.20）最接近——它在现有 2PL 框架内使用队列调度减少锁争用，但不消除锁。 |
| **MariaDB** | 未采纳 | MariaDB 中没有基于 epoch 的并发机制。MyRocks（RocksDB 引擎）使用 LSM-tree + 行锁，非无锁确定性序列化。 |

---

## 8. 性能论断（附实验条件）

**声称：**32 核上 700K TPC-C 事务/秒。"接近线性扩展"。

**实验条件：**
- **硬件：**单插槽 32 核 Intel Xeon E5-4620（2.2 GHz），128 GB RAM
- **数据集：**TPC-C，100 仓库（全内存）
- **工作负载：**100% 内存，无磁盘 I/O，短事务（平均 < 10 读，< 5 写）
- **对比对象：**Shore-MT 基线（传统基于锁的 OLTP），同硬件约 280K TPS
- **扩展声明：**1 核 → 32 核 = 24.7 倍加速（77% 并行效率）

**注意事项：**
- 仅单插槽——无 NUMA 评估
- 无分析查询（纯 OLTP）
- 未评估崩溃恢复路径
- Epoch 间隔调至 40ms（在吞吐量指标中隐藏批处理延迟）
- 这是 Shore-MT 的 2.5 倍，不是 10 倍——对消除锁开销来说是现实的数字

---

## 9. MySQL 生态启示

1. **Epoch 模型与 MySQL 的连接模型根本不相容。**MySQL 支持任意时长的连接（如 `SELECT SLEEP(3600)`），会阻塞基于 epoch 的内存回收。Silo 对短事务（纯 OLTP）的假设对真实 MySQL 部署不成立。

2. **确定性序列化完全移除了 InnoDB 的锁系统**——但 MySQL 的 `performance_schema` 和 `sys` schema 暴露了监控工具所依赖的锁等待数据。迁移需要替代的监控原语。

3. **基于 TID 的序列化可能映射到组复制（MGR）。**MGR 的基于认证的冲突检测（Galera write-set replication）已经做了类似的工作：跨节点序列化事务。Silo 的确定性 TID 分配在原则上可以与 MGR 的认证集成，产生一个完全确定性的集群。这是最有趣的架构路径，在 MySQL 中尚未被探索。

---

## 参见
- Hekaton 论文卡片（无锁哈希/范围索引，工业化部署）
- BwTree 论文卡片（Hekaton 中使用的无锁 B 树）
- Shore-MT 论文卡片（基线基于锁的架构，多线程存储管理器）
- @mns-reader：InnoDB B+树页闩锁分析（`btr0cur.cc`，闩锁耦合遍历）
- @mns-comparator：MySQL 组复制 vs. 确定性数据库架构
