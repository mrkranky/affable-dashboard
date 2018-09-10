# Affable-dashboard ![CI status](https://img.shields.io/badge/build-passing-brightgreen.svg)

Influencer dashboarding app for ranking, information and time-series graphs

## Installation
To install and run -

`$ npm install`

`$ node app.js`

## Prerequisites/Setup

`Only prerequisite is data from cassandra, redis and influxDB`

After starting the app, you can view influencer's dashboard at `http://localhost:3008/?userid=1000001`

## WIKI

Please view this [WIKI](https://github.com/mrkranky/affable-dashboard/wiki) for images and other information related to dashboard.

## Performace

`User ranking is pulled out in O(log(N))`

`User information is searched from cassandra using primary index`

`Average Followers across all influencers is fetched in constant time of O(1)`

`After marking user suspicious, the change in user's dashboard is reflected instantly`

## ALSO

To mark a user suspicious

```
POST /mark_suspicious 

{
  userid: "1000001"
}
```
