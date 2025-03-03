# kafka

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://github.com/apache/kafka/workflows/Build/badge.svg)](https://github.com/apache/kafka/actions)

Apache Kafka is a distributed streaming platform designed to build real-time data pipelines and streaming applications. It is horizontally scalable, fault-tolerant, fast, and runs in production in thousands of companies.

## Key Features

- Publish and subscribe to streams of records
- Store streams of records durably
- Process streams of records as they occur
- Distribute data between multiple nodes for reliability

## Getting Started

1. Download Kafka
2. Start the server
3. Create a topic
4. Start producing and consuming messages

For detailed documentation, visit [Apache Kafka website](https://kafka.apache.org/). -->

<!-- to show all topics -->

docker exec -it <container_id> kafka-topics --list --bootstrap-server localhost:9092

docker exec -it <container_id> kafka-console-consumer --bootstrap-server localhost:9092 --topic test-topic --from-beginning

<!--  -->
