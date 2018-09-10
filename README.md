# Affable-dashboard ![CI status](https://img.shields.io/badge/build-passing-brightgreen.svg)

Influencer dashboarding app for ranking, information and time-series graphs

## Installation
To install and run -

`$ npm install`

`$ node app.js`

## Prerequisites/Setup

`Only prerequisites is data from cassandra, redis and influxDB`

After starting the app, you can view influencer's dashboard at `http://localhost:3008/?userid=1000001`

## Benchmarks
Benchmarking on -
```
Macbook Air
8 GB 1600 MHz DDR3
1.6 GHz Intel Core i5
```

1. With single instance - able to produce 500 records/sec
2. With single instance, multiple workers - able to produce 800 records/sec
3. With single instance, multiple workers, batch produce in kafka (batch interval of 4 secs) - able to produce 1500 records/sec

## Scaling

Increasing instances, linearly would increase production rate.
For example: 10 instances could be divided into different ranges of consumption.

Instance 1 - produces for users between range 1000000 - 1100000

Instance 2 - produces for users between range 1100000 - 1200000

.

.

Instance 10 - produces for users between range 1900000 - 2000000

all producing parallelly to kafka topic...
