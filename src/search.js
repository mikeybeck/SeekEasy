const constants = {
    cacheKey: "jobs",
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-search-placeholder") {
        console.log(`Salary range (search page): ${request.result}`);
        getCachedJobs(async (cachedJobs) => {
            updateSearchPage(cachedJobs);
        });
    }
});

const getCachedJobs = (callback) => {
    return chrome.storage.local.get(constants.cacheKey, result => {
        let cache = result[constants.cacheKey] || [];
        console.log('cached jobs');
        console.table(cache);

        callback(cache);
    });
}

const updateSearchPage = (cachedJobs) => {
    console.log('Updating search page');
    const elements = document.querySelectorAll("article[data-job-id]");
    console.table(elements);
    for (const element of elements) {
        const job = JSON.parse(element.getAttribute("data-job-id"));
        console.log(`Job: ${job}`);
        const existingJobIndex = cachedJobs.findIndex(x => x.id == job);
        console.log(`Existing job index: ${existingJobIndex}`);
        if (existingJobIndex !== -1) {
            const cachedJob = cachedJobs[existingJobIndex];
            console.log(`Cached job ID: ${job}`);
            showInfo(element, cachedJob);
        }
    }
}

const showInfo = async (element, cachedJob) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        addSearchPlaceholder(element, cachedJob);
    } catch (exception) {
        const job = JSON.stringify(cachedJob);
        console.error(`Error adding data to search page.\nElement: ${element}\nJob: ${job}\nException follows:`);
        console.error(exception);
    }
}

const addSearchPlaceholder = (element, job) => {
    console.log('Adding search placeholder');
    const div = document.createElement("div");
    div.style.marginTop = "10px";

    const span = document.createElement("span");

    const jobTags = JSON.parse(job.tags || '{}');
    const tags = jobTags.join(", ");
    const textToInsert = `Salary (estimated): ${job.range}\nNotes: ${job.notes}\nTags: ${tags}`;

    span.id = selectors.salaryRange;
    span.innerText = textToInsert;
    span.style.fontSize = "16px";
    span.style.lineHeight = "24px";
    span.style.fontFamily = "SeekSans, \"SeekSans Fallback\", Arial, sans-serif";

    div.append(span);

    element.append(div);
};
