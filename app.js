const Influx = require('influx');
const express = require('express');
const path = require('path');
const os = require('os');
const bodyParser = require('body-parser');
const app = express();
const influx = new Influx.InfluxDB('http://127.0.0.1:8086/affable_influencers');

const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['localhost'], keyspace: 'affable' });

// Use the default config
const redisClient = require('then-redis').createClient();

redisClient.on("error", function (err) {
    console.log("Error connecting to redis - " + err);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', 3008);

influx.getMeasurements()
  .then(names => console.log('My measurement names are: ' + names.join(', ')))
  .then(() => {
    app.listen(app.get('port'), () => {
      console.log(`Listening on ${app.get('port')}.`);
    });
  })
  .catch(error => console.log({ error }));

app.post('/', function(req, res) {
    const user_id = req.body.userid;
    console.log(req.body);
    influx.query(
        `SELECT mean("following") AS "mean_following", mean("followers") AS "mean_followers", 
        mean("followerratio") AS "mean_follower_ratio" 
        FROM "affable_influencers"."defaultPolicy"."influencer-stat" 
        WHERE time > now() - 12h AND "userid"=${Influx.escape.stringLit(user_id)} GROUP BY time(1m) FILL(previous)
        `)
        .then(result => res.status(200).json(result))
        .catch(error => res.status(500).json({ error }));
});

app.post('/data', function (req, res) {
    const user_id = req.body.userid;
    console.log(user_id);

    const query = 'SELECT * FROM users WHERE userid = ' + user_id;
    client.execute(query)
        .then(result => {
            if (result.rows.length > 0) {
                return res.status(200).json(JSON.stringify(result.rows[0]))
            } else {
                throw "No result found..."
            }
        })
        .catch(err => res.status(500).json({ err }));
});

app.post('/rank', function (req, res) {
    const user_id = req.body.userid;
    console.log(user_id);

    redisClient.hget("USER_TO_SCORE", user_id)
    .then(score => {
        if (score !== null) {
            console.log("score: " + score);
            return redisClient.zrevrank("SORTED_SCORE", score);
        } else {
            throw "user not found";
        }
    })
    .then(rank => {
        console.log("rank: " + rank);
        if (rank !== null) {
            return [redisClient.zcard("SORTED_SCORE"), rank];
        } else {
            throw "user not found";
        }
    })
    .then(([promise, rank]) => {
        promise.then(count => {
            console.log(count);
            return res.status(200).json(JSON.stringify({rank: rank+1, count: count}));
        })
    })
    .catch(err => {
        return res.status(500).json({message: err});
    });
});

app.post('/average', function (req, res) {
    redisClient.hget("FOLLOWER_AVERAGE", "avg")
    .then(average => {
        if (average !== null) {
            return res.status(200).json(JSON.stringify({average: average}));
        } else {
            throw "Error fetching average";
        }
    })
    .catch(err => {
        return res.status(500).json({message: err});
    });
});

app.post('/mark_suspicious', function (req, res) {
    const user_id = req.body.userid;
    console.log(user_id);

    // mark the user in db that he is suspicious
    const query = 'UPDATE affable.users SET issuspicious=true WHERE userid = ' + user_id;

    redisClient.hget("SUSPICIOUS", user_id)
        .then(result => {
            if (result !== null) {
                throw "already marked suspicious";
            }
        })
        .then(result => {
            client.execute(query)
            .then(result => {
                // add the user to redis suspicious list
                return redisClient.hset("SUSPICIOUS", user_id, "");
            })
            .then(result => {
                return redisClient.hget("USER_TO_SCORE", user_id);
            })
            .then(old_score => {
                if (old_score !== null) {
                    return [redisClient.hincrby("DISTINCT_SCORE", old_score, -1), old_score];
                } else {
                    throw "error marking suspicious"
                }
            })
            .then(([promise, old_score]) => {
                promise
                .then(old_count => {
                    redisClient.multi();
                    redisClient.hdel("USER_TO_SCORE", user_id);
                    if (old_count === 0) {
                        redisClient.zrem("SORTED_SCORE", old_score);
                        redisClient.hdel("DISTINCT_SCORE", old_score);
                    }
                    return redisClient.exec();
                });
            })
        })
        .then(result => {
            return res.status(200).json({message: 'marked user suspicious'});
        })
        .catch(err => res.status(500).json({ message:err }));
});