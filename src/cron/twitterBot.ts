import prisma from '../db/db';
import TwitterApi from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY!,
  appSecret: process.env.TWITTER_APP_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});


export async function tweetLatestJobs() {
  const jobs = await prisma.job.findMany({
    take: 3,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  });

  if (!jobs.length) {
    console.log('No jobs found.');
    return;
  }

  const { data: header } = await client.v2.tweet(
    `🚀 Latest jobs from WorkWay – your curated tech job source!\n\n🔗 workway.dev`
  );
  let previousTweetId = header.id;

  for (const job of jobs) {
    const tweetText = formatTweet(job);
    const { data: reply } = await client.v2.reply(tweetText, previousTweetId);
    previousTweetId = reply.id;
  }

  await client.v2.reply(
    `✨ Explore more opportunities at\n🌐 https://workway.dev`,
    previousTweetId
  );
}

function formatTweet(job: any) {
  return `💼 Title – ${job.title}
🏢 Company – ${job.company}
📍 Location – ${job.location}
🎯 Experience – ${job.experienceLevel}

🔗 ${job.absolute_url}`;
}
