# actor-github-repositories-search

Apify actor for extracting repositories from GitHub based on search queries

## Input attributes

See [INPUT SCHEMA](./INPUT_SCHEMA.json)

## Output examples

```json
{
  "owner": "meteor",
  "name": "meteor",
  "url": "https://github.com/meteor/meteor",
  "fork": false,
  "description": "Meteor, the JavaScript App Platform",
  "created_at": "2012-01-19T01:58:17Z",
  "updated_at": "2020-11-03T04:16:58Z",
  "pushed_at": "2020-10-31T16:21:04Z",
  "homepage": "https://www.meteor.com",
  "size": 80509,
  "stars": 42034,
  "open_issues": 144,
  "forks": 5140,
  "language": "JavaScript",
  "archived": false,
  "disabled": false
}
```

## Notes

### About implementation

https://docs.github.com/en/free-pro-team@latest/rest/reference/search

GitHub Search API provides only up to 1000 results for each search.
Because of this limitation, we have to do some workarounds,
and even with them the results are not guaranteed to be complete.

#### The workaround

* Sort results by stars
* Get first 1000 results
* Check number of stars of the last result, and use that number for filtering the next search query
* Repeat

#### Limitation

* If there's more than 1000 results with same number of stars, there's no way to get them all

#### Real example

Statistics of results for `meteor` query (as of 2020-11-03)

| Stars     | Results | Diff |
|:----------|:--------|:-----|
| no filter | 46 742  | 1000 |
| <26       | 45 759  | 983  |
| <11       | 44 851  | 908  |
| <7        | 44 120  | 731  |
| <5        | 43 401  | 719  |
| <4        | 42 839  | 562  |
| <3        | 41 971  | 868  |
| <2        | 40 415  | 1556 |
| <1        | 36 068  | 5347 |

#### Other notes

About why it is not possible to sort by date
https://stackoverflow.com/questions/37602893/github-search-limit-results#comment85767535_37639739

