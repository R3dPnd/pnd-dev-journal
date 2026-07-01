# Kafka

## Intro

Apache Kafka is a distributed event streaming platform. It acts as a durable, high-throughput message bus that decouples producers (writers) from consumers (readers) while retaining messages for a configurable period of time.

Unlike a traditional message queue where messages are deleted after consumption, Kafka stores events in an append-only log. Multiple consumer groups can read the same stream independently, and consumers can replay history from any offset.

**Why teams reach for Kafka:**

- **Durability** — messages are persisted to disk and replicated across brokers
- **Throughput** — designed for millions of events per second across a cluster
- **Scalability** — horizontal scaling via partitions and broker clusters
- **Replay** — consumers can re-read past events, enabling audit trails and reprocessing
- **Decoupling** — services communicate through events instead of direct API calls

---

## Core Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Producer   │     │  Producer   │     │  Producer   │
│ (Order Svc) │     │ (User Svc)  │     │ (Payment)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
              ┌────────────────────────┐
              │     Kafka Cluster      │
              │  ┌──────┐ ┌──────┐     │
              │  │Broker│ │Broker│ ... │
              │  └──┬───┘ └──┬───┘     │
              │     │ Topics / Partitions│
              └─────┼──────────────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Consumer    │ │ Consumer    │ │ Consumer    │
│ Group A     │ │ Group B     │ │ Group C     │
│ (Analytics) │ │ (Email Svc) │ │ (Audit Log) │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Key Components

| Component | Role |
|-----------|------|
| **Broker** | A Kafka server that stores data and serves client requests |
| **Topic** | A named category/stream of events (e.g. `orders`, `user-signups`) |
| **Partition** | A topic is split into partitions for parallelism and ordering within a partition |
| **Producer** | Publishes records to one or more topics |
| **Consumer** | Reads records from topics, tracking position via an **offset** |
| **Consumer Group** | A set of consumers that cooperatively divide partition work |
| **ZooKeeper / KRaft** | Cluster metadata and controller election (KRaft replaces ZooKeeper in modern Kafka) |

---

## Topics and Partitions

A topic is the logical name for a stream. Physically, it is divided into **partitions** — ordered, immutable sequences of records.

```
Topic: "orders"
┌─────────────────────────────────────────────────────────────┐
│ Partition 0:  [0] [1] [2] [3] [4] [5] ...                   │
│ Partition 1:  [0] [1] [2] [3] ...                           │
│ Partition 2:  [0] [1] [2] [3] [4] ...                       │
└─────────────────────────────────────────────────────────────┘
     ▲                              ▲
     │                              │
  Producer                    Consumer reads
  (key=orderId)               from offset N
```

**Ordering guarantee:** Kafka guarantees order *within a partition*, not across partitions. Use a **message key** to route related events to the same partition:

```
key = userId "abc123"  →  always lands in Partition 1
key = userId "xyz789"  →  always lands in Partition 0
```

**Replication:** Each partition has one **leader** broker and zero or more **follower** replicas for fault tolerance. If the leader fails, a follower is elected as the new leader.

---

## Producers and Consumers

### Producer flow

```
Producer
   │
   ├─ Serialize record (key + value)
   ├─ Choose partition (by key hash, round-robin, or custom)
   ├─ Send to broker leader
   └─ Receive ack (0, 1, or all replicas)
```

**Acknowledgement levels (`acks`):**

| Setting | Behavior | Trade-off |
|---------|----------|-----------|
| `acks=0` | Fire and forget | Fastest, no durability guarantee |
| `acks=1` | Leader confirms write | Balanced; leader failure may lose data |
| `acks=all` | All in-sync replicas confirm | Safest; slightly higher latency |

### Consumer groups

Each consumer in a group is assigned one or more partitions. Kafka rebalances assignments when consumers join or leave.

```
Topic "events" (3 partitions)
Consumer Group "email-service" (2 consumers)

  Partition 0  ──►  Consumer A
  Partition 1  ──►  Consumer A
  Partition 2  ──►  Consumer B

Topic "events" (3 partitions)
Consumer Group "analytics" (3 consumers)

  Partition 0  ──►  Consumer X
  Partition 1  ──►  Consumer Y
  Partition 2  ──►  Consumer Z
```

Different consumer groups read the **same topic independently** — each maintains its own offset position.

### Offsets

An offset is a sequential ID for each record within a partition. Consumers commit offsets to track progress.

```
Partition 0:  offset 0   1   2   3   4   5
                              ▲
                              │
                    consumer committed here (offset 3)
                    next read starts at offset 4
```

---

## Kafka vs Traditional Message Queues

```
Traditional Queue (RabbitMQ, SQS)          Kafka
─────────────────────────────────        ─────────────────────────────
Message deleted after ack                Messages retained (time/size limit)
One consumer per message                 Multiple consumer groups per topic
Push-based delivery                      Pull-based (consumer polls)
Good for task distribution               Good for event streaming & replay
```

| Use Kafka when... | Use a queue when... |
|-------------------|---------------------|
| You need event history and replay | You need simple task handoff |
| Multiple services react to the same event | Each message goes to exactly one worker |
| High throughput event pipelines | Low-latency RPC-style messaging |
| Stream processing (Kafka Streams, Flink) | Complex routing with per-message TTL |

---

## Message Format

A Kafka record consists of:

```
┌──────────────────────────────────────────┐
│  Key (optional)     →  partition routing │
│  Value (required)   →  payload (JSON, Avro, Protobuf, etc.) │
│  Timestamp          →  broker or producer time │
│  Headers (optional) →  metadata key-value pairs │
└──────────────────────────────────────────┘
```

**Schema management:** In production, teams often use **Confluent Schema Registry** or similar to enforce Avro/Protobuf schemas and enable safe schema evolution.

---

## Quick Start with Docker

Spin up a local Kafka cluster for experimentation:

```bash
# docker-compose.yml (simplified)
services:
  kafka:
    image: apache/kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

```bash
docker compose up -d
```

### CLI examples

```bash
# Create a topic
kafka-topics.sh --create \
  --topic orders \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092

# Produce messages (interactive)
kafka-console-producer.sh \
  --topic orders \
  --bootstrap-server localhost:9092
# > {"orderId": "001", "amount": 49.99}
# > {"orderId": "002", "amount": 12.50}

# Consume from the beginning
kafka-console-consumer.sh \
  --topic orders \
  --from-beginning \
  --bootstrap-server localhost:9092

# Describe a topic (partitions, leaders, replicas)
kafka-topics.sh --describe \
  --topic orders \
  --bootstrap-server localhost:9092
```

---

## Code Examples

### Python (confluent-kafka)

```python
from confluent_kafka import Producer, Consumer

# --- Producer ---
def delivery_report(err, msg):
    if err:
        print(f"Delivery failed: {err}")
    else:
        print(f"Delivered to {msg.topic()} [{msg.partition()}] @ {msg.offset()}")

producer = Producer({"bootstrap.servers": "localhost:9092"})

order = '{"orderId": "001", "userId": "abc123", "amount": 49.99}'
producer.produce(
    topic="orders",
    key="abc123",          # routes to consistent partition
    value=order,
    callback=delivery_report,
)
producer.flush()

# --- Consumer ---
consumer = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "order-processor",
    "auto.offset.reset": "earliest",  # start from beginning if no offset
})

consumer.subscribe(["orders"])

while True:
    msg = consumer.poll(1.0)
    if msg is None:
        continue
    if msg.error():
        print(f"Error: {msg.error()}")
        continue

    print(f"Received: key={msg.key()} value={msg.value()} offset={msg.offset()}")
    # process order...
    # consumer.commit()  # manual commit for at-least-once semantics
```

### Java (kafka-clients)

```java
// Producer
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "all");

Producer<String, String> producer = new KafkaProducer<>(props);

ProducerRecord<String, String> record =
    new ProducerRecord<>("orders", "abc123", "{\"orderId\":\"001\",\"amount\":49.99}");

producer.send(record, (metadata, exception) -> {
    if (exception == null) {
        System.out.printf("Sent to partition %d offset %d%n",
            metadata.partition(), metadata.offset());
    }
});
producer.close();

// Consumer
Properties cProps = new Properties();
cProps.put("bootstrap.servers", "localhost:9092");
cProps.put("group.id", "order-processor");
cProps.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
cProps.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
cProps.put("enable.auto.commit", "false");

Consumer<String, String> consumer = new KafkaConsumer<>(cProps);
consumer.subscribe(List.of("orders"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("key=%s value=%s offset=%d%n",
            record.key(), record.value(), record.offset());
    }
    consumer.commitSync();  // commit after successful processing
}
```

### Node.js (kafkajs)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// Producer
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders',
  messages: [
    { key: 'abc123', value: JSON.stringify({ orderId: '001', amount: 49.99 }) },
  ],
});
await producer.disconnect();

// Consumer
const consumer = kafka.consumer({ groupId: 'order-processor' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: true });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      key: message.key?.toString(),
      value: message.value.toString(),
      offset: message.offset,
    });
  },
});
```

---

## Delivery Semantics

```
┌─────────────────────────────────────────────────────────────┐
│  At-most-once    │  Message may be lost, never duplicated  │
│  At-least-once   │  Message never lost, may be duplicated  │
│  Exactly-once    │  Each message processed once (EOS)      │
└─────────────────────────────────────────────────────────────┘
```

**At-least-once** is the most common production choice:

1. Consumer reads message
2. Consumer processes message (e.g. writes to DB)
3. Consumer commits offset

If the process crashes between steps 2 and 3, the message is reprocessed on restart. Design consumers to be **idempotent** (safe to process the same event twice).

**Exactly-once** requires transactional producers and idempotent consumers — more complex, used when financial correctness demands it.

---

## Common Patterns

### Event-driven microservices

```
User signs up
     │
     ▼
[user.signups] topic
     │
     ├──► Email service     → sends welcome email
     ├──► Analytics service → tracks conversion
     └──► CRM service       → creates lead record
```

Each service is independent. Adding a new subscriber does not require changing the producer.

### Change Data Capture (CDC)

```
PostgreSQL ──► Debezium ──► Kafka ──► Search index / Data warehouse
              (reads WAL)
```

Database changes are streamed as events, keeping downstream systems in sync without polling.

### Stream processing

```
[raw-clicks] ──► Kafka Streams / Flink ──► [aggregated-metrics]
```

Process events in real time: windowed counts, joins across topics, filtering, enrichment.

---

## Configuration Essentials

| Setting | What it controls | Typical value |
|---------|------------------|---------------|
| `retention.ms` | How long messages are kept | 7 days (604800000 ms) |
| `num.partitions` | Parallelism for a topic | 6–12 for moderate throughput |
| `replication.factor` | Fault tolerance | 3 in production |
| `min.insync.replicas` | Minimum replicas for `acks=all` | 2 |
| `compression.type` | Payload compression | `lz4` or `zstd` |
| `max.poll.records` | Batch size per consumer poll | Tune based on processing time |

**Rule of thumb:** `replication.factor` × `min.insync.replicas` should allow one broker failure without blocking writes.

---

## Best Practices

### Producers

- Always set a **key** when ordering matters for a logical entity (user, order, session)
- Use `acks=all` in production for durability
- Enable **idempotent producer** (`enable.idempotence=true`) to prevent duplicates on retry
- Serialize with a schema (Avro/Protobuf) rather than raw JSON in large systems

### Consumers

- Keep processing logic **idempotent** — assume at-least-once delivery
- Tune `max.poll.interval.ms` so slow processing does not trigger rebalance
- Use **manual commits** when you need processing and offset commit to be atomic
- Scale by adding consumers up to the partition count (more consumers than partitions sit idle)

### Topics

- Name topics clearly: `domain.entity.event` (e.g. `billing.invoice.created`)
- Size partitions for expected throughput — too many partitions increases overhead
- Set retention based on replay needs, not "forever" (storage costs add up)

### Operations

- Monitor consumer lag (how far behind the latest offset)
- Alert on under-replicated partitions
- Test failure scenarios: broker down, consumer crash, network partition

---

## Monitoring: Consumer Lag

```
Latest offset on broker:     10,000
Consumer committed offset:    9,200
                              ─────
Consumer lag:                   800  ← events behind
```

High lag means consumers cannot keep up. Fix by scaling consumers, optimizing processing, or adding partitions (with a planned rebalance).

---

## Common Issues

Operational problems you are likely to hit in dev and production — symptoms, typical errors, root cause, and how to fix them.

### Connection and bootstrap failures

**Symptom:** Producer or consumer hangs, times out, or fails immediately on startup.

```
ERROR: Connection to node -1 (localhost/127.0.0.1:9092) could not be established
WARN  Connection to node 1 could not be established. Broker may not be available.
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Broker not running | Start the broker; confirm port 9092 is listening |
| Wrong `bootstrap.servers` address | Match the address clients use to reach the broker (not an internal Docker hostname from the host machine) |
| `advertised.listeners` misconfigured | Clients connect to the *advertised* address returned by the broker — set it to an address clients can actually reach |
| Firewall / security group blocking 9092 | Open the port between producers, consumers, and brokers |
| TLS/SASL mismatch | Client uses `PLAINTEXT` but broker expects `SASL_SSL` (or vice versa) — align `security.protocol` |

**Local Docker fix (very common):**

```
Host machine client  ──X──►  broker advertises "kafka:9092" (internal DNS)
                              client cannot resolve "kafka"

Fix: KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
```

**Diagnostic commands:**

```bash
# Is the broker accepting connections?
nc -zv localhost 9092

# Can the CLI reach the cluster?
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# List brokers in the cluster
kafka-metadata.sh --snapshot /path/to/meta.properties --print-brokers
```

---

### `UnknownTopicOrPartitionException`

**Symptom:** Produce or consume fails right after creating a topic or deploying a new service.

```
org.apache.kafka.common.errors.UnknownTopicOrPartitionException:
  This server does not host this topic-partition
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Topic does not exist | Create it explicitly or enable `auto.create.topics.enable` (dev only) |
| Topic just created — metadata not propagated yet | Retry with backoff; metadata refresh is async |
| Typo in topic name | Producer and consumer must use the exact same string (`Orders` ≠ `orders`) |
| Request sent to wrong cluster | Verify `bootstrap.servers` points to the intended environment |

```bash
# Verify the topic exists
kafka-topics.sh --list --bootstrap-server localhost:9092

# Check partition leaders are assigned
kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092
```

---

### `NOT_LEADER_OR_FOLLOWER` / `Leader not available`

**Symptom:** Intermittent produce/consume failures, especially during broker restarts or rolling upgrades.

```
org.apache.kafka.common.errors.NotLeaderOrFollowerException
WARN  [Producer] Received invalid metadata error ... requesting metadata update
```

**What is happening:**

```
Partition 0 leader: Broker 1  (crashed)
                  ↓
Controller elects Broker 2 as new leader
                  ↓
Clients refresh metadata and retry  ← brief window of errors is normal
```

**Fix:**

- Retry with exponential backoff in clients (most SDKs do this automatically)
- Ensure `replication.factor` ≥ 2 in production so followers can be promoted
- Check `min.insync.replicas` — if too many brokers are down, writes are intentionally blocked
- Wait for the cluster to stabilize before declaring an incident

```bash
# Find partitions with no leader
kafka-topics.sh --describe --under-replicated-partitions \
  --bootstrap-server localhost:9092

# Check broker log for controller election messages
```

---

### Consumer group rebalance loop

**Symptom:** Consumer repeatedly joins/leaves the group; messages are reprocessed; logs show constant rebalancing.

```
INFO  Revoking previously assigned partitions [...]
INFO  (Re-)joining group
WARN  Consumer group exceeded max.poll.interval.ms
ERROR Member failed to heartbeat; removing from group
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Processing takes longer than `max.poll.interval.ms` (default 5 min) | Increase `max.poll.interval.ms` or speed up processing |
| `max.poll.records` too high — batch cannot finish in time | Lower `max.poll.records` |
| Long GC pauses or thread blocking | Profile the consumer; move heavy work off the poll thread |
| Too many consumers joining/leaving | Stabilize consumer count; use static membership (`group.instance.id`) |
| Network instability between consumer and broker | Fix connectivity; tune `session.timeout.ms` and `heartbeat.interval.ms` |

**Rule of thumb:**

```
max.poll.interval.ms  >  (worst-case batch processing time) × 2
heartbeat.interval.ms <  session.timeout.ms / 3
```

---

### Growing consumer lag

**Symptom:** Lag metric climbs steadily; consumers appear healthy but fall further behind.

```
Consumer lag for group "order-processor" on topic "orders":
  Partition 0: 45,000
  Partition 1: 43,200
  Partition 2: 44,800
```

**Diagnosis flow:**

```
Lag growing?
    │
    ├─ Consumers running? ──NO──► Restart / fix crash loop
    │
    ├─ YES ──► Processing slow? ──YES──► Optimize code, scale consumers,
    │                                    or add partitions
    │
    ├─ NO ──► Producer spike? ──YES──► Temporary — scale consumers or
    │                                   wait for catch-up
    │
    └─ Partitions uneven? ──YES──► Hot partition — revisit key strategy
```

**Fixes:**

- Add consumers up to the partition count (adding more won't help beyond that)
- Optimize per-message processing (DB batching, async I/O)
- Increase partitions (requires planned migration — existing keys may redistribute)
- Check for a **hot partition** where one key dominates traffic

---

### `OffsetOutOfRangeException`

**Symptom:** Consumer fails on startup or after a config change.

```
org.apache.kafka.common.errors.OffsetOutOfRangeException:
  Requested offset 500 is out of range for partition orders-0
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Committed offset points to purged data (retention expired) | Reset consumer group offset or set `auto.offset.reset=earliest` |
| Manually set invalid offset | Use `kafka-consumer-groups.sh --reset-offsets` carefully |
| Topic was deleted and recreated | Offsets from the old topic are invalid — reset the group |

```bash
# Inspect committed offsets
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor --describe

# Reset to earliest (destructive — reprocesses all messages)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor \
  --topic orders \
  --reset-offsets --to-earliest \
  --execute
```

---

### Duplicate messages

**Symptom:** Downstream DB shows duplicate records; idempotency checks fail intermittently.

**Common causes:**

| Cause | Fix |
|-------|-----|
| At-least-once delivery + consumer retry | Make processing idempotent (upsert by event ID, dedup table) |
| Producer retries without idempotence | Enable `enable.idempotence=true` on the producer |
| Rebalance during processing | Commit offsets only after successful processing; handle revoke callback |
| Consumer crash after processing, before commit | Same as above — design for redelivery |

**Idempotent consumer pattern:**

```python
def process(event):
    if db.exists(event["id"]):
        return  # already handled — safe to skip
    db.insert(event)
```

---

### `RecordTooLargeException`

**Symptom:** Producer send fails for specific messages.

```
org.apache.kafka.common.errors.RecordTooLargeException:
  The message is 2,104,576 bytes when serialized which is larger than
  the maximum request size 1048576
```

**Fix:**

- Keep messages under `message.max.bytes` (broker default: 1 MB)
- Store large payloads in S3/Blob storage; put a reference URL in the Kafka record
- If you truly need larger messages, raise `message.max.bytes` on broker *and* `max.request.size` on producer (not recommended as a default)

---

### Serialization / deserialization errors

**Symptom:** Consumer crashes on a specific message; deserialization exception in logs.

```
SerializationException: Error deserializing Avro message
Caused by: Schema mismatch: field "amount" not found
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Producer and consumer use different schemas | Register schemas in Schema Registry; enforce compatibility (BACKWARD, FULL) |
| JSON field renamed without coordination | Treat schema changes as API changes — version your events |
| Wrong deserializer configured | Match serializer type (String, Avro, Protobuf) on both sides |
| Corrupt or non-JSON payload in topic | Send bad records to a dead-letter topic (DLQ) for inspection |

**Dead-letter topic pattern:**

```
main topic ──► consumer ──► process OK ──► commit offset
                  │
                  └─ deserialize/process fail ──► produce to orders.dlq
```

---

### Authorization failures (ACLs)

**Symptom:** Operations fail with authorization errors after enabling SASL/ACLs.

```
org.apache.kafka.common.errors.TopicAuthorizationException:
  Not authorized to access topics: [orders]
```

**Fix:**

```bash
# Grant a producer write access
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:order-service \
  --operation Write --topic orders

# Grant a consumer group read access
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:order-processor \
  --operation Read --topic orders

kafka-acls.sh --bootstrap-server localhost:9092 \
  --add --allow-principal User:order-processor \
  --operation Read --group order-processor
```

Principle of least privilege: producers get `Write`; consumers get `Read` on their topics and consumer group.

---

### Disk full / log retention pressure

**Symptom:** Broker refuses writes; logs mention log segment or disk errors.

```
ERROR Kafka storage error; shutting down
WARN  Disk usage 95% on /var/kafka/data — consider reducing retention
```

**Fix:**

- Lower `retention.ms` or `retention.bytes` on high-volume topics
- Add disk capacity or add brokers and rebalance partitions
- Enable compression (`compression.type=lz4` or `zstd`) to reduce storage footprint
- Monitor disk usage per broker — Kafka is append-heavy and fills disks predictably

```bash
# Check per-topic disk usage (approximate via log sizes)
du -sh /var/kafka/data/*/orders-*

# Alter retention on a topic
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders \
  --alter --add-config retention.ms=2592000000
```

---

### Messages silently "lost"

**Symptom:** Producer reports success but consumer never sees the message (or vice versa).

**Checklist:**

```
Producer says OK?
    │
    ├─ acks=0? ──YES──► Message may never have arrived — use acks=all
    │
    ├─ Wrong topic name? ──► Verify with console consumer on that exact topic
    │
    ├─ Consumer in different cluster? ──► Compare bootstrap.servers
    │
    ├─ Consumer offset already past message? ──► Check committed offset vs log end
    │
    ├─ Consumer group already consumed it? ──► Reset offset or use new group id
    │
    └─ Message expired via retention? ──► Check retention.ms and broker timestamps
```

```bash
# See the latest offsets on a partition
kafka-get-offsets.sh --bootstrap-server localhost:9092 \
  --topic orders --time -1

# Consume without a consumer group (reads everything)
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic orders --from-beginning --max-messages 10
```

---

### Quick diagnostic cheat sheet

| Symptom | First command to run |
|---------|---------------------|
| Cannot connect | `kafka-broker-api-versions.sh --bootstrap-server <host>:9092` |
| Topic problems | `kafka-topics.sh --describe --topic <name>` |
| Consumer lag | `kafka-consumer-groups.sh --describe --group <group>` |
| Stuck consumer group | `kafka-consumer-groups.sh --describe --group <group> --members --verbose` |
| ACL denied | `kafka-acls.sh --list --principal User:<name>` |
| Broker health | Check broker logs for `ERROR` / `WARN`; verify disk and JVM heap |

---

## Common Pitfalls

| Pitfall | What goes wrong | Fix |
|---------|-----------------|-----|
| No message key | Ordering breaks across events for the same entity | Set key to entity ID |
| Auto-commit + slow processing | Message lost if crash after processing but before commit | Manual commit after processing |
| More consumers than partitions | Extra consumers do nothing | Match consumer count to partitions |
| Tiny retention | Cannot replay after incident | Set retention to cover recovery window |
| Giant messages | Broker rejects or performance tanks | Keep under 1 MB; use external storage for blobs |
| Ignoring rebalance | Duplicate processing during consumer join/leave | Handle `onRevoke` / `onAssign` callbacks |

---

## When NOT to Use Kafka

- Simple request/response between two services (use HTTP/gRPC)
- Low-volume cron-style jobs (use a task queue)
- You need complex per-message routing with TTL (RabbitMQ may be simpler)
- Team lacks ops capacity to run a distributed cluster (consider managed Kafka: Confluent Cloud, AWS MSK, Upstash)

---

## Ecosystem

| Tool | Purpose |
|------|---------|
| **Kafka Connect** | Import/export data to external systems (DBs, S3, Elasticsearch) |
| **Kafka Streams** | JVM library for stream processing |
| **ksqlDB** | SQL interface over Kafka streams |
| **Schema Registry** | Centralized schema management |
| **Debezium** | CDC connectors for databases |
| **Apache Flink** | Advanced stream processing (Kafka as source/sink) |

---

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Developer Guides](https://developer.confluent.io/)
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/kafka-the-definitive-guide/) (O'Reilly)
- [CloudEvents Specification](https://cloudevents.io/) — standard event envelope format
- Local practice: [Redpanda](https://redpanda.com/) or Apache Kafka Docker images

---

## Next Steps

- [ ] Run the Docker quick start and produce/consume via CLI
- [ ] Build a small producer/consumer in your language of choice
- [ ] Experiment with multiple consumer groups on the same topic
- [ ] Introduce a schema (Avro) with Schema Registry
- [ ] Monitor consumer lag with a tool like Kafka UI or AKHQ
