const constants = {
    maxResults: 50,
    maxRequests: 10,
    maxCacheDays: 60,
    cacheKey: "jobs",
    searchUrl: "https://www.seek.com.au/api/chalice-search/v4/search",
    seekNewZealand: "seek.co.nz",
    version: chrome.runtime.getManifest().version
};

const rangeUrl = new URL(constants.searchUrl);

const calculateRange = async (url) => {
    const jobId = getJobId(url);
    if (!jobId) {
        return null;
    }

    const minRange = 30000;
    const maxRange = 999999;

    const jobDetails = await getJobDetails(jobId);
    const job = jobDetails.data.find(x => x.id == jobId);
    if (job) {
        rangeUrl.searchParams.set("advertiserid", job.advertiser.id);
        rangeUrl.searchParams.set("pagesize", constants.maxResults);
        rangeUrl.searchParams.set("sourcesystem", "houston");

        if (url.includes(constants.seekNewZealand)) {
            rangeUrl.searchParams.set("where", "New+Zealand");
        } else {
            rangeUrl.searchParams.delete("where");
        }

        const maxSalary = await getMaxSalary(jobId, minRange, maxRange);
        const minSalary = await getMinSalary(jobId, minRange, maxSalary);

        const notes = job.id + ': ' + job.title;

        if (minSalary && maxSalary) {
            const range = `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
            cacheJob(jobId, job.title, job.companyName, minSalary, maxSalary, range);
            return range;
        }
    } else {
        throw new Error(`Failed to find job ${jobId}.`);
    }
};

const getMaxSalary = async (jobId, min, max) => {
    let minimum = min;
    let maximum = max;
    let searchValue = getMiddle(minimum, maximum);

    // Limit number of requests
    for (let i = 0; i < constants.maxRequests; i++) {
        const job = await getJob(jobId, searchValue, maximum);
        if (job && job.found) {
            minimum = searchValue;
            searchValue = getMiddle(searchValue, maximum);

            // Check percentage change and round up to the nearest 1k to save on requests.
            if (buggerAllChange(minimum, searchValue)) {
                console.log(`Job found: Max range ${minimum}-${searchValue} found after ${i + 1} requests.`);
                return roundUp(searchValue);
            }
        } else {
            maximum = searchValue;
            searchValue = getMiddle(minimum, searchValue);

            // Check percentage change and round up to the nearest 1k to save on requests.
            if (buggerAllChange(searchValue, maximum)) {
                console.log(`Job missing: Max range ${searchValue}-${maximum} found after ${i + 1} requests.`);
                return roundUp(searchValue);
            }
        }
    }

    console.log(`Max salary not found after ${constants.maxRequests} requests.`);
    return roundUp(searchValue);
};

const getMinSalary = async (jobId, min, max) => {
    let minimum = min;
    let maximum = max;
    let searchValue = getMiddle(minimum, maximum);

    // Limit number of requests
    for (let i = 0; i < constants.maxRequests; i++) {
        const job = await getJob(jobId, minimum, searchValue);
        if (job && job.found) {
            maximum = searchValue;
            searchValue = getMiddle(minimum, searchValue);

            // Check percentage change and round down to the nearest 1k to save on requests.
            if (buggerAllChange(searchValue, maximum)) {
                console.log(`Job found: Min ${searchValue}-${maximum} found after ${i + 1} requests.`);
                return roundDown(searchValue);
            }
        } else {
            minimum = searchValue;
            searchValue = getMiddle(searchValue, maximum);

            // Check percentage change and round down to the nearest 1k to save on requests.
            if (buggerAllChange(minimum, searchValue)) {
                console.log(`Job missing: Min ${minimum}-${searchValue} found after ${i + 1} requests.`);
                return roundDown(searchValue);
            }
        }
    }

    console.log(`Min salary not found after ${constants.maxRequests} requests.`);
    return roundDown(searchValue);
};

const getMiddle = (lower, upper) => {
    return Math.round((lower + upper) / 2);
};

const buggerAllChange = (first, second) => {
    return (first / second) * 100 > 99.4;
};

const roundUp = value => {
    return Math.ceil(value / 1000) * 1000;
};

const roundDown = value => {
    return Math.floor(value / 1000) * 1000;
};

const getJobId = url => {
    try {
        return new URL(url).pathname.split("/")[2];
    } catch {
        throw new Error(`Failed to find jobId for url ${url}.`);
    }
};

const getJobDetails = async jobId => {
    const url = new URL(constants.searchUrl);
    url.searchParams.set("jobid", jobId);

    const response = await fetch(url.href);
    return response.json();
};

const getJob = async (jobId, min, max) => {
    rangeUrl.searchParams.set("salaryrange", `${min}-${max}`);
    const response = await fetch(rangeUrl.href);

    if (response.status === 200) {
        const result = await response.json();
        if (result && result.data && result.data.find(x => x.id == jobId)) {
            return {found: true};
        } else {
            return {found: false};
        }
    } else {
        throw new Error(`Unsuccessful response: ${response.status}`);
    }
};

const cacheJob = (jobId, title, company, minimum, maximum, range) => {
    try {
        const currentDate = new Date().getTime();
        const job = {
            id: jobId,
            title: title,
            company: company,
            minimum: minimum,
            maximum: maximum,
            range: range,
            created: currentDate,
            version: constants.version
        };

        chrome.storage.local.get(constants.cacheKey, result => {
            let cache = result[constants.cacheKey] || [];
            const existingJobIndex = cache.findIndex(x => x.id === jobId);
            if (existingJobIndex !== -1) {
                // Get notes from existing job
                job.notes = cache[existingJobIndex].notes;
                cache[existingJobIndex] = job;
            } else {
                cache.push(job);
            }

            // Remove old jobs from cache
            const updatedCache = cache.filter(x => getDifferenceInDays(currentDate, x.created) <= constants.maxCacheDays);

            let storeObj = {};
            storeObj[constants.cacheKey] = updatedCache;
            chrome.storage.local.set(storeObj);
        });
    } catch (exception) {
        console.log(`Failed to cache job ${jobId}`, exception);
    }
};

const updateJob = (job) => {
    try {
        const currentDate = new Date().getTime();
        job.updated = currentDate;
        job.version = constants.version;

        chrome.storage.local.get(constants.cacheKey, result => {
            let cache = result[constants.cacheKey] || [];
            const existingJobIndex = cache.findIndex(x => x.id === job.id);
            if (existingJobIndex !== -1) {
                cache[existingJobIndex] = job;
            } else {
                cache.push(job);
            }

            // Remove old jobs from cache
            const updatedCache = cache.filter(x => getDifferenceInDays(currentDate, x.updated) <= constants.maxCacheDays);

            let storeObj = {};
            storeObj[constants.cacheKey] = updatedCache;
            chrome.storage.local.set(storeObj);
        });
    } catch (exception) {
        console.log(`Failed to update job ${job.id}`, exception);
    }
};

const getDifferenceInDays = (first, second) => Math.round(Math.abs((first - second) / 86400000));

const sendMessage = (tabId, message, result) => {
    chrome.tabs.sendMessage(tabId, {
        message: message,
        result: result,
    });
};

const handleScriptInjection = (tabId, url) => {
    if (!isSeekUrl(url)) {
        return;
    }

    chrome.scripting.executeScript(
        {
            target: {tabId: tabId},
            function: function () {
                var injected = window.seekerInjected;
                window.seekerInjected = true;
                return injected;
            }
        },
        async response => {
            // Seeker is already injected.
            if (response[0]) {
                console.log("Seeker already injected.")
                if (isJobUrl(url) || isExpiredJobUrl(url)) {
                    checkJobType(tabId, url);
                } else {
                    console.log("Not a job url.  Need to check if it's a search page.");
                    if (isSearchPage(url)) {
                        console.log("It's a search page.");
                        updateSearchPage(tabId, url);
                    }
                }
            } else {
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ['seeker.js', 'search.js']
                });
            }
        }
    );
};

const updateSearchPage = async (tabId, url) => {
    sendMessage(tabId, 'update-search-placeholder', "Calculating...");
}

const checkJobType = async (tabId, url) => {
    // Use cache for same day jobs, expired jobs, and exceptions.
    findCachedJob(url, async (cachedJob) => {
        if (isJobUrl(url)) {
            try {
                const isCurrent = cachedJob && cachedJob.version === constants.version; // Use cache for jobs created on same version.
                const createdToday = cachedJob && getDifferenceInDays(new Date().getTime(), cachedJob.created) === 0; // Use cache for jobs viewed on the same day.

                if (!cachedJob) {
                    console.log("No cached job found.");
                    cachedJob = {};
                }

                if (isCurrent && createdToday) {
                    console.table(cachedJob);
                    console.log(`Cached salary range is ${cachedJob.range}`);
                    sendMessage(tabId, 'update-placeholder', cachedJob);
                } else {
                    const range = await calculateRange(url);
                    cachedJob.range = range;
                    console.log(`Salary range is ${range}`);
                    sendMessage(tabId, 'update-placeholder', cachedJob);
                }

                // Update notes on job
                // sendMessage(tabId, 'update-notes', cachedJob ? cachedJob : {});
            } catch (exception) {
                // sendMessage(tabId, 'update-placeholder', cachedJob ? cachedJob.range : `Failed to calculate salary range: ${exception.message}`);
                sendMessage(tabId, 'update-placeholder', cachedJob);
                console.error(`Failed to calculate salary range for job ${url}`, exception);
            }
        } else if (isExpiredJobUrl(url)) {
            // sendMessage(tabId, 'update-placeholder', cachedJob ? cachedJob.range : "Couldn't find a cached salary for this job");
            sendMessage(tabId, 'update-placeholder', cachedJob);
            console.error('Could not find a cached salary for this job.');
        }
    });
};

const findCachedJob = (url, callback) => {
    try {
        console.log(`FINDING CACHED JOB`);
        const jobId = getJobId(url);
        chrome.storage.local.get(constants.cacheKey, result => {
            let jobCache = result[constants.cacheKey] || [];
            const job = jobCache.find(x => x.id === jobId);
            callback(job);
        });
    } catch (exception) {
        console.error(`Failed to find cached job for url ${url}`, exception);
        callback(null);
    }
};

const isJobUrl = url => url.toLowerCase().includes("/job/");

const isExpiredJobUrl = url => url.toLowerCase().includes("/expiredjob/");

const isSeekUrl = url => url.toLowerCase().includes("seek.co");

function isSearchPage(url) {
    const lcURL = url.toLowerCase();
    return lcURL.includes("jobs") && // Not great but seems to be the best we can do from the URL.
        !lcURL.includes("/my-activity/saved-jobs/");
}

// const isSupportedUrl = url => isJobUrl(url) || isExpiredJobUrl(url);

function logError(message, exception) {
    //console.error(message, exception);
    console.log(message, exception);
   chrome.runtime.sendMessage({
        message: "log-error",
        result: message + " " + exception.message
    });
}

// Handle job access by site navigation, new tab, and page refresh.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        handleScriptInjection(tabId, tab.url);
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-job-info") {
        console.log(`NOTES3: ${request.result}`);
        request.result ? updateJob(request.result) : logError("Error updating job.", new Error("No job result to update."));
        // request.result ? cacheJob(request.result.id, request.result.title, request.result.company, request.result.minimum, request.result.maximum, request.result.range, request.result.notes) : console.log("Error updating notes.");
    }
});
