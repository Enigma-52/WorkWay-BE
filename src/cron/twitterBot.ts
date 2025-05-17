import prisma from '../db/db';
import TwitterApi from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY!,
  appSecret: process.env.TWITTER_APP_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

export async function tweetLatestJobs() {
  const requiredEnv = ['TWITTER_APP_KEY', 'TWITTER_APP_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      console.error(`❌ Missing env var: ${key}`);
      process.exit(1);
    }
  }

  const jobs = await prisma.job.findMany({
    take: 3,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  });

  if (!jobs.length) {
    console.log('No jobs found.');
    return { success: false, message: 'No jobs found to tweet.' };
  }

  try {
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

    return { success: true, message: 'Jobs tweeted successfully.', tweetedJobsCount: jobs.length };
  } catch (error) {
    console.error('Failed to post tweets:', error);
    return { success: false, message: 'Failed to post tweets.', error };
  }
}

function formatTweet(job: any) {
  return `💼 Title – ${job.title}
🏢 Company – ${job.company}
📍 Location – ${job.location}
🎯 Experience – ${job.experienceLevel}

🔗 ${job.absolute_url}`;
}
