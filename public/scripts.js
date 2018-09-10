$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
        .exec(window.location.search);

    return (results !== null) ? results[1] || 0 : false;
};

const userid = $.urlParam("userid");

// The data we are going to send in our request
let data = {
    userid: userid
};
// The parameters we are gonna pass to the fetch function
let fetchData = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    }
};

const loadTimeSeries = () => {
    fetch('/', fetchData)
    .then( response => {
        if (response.status !== 200) {
            console.log(response);
        }
        return response;
    })
    .then(response => response.json())
    .then(parsedResponse => {
        const unpackData = (arr, key) => {
            return arr.map(obj => obj[key])
        };
        const firstTrace = {
            type: 'scatter',
            mode: 'lines',
            name: 'Mean User Following',
            x: unpackData(parsedResponse, 'time'),
            y: unpackData(parsedResponse, 'mean_followers'),
            line: {color: '#17BECF'}
        };
        const secondTrace = {
            type: 'scatter',
            mode: 'lines',
            name: 'Mean User Follower',
            x: unpackData(parsedResponse, 'time'),
            y: unpackData(parsedResponse, 'mean_following'),
            line: {color: '#17BECF'}
        };
        const thirdTrace = {
            type: 'scatter',
            mode: 'lines',
            name: 'Mean User Follower Ratio',
            x: unpackData(parsedResponse, 'time'),
            y: unpackData(parsedResponse, 'mean_follower_ratio'),
            line: {color: '#17BECF'}
        };

        const data1 = [firstTrace];
        const layout1 = {
            title: 'Followers'
        };
        Plotly.newPlot('follower-container', data1, layout1);

        const data2 = [secondTrace];
        const layout2 = {
            title: 'Following',
        };
        Plotly.newPlot('following-container', data2, layout2);

        const data3 = [thirdTrace];
        const layout3 = {
            title: 'Follower Ratio',
        };
        Plotly.newPlot('followerratio-container', data3, layout3);
        return;
    })
    .catch( error => console.log(error) );
};

const loadData = () => {
    fetch('/data', fetchData)
        .then( response => {
            if (response.status !== 200) {
                console.log(response);
            }
            return response;
        })
        .then(response => response.json())
        .then(parsedResponse => {
            let res = JSON.parse(parsedResponse);
            let username = res.username;
            let follower = res.followercount;
            let following = res.followingcount;
            let suspicious = res.issuspicious;

            // update the div
            $('#user-username').text("username: " + username);
            $('#user-follower').text("followers: " + follower);
            $('#user-following').text("following: " + following);

            if (suspicious) {
                $('#user-suspicious').text("THIS USER IS SUSPICIOUS!");
            }
        })
        .catch( error => console.log(error) );
};

const loadRank = () => {
    fetch('/rank', fetchData)
        .then( response => {
            if (response.status !== 200) {
                console.log(response);
            }
            return response;
        })
        .then(response => response.json())
        .then(parsedResponse => {
            let res = JSON.parse(parsedResponse);
            let rank = res.rank;
            let count = res.count;

            // update the div
            $('.rank').text("Rank " + rank + "/" + count);
        })
        .catch( error => console.log(error) );
};

const loadAverage = () => {
    fetch('/average', fetchData)
        .then( response => {
            if (response.status !== 200) {
                console.log(response);
            }
            return response;
        })
        .then(response => response.json())
        .then(parsedResponse => {
            let res = JSON.parse(parsedResponse);
            let average = Math.round(parseFloat(res.average) * 100) / 100;

            // update the div
            $('#user-avg').text("Average followers: " + average);
        })
        .catch( error => console.log(error) );
};

loadTimeSeries();
loadRank();
loadData();
loadAverage();
setInterval(loadTimeSeries, 60000);
setInterval(loadData, 10000);
setInterval(loadAverage, 10000);
setInterval(loadRank, 10000);