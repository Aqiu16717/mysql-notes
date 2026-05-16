---
title: "Shore-MT：多核时代的可扩展存储管理器（2009）"
date: 2026-05-16
tags: [#mysql, #innodb, #paper, #advanced]
source: ["EDBT 2009", "https://dl.acm.org/doi/10.1145/1516360.1516395"]
version: "MySQL 9.6.0"
paper:
  venue: EDBT
  year: 2009
  maturity: Research Prototype
  keywords: multicore, storage-manager, scalability, bottleneck-analysis, lock-manager, thread-pool, OLTP, Shore, baseline
product_mapping:
  aurora: not adopted
  percona: not adopted
  mysql_upstream: not adopted
  mariadb: not adopted
author: "@mns-hunter"
---

# Shore-MT（EDBT 2009）
## 多核时代的可扩展存储管理器

**作者：** Ryan Johnson、Ippokratis Pandis、Nikos Hardavellas、Anastasia Ailamaki、Babak Falsafi（EPFL / 卡内基梅隆大学）

---

## 1. 背景

2009 年，数据库社区面临一个危机：CPU 核心数每 18 个月翻一番，但 OLTP 吞吐量在 8-16 核处停滞不前。Shore-MT 项目问了一个极其简单的问题：**传统的基于锁的存储管理器到底把时间花在了哪里？哪个瓶颈最关键？**

Shore-MT 成为了整个无锁 OLTP 文献（Silo、Hekaton、BwTree）赖以建立的**基线测量基础设施**。2015 年之前几乎每一篇多核 OLTP 论文都把 Shore-MT 作为它们所超越的基线。

---

## 2. 问题

问题的性质是**诊断性的**，而非规定性的：

1. **没有人系统性地测量过**基于锁的存储管理器在什么位置触及可扩展性天花板。
2. **坊间常识**会说"锁管理器是瓶颈"，但究竟是锁表哈希冲突、死锁检测、日志互斥锁，还是别的什么？
3. **没有开源的多线程存储管理器**可用于受控实验。Shore（前身）是单线程的。BerkeleyDB 的并发能力有限。InnoDB 是闭源的（当时归 Oracle 所有）。

Shore-MT 的首要贡献：**一个公开可用的、带测量仪器的、多线程的存储管理器，供研究人员运行受控的可扩展性实验。**

---

## 3. 方案

Shore-MT 不是一种新的并发模型。它是一个**基准测试平台**，有四个关键设计决策：

### 3.1 架构：从 Shore Fork 出全多线程版本
- 取 Shore（威斯康星大学麦迪逊分校的单线程存储管理器）并将其完全多线程化。
- **每连接一线程模型**（与 MySQL 的 `one-thread-per-connection` 相同）。
- 多个工作线程对同一数据库并发执行事务。
- **2PL（两阶段锁）**作为并发控制模型——没有任何无锁机制。这就是标准基线。

### 3.2 瓶颈测量仪表
- 关键创新：Shore-MT 用周期精度的时戳对**每一个争用点**进行测量。
- 测量指标：
  - **锁管理器开销**（锁表哈希冲突、死锁检测图遍历、锁获取/释放延迟）
  - **缓冲池争用**（页闩锁获取/释放、缓冲区淘汰互斥锁、LRU 链表锁）
  - **日志管理器开销**（日志缓冲互斥锁、日志刷盘 I/O 停顿）
  - **事务协调**（事务开始/提交/准备开销）
- 每个测量点报告：消耗的总周期数、占事务时间的百分比、争用程度（被阻塞的线程数）。

### 3.3 线程本地内存池
- 为数不多的架构创新之一：**线程本地分配区域（thread-local allocation arenas）**。
- 每个工作线程从自己的内存池中分配，不存在全局 `malloc()` 互斥锁。
- 当线程的池耗尽时，从全局分配器获取一个新块（全局分配器只在池耗尽时发生争用，而非每次分配都争用）。
- 这就是 Hekaton 和 BwTree 后来采纳的思路——但 Shore-MT 在存储管理器语境中最先演示了这一点。

### 3.4 死锁检测：带超时的 DFS
- 传统 2PL 死锁检测：对等待图做周期性 DFS。
- Shore-MT 的优化：部分 DFS——仅从被阻塞节点开始遍历子图，而非整个图。
- 结合基于超时的中止：如果事务等待时间超过 N 毫秒，则中止它，而不是等待死锁检测器。
- 这种混合方式与 InnoDB 的做法非常接近（`innodb_deadlock_detect` + `innodb_lock_wait_timeout`）。

---

## 4. 权衡

| 收益 | 代价 |
|---|---|
| 首个多核 OLTP 瓶颈的量化图谱 | 硬件是 2009 年的：16 核 Xeon，无 NUMA，无 HT，无 SMT |
| 开源基线催生了 Silo/Hekaton/BwTree 的研究 | 2PL 基线现已过时——连 InnoDB 都通过争用感知调度（MySQL 8.0.20）做了优化 |
| 线程本地池证明了 3-5 倍的分配吞吐量提升 | 架构假定基于磁盘存储——瓶颈分析未干净地区分 I/O 停顿与锁争用 |
| 测量方法成为 OLTP 可扩展性论文的标准套路 | Shore-MT 的锁管理器比 InnoDB 简单——没有间隙锁、无 next-key 锁、无意向锁。瓶颈画像不能完全代表 InnoDB |

---

## 5. 论文摘要中未提及的失败模式

**来自论文自身的基准测试和后续工作：**

1. **锁管理器在 2 核时并非主要瓶颈。**意外发现：低并发时，缓冲池（页闩锁争用 + 缓冲区淘汰）占主导地位。锁管理器只在 8 核以上才成为第一瓶颈。含义：增加更多核心并不会线性地移动瓶颈——瓶颈画像会随核心数增加发生质变。

2. **日志 I/O 是硬性地板。**无论并发模型如何无锁，如果持久性需要同步日志写入，吞吐量受限于磁盘/闪存的写入带宽。Shore-MT 表明，在 16 核时，即使有专用日志刷盘线程，日志 I/O 仍消耗 25-30% 的事务延迟。

3. **线程本地池只解决了分配问题，未解决释放问题。**Shore-MT 的线程本地池只处理分配，释放走的是全局空闲链表（受互斥锁保护），在高流失率工作负载下成为新的瓶颈。Hekaton 后来用每线程垃圾链表 + 基于 epoch 的回收解决了这个问题。

4. **DFS 死锁检测的复杂度为等待图的 O(V+E)。**在 100+ 并发线程且访问模式复杂时，死锁检测开销占 CPU 的 5-8%。InnoDB 的 `lock_deadlock_detect()` 面临同样的扩展问题——MySQL 8.0 增加了 `innodb_deadlock_detect=OFF` 作为变通方案。

5. **基线数字是乐观的。**Shore-MT 的 TPC-C 工作负载使用了简化 schema（无二级索引、无外键约束、无触发器）。真实数据库有大量的额外锁交互（间隙锁、插入意向锁、自增锁），会改变瓶颈画像。

---

## 6. MySQL 代码邻近度

Shore-MT 的测量仪表直接映射到 InnoDB 的已知热点：

| Shore-MT 瓶颈 | InnoDB 对应物 | 文件 |
|---|---|---|
| 锁管理器哈希冲突 | `lock_sys->rec_hash` — 行锁哈希表 | `storage/innobase/lock/lock0lock.cc: lock_rec_hash()` |
| 死锁检测 DFS | `lock_deadlock_detect()` — 等待图 DFS | `storage/innobase/lock/lock0lock.cc: DeadlockChecker::search()` |
| 缓冲池页闩锁争用 | `buf_page_get_gen()` — 每页 RW-latch + `buf_pool->mutex` | `storage/innobase/buf/buf0buf.cc` |
| 日志缓冲互斥锁 | `log_sys->mutex` + `log_sys->write_mutex` — 串行化日志写入 | `storage/innobase/log/log0log.cc, log0write.cc` |
| 事务提交协调 | `trx_commit_for_mysql()` → `trx_commit_in_memory()` → `trx_commit_complete_for_mysql()` | `storage/innobase/trx/trx0trx.cc` |
| 线程本地分配 | `THD::mem_root` — 每 THD 区域 | `sql/sql_class.h` |

### MySQL 特有发现：
- **InnoDB 在 8+ 核时的瓶颈画像比 Shore-MT 更严重。**InnoDB 有间隙锁、next-key 锁和插入意向锁，是 Shore-MT 简单锁模型所忽略的。对 InnoDB 做一次现代版 Shore-MT 式测量，很可能会显示出更高的锁管理器开销。
- **MySQL 8.0 的争用感知事务调度（WL#11624）**直接针对 Shore-MT 识别出的模式：按数据访问模式排队事务以降低锁管理器争用。这是 MySQL "承认 Shore-MT 发现并在现有 2PL 框架内缓解"的路径。
- **线程本地池：**MySQL 已有每 THD 的 `MEM_ROOT`。差距在于*共享*数据结构的分配（如锁结构体、事务结构体）仍走全局分配器。

---

## 7. 产品映射

| 产品 | 状态 | 证据 |
|---|---|---|
| **MySQL 8.0** | 部分采纳 | 争用感知事务调度（WL#11624）直接回应了 Shore-MT 的发现。每 THD `MEM_ROOT` 用于线程本地分配。但锁管理器和缓冲池架构仍是经典 2PL。 |
| **Aurora** | 不适用 | Aurora 的存储层是日志结构且分离的。计算层不存在 Shore-MT 所测量的页闩锁瓶颈。 |
| **Percona** | 部分采纳 | Percona 的线程池插件和 `innodb_thread_concurrency` 调优遵循了 Shore-MT 的建议——将活跃线程数限制在争用悬崖以下。 |
| **MariaDB** | 部分采纳 | MariaDB 5.5+ 的线程池解决了类似的并发管理原则。 |

---

## 8. 性能论断（附实验条件）

**声称：**确定了传统基于锁的 OLTP 的可扩展性上限：8-16 核。量化了锁管理器占 16%、缓冲池占 12%、日志管理器占饱和状态下事务时间的 10%。

**实验条件：**
- **硬件：**4 插槽 4 核 Intel Xeon MP（共 16 核），32 GB RAM
- **数据集：**TPC-C（简化——无二级索引），100 仓库，全内存（缓冲池 100% 命中率）
- **工作负载：**TPC-C 混合（50% NewOrder，50% Payment），100% 内存
- **对比对象：**无——这是首个多线程 Shore，建立基线
- **关键结果：**1 核 10K TPS，8 核 30K TPS（3 倍扩展），**12-16 核处出现平台期**（不再扩展）。16 核时锁管理器 = 16% 周期。

**注意事项：**
- 硬件是 2009 年的——16 核 Xeon MP，非现代 32-128 核机器。扩展悬崖在今天的核心数下会出现在更高位置，但曲线形状相同。
- 无 NUMA 评估（4 插槽，但论文未做 NUMA 分区）
- TPC-C 简化（无二级索引 → 无索引锁争用）
- 仅内存（瓶颈画像中无 I/O 停顿）
- 在 16 核机器上 1→8 核仅 3 倍扩展，说明即使中等并发下也存在显著的串行化开销

---

## 9. MySQL 生态启示

1. **Shore-MT 是一面镜子——它科学地测量了 MySQL 的本来面目。**每个 InnoDB DBA 都直觉上知道"更多连接 = 更多锁争用"。Shore-MT 精确量化了多少、在哪里。

2. **基线已过时，但方法论永不过时。**今天没有人应该使用 Shore-MT 的 2009 年硬件数字。但*测量方法*——对每个争用点做周期精度测量——应该应用于现代 InnoDB 构建。这是一个具体项目：构建一个 Shore-MT 风格的带测量仪表的 InnoDB，发布现代瓶颈画像。

3. **对 MySQL 最具可操作性的发现：争用感知调度有效。**MySQL 8.0 的 WL#11624（争用感知事务调度）是 MySQL 对 Shore-MT 发现的直接回应。它没有消除锁——而是通过排队事务减少锁冲突。这是务实的工程路线，而非学术界的"把所有东西都换成无锁"路线。

4. **线程本地池在 MySQL 中已解决。**`THD::mem_root` 提供了每会话分配。剩余的分配争用在于共享结构（锁记录、事务对象）——仅占总分配的一小部分。

---

## 传承：各后继系统从 Shore-MT 继承了什么

| Shore-MT 概念 | Silo（SOSP 2013） | Hekaton（SIGMOD 2013） | BwTree（SIGMOD 2013） |
|---|---|---|---|
| **每连接一线程模型** | **放弃**：epoch 工作线程替代每事务线程 | **保留**：每个连接有一个工作线程，但无锁 | 不适用（数据结构，非完整引擎） |
| **线程本地分配池** | **保留并扩展**：每线程区域 + EBR 用于释放 | **保留并扩展**：每线程区域 + 基于 epoch 的 GC | **保留**：每线程页分配 |
| **2PL 锁管理器** | **放弃**：替换为基于 TID 的确定性序列化 | **放弃**：替换为 MVCC + 乐观验证 | 不适用（无事务级锁） |
| **死锁检测（DFS）** | **放弃**：确定性序列化下无死锁 | **放弃**：无死锁——改为中止并重试 | 不适用 |
| **瓶颈测量仪表** | **保留**：Silo 的评估明确对标 Shore-MT | **保留**：Hekaton 对标传统 SQL Server（类似瓶颈画像） | **保留**：BwTree 对标带闩锁的 BerkeleyDB B-tree |
| **缓冲池页闩锁** | **放弃**：Masstree 是无锁的 | **放弃**：BwTree + 无锁哈希索引 | **替换**：映射表 + 增量链 |
| **日志管理器（集中式）** | **保留但重新设计**：基于 epoch 的组提交替代日志互斥锁 | **保留但重新设计**：日志写入通过专用日志写入线程，非每事务写入 | 不适用 |
| **基于磁盘存储的假设** | **放弃**：仅内存 | **放弃**：仅内存优化表 | **假定内存**（后来适配了 SCM） |

### 经受生产检验而存活的思想：
- **线程本地池**——被全部三个后继系统和 InnoDB（`MEM_ROOT`）采纳。唯一一个普遍正确的思想。
- **瓶颈测量方法论**——成为所有 OLTP 论文的标准评估方法。
- **2PL 的替代**——三个后继系统都放弃了 2PL，但用了不同的替代方案。今天（2026）MySQL 中没有任何一个替代方案落地。

### 未能存活的思想：
- **2PL 本身**——被所有无锁后继系统放弃。但 MySQL 和大多数生产数据库仍在使用 2PL。学术共识与生产现实之间的鸿沟在这里非常显著。
- **DFS 死锁检测**——被全部三个后继系统放弃，因为它们的模型不会产生死锁。但 InnoDB 仍在使用 DFS 死锁检测（`lock0lock.cc` 中的 `lock_deadlock_detect()`）。

---

## 参见
- Silo 论文卡片（基于 epoch 的 2PL 替代方案）
- Hekaton 论文卡片（基于 MVCC 的 2PL 替代方案，生产环境部署）
- BwTree 论文卡片（无锁 B 树结构变更）
- @mns-reader：InnoDB 锁等待图与死锁检测（`lock0lock.cc: DeadlockChecker`）
- @mns-reader：现代 InnoDB 瓶颈画像（应用 Shore-MT 的测量方法论）
