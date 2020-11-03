// NOT USED, just kept in repo as a reference

const { Octokit } = require('@octokit/rest');
const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { queries, sort, order, limitPerQuery, token } = input;

    // About implementation
    // GitHub Search API provides only up to 1000 results for each search
    // Because of this limitation, we have to do kinda ugly workarounds
    // https://docs.github.com/en/free-pro-team@latest/rest/reference/search

    // Validate input
    if (limitPerQuery > 1000 && sort !== 'stars') {
        throw new Error('Limit greater than 1000 is currently supported only for ordering by stars');
    }

    const octokit = new Octokit({ auth: token });

    // Why it's not possible to sort by date
    // https://stackoverflow.com/questions/37602893/github-search-limit-results#comment85767535_37639739

    const allResults = [];
    for (const query of queries) {
    // TODO: Validate query

        const queryResults = [];

        let queryCursor = query;
        while (queryCursor) {
            let totalCount; let
                limit;
            console.log(`Scraping ${queryCursor}`);
            await octokit.paginate(
                'GET /search/repositories',
                { q: queryCursor, sort, order, per_page: 100 },
                (response, done) => {
                    // TODO: Handle Rate Limits
                    if (response.status !== 200) {
                        console.error('STATUS NOT 200');
                        done(); // TODO: Handle gracefully
                        return;
                    }

                    totalCount = response.data.total_count; // can change on subsequent queries
                    limit = Math.min(limitPerQuery, totalCount);
                    queryResults.push(...response.data.map(pickRepo));
                    // eslint-disable-next-line max-len
                    console.log(`Scraped: ${queryResults.length} | Rate limit: ${response.headers['x-ratelimit-used']}/${response.headers['x-ratelimit-limit']} (refreshes ${new Date(response.headers['x-ratelimit-reset'] * 1000).toISOString()})`);

                    if (queryResults.length >= limit) {
                        done();
                    }
                },
            );

            if (queryResults.length < limit) {
                const last = queryResults[queryResults.length - 1];
                // TODO: Support other sort options than stars
                const threshold = last.stars;
                const suffix = ` stars:<=${threshold}`;
                if (queryCursor.includes('stars:<=')) {
                    queryCursor = queryCursor.replace(/ stars:<=\d+/, suffix);
                } else {
                    queryCursor += suffix; // +1 to be sure
                }
            } else {
                queryCursor = null;
            }
        }

        if (!queryResults || queryResults.length === 0) {
            console.warn(`No results for query "${query}"`);
            // eslint-disable-next-line no-continue
            continue;
        }

        allResults.push(...queryResults);
    }

    await Apify.pushData(allResults);
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
