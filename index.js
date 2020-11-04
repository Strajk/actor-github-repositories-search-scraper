const { Octokit } = require('@octokit/rest');
const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    const {
        queries, // eg: ['apify', 'actor']
        token, // eg: abc123
    } = input;

    // Prepare request queue
    const requestQueue = await Apify.openRequestQueue();
    for (const x of queries) {
        await requestQueue.addRequest({ url: x }); // not really url, but RequestList requires key `url`
    }

    // Init GitHub API
    const octokit = new Octokit({ auth: token });

    const crawler = new Apify.BasicCrawler({
        handleRequestTimeoutSecs: 60 * 2,
        requestQueue,
        handleRequestFunction: async ({ request }) => {
            const results = [];
            const { filter } = request.userData;
            console.log(`Processing ${request.url}, ${(filter || '–')}`);

            let totalCount;
            const q = filter ? `${request.url} stars:<${filter}` : request.url;
            await octokit.paginate(
                'GET /search/repositories',
                { q, sort: 'stars', order: 'desc', per_page: 100 },
                (response) => {
                    totalCount = response.data.total_count; // can change on subsequent queries
                    results.push(...response.data.map(pickRepo));
                    // eslint-disable-next-line max-len
                    console.log(`Scraped: ${results.length} | Rate limit: ${response.headers['x-ratelimit-used']}/${response.headers['x-ratelimit-limit']} (refreshes ${new Date(response.headers['x-ratelimit-reset'] * 1000).toISOString()})`);
                },
            );

            if (totalCount > 1000) { // more results
                const lastResult = results[results.length - 1];
                const lastResultStars = lastResult.stars + 1; // +1 because we are filtering `less than stars`, not `less than and equal`
                const nextFilter = Math.min(
                    (filter || Infinity) - 1, // either lower by one
                    lastResultStars, // or use
                );
                if (nextFilter > 0) {
                    await requestQueue.addRequest({
                        url: request.url,
                        userData: { filter: nextFilter },
                        uniqueKey: `${request.url}|${nextFilter}`,
                    });
                }
            }
            await Apify.pushData(results);
        },
    });

    await crawler.run();
});

function pickRepo(repo) {
    return {
        owner: repo.owner.login,
        name: repo.name,
        url: repo.html_url,
        fork: repo.fork,
        description: repo.description,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        homepage: repo.homepage,
        size: repo.size,
        stars: repo.stargazers_count,
        open_issues: repo.open_issues_count,
        forks: repo.forks_count,
        language: repo.language,
        archived: repo.archived,
        disabled: repo.disabled,
    };
}
