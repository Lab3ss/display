const axios = require('axios');
const config = require("config");

const Tweet = require('../../schemas/Tweet');

const API = 'https://api.twitter.com/1.1';
const LOCATION_ID = 23424819; // France
const token = config.get("twitter.token");

const loadTweets = async () => {
    // Looking for top 5 trends in France
    let res = await axios({
        url: `${API}/trends/place.json?id=${LOCATION_ID}`,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (res.status === 200 && res.data?.length > 0) {
        const trends = res.data[0].trends.slice(0, 5);
        const promises = []
        for (const trend of trends) {
            const url = `${API}/search/tweets.json?q=${trend.query}&lang=fr&result_type=popular&count=5&include_entities=true&tweet_mode=extended`
            console.info(`Fetch : ${url}`)
            promises.push(
                axios({
                    url,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            )
        }
        res  = await Promise.all(promises);
        res = res.filter(r => r.status === 200 && r.data)
        const tweets = []
        for (const trend of res) {
            console.info(`${trend.data.statuses.length} tweets in trend ${trend.data.search_metadata.query}`)
           for (const t of trend.data.statuses) {
                tweets.push({
                    type: 'tweet',
                    id: t.id_str,
                    createdAt: t.created_at,
                    text: t.full_text || t.text,
                    entities: t.entities,
                    user: {
                        name: t.user?.name,
                        screenName: t.user?.screen_name,
                        profilePicture: t.user?.profile_image_url_https,
                        profileBanner: t.user?.profile_banner_url,
                        followers: t.user?.followers_count,
                        verified: t.user?.verified,
                    }
                })
           } 
        }
        console.info(`=> ${tweets.length} tweets added`)
        await Tweet.deleteMany();
        await Tweet.insertMany(tweets);
    }
}

module.exports = loadTweets;
