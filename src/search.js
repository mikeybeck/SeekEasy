const constants = {
    cacheKey: "jobs",
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-search-placeholder") {
        console.log(`Salary range (search page): ${request.result}`);
        getCachedJobs(async (cachedJobs) => {
            updateSearchPage(cachedJobs);
            displayFilter();
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

const displayFilter = () => {
    const numJobsElement = document.querySelectorAll("h1[data-automation=totalJobsMessage]");
    if (numJobsElement.length === 0) {
        console.log("No total jobs text found.  Unable to add filters.");
        return;
    }

    // Get all tags from cached jobs
    const tags = [];
    getCachedJobs(async (cachedJobs) => {
        for (const job of cachedJobs) {
            console.log(`Job tags: ${job.tags}`);
            const jobTags = JSON.parse(job.tags || '[]');
            for (const tag of jobTags) {
                tags.push(tag);
            }
        }

        const uniqueTags = [...new Set(tags)];
        console.log(`Unique tags: ${uniqueTags}`);
        const filters = document.createElement("div");
        filters.style.marginTop = "10px";
        filters.style.marginBottom = "10px";
        filters.style.display = "flex";
        filters.style.flexWrap = "wrap";
        filters.style.alignItems = "center";
        filters.style.justifyContent = "flex-start";

        const tagFilter = document.createElement("select");
        tagFilter.id = "multipleSelect";
        tagFilter.multiple = true;
        // Add tags to filter
        for (const tag of uniqueTags) {
            const option = document.createElement("option");
            option.value = tag;
            option.text = tag;
            tagFilter.appendChild(option);
        }

        // Add filter button
        const filterButton = document.createElement("button");
        filterButton.innerHTML = "Apply filter";
        filterButton.onclick = applyFilter;
        filterButton.style.marginLeft = "10px";
        filterButton.style.padding = "10px";
        filterButton.style.borderRadius = "5px";
        filterButton.style.backgroundColor = "blue";
        filterButton.style.color = "white";
        filterButton.style.border = "none";
        filterButton.style.cursor = "pointer";

        filters.appendChild(tagFilter);
        filters.appendChild(filterButton);

        numJobsElement[0].appendChild(filters);
    });
}

const applyFilter = () => {
    var options = document.getElementById('multipleSelect').options,
        result = [];

    for (var i = 0, len = options.length; i < len; i++) {
        var opt = options[i];

        if (opt.selected) {
            result.push(opt.value);
        }
    }

    console.log(result);
    alert(result);
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

    const jobTags = JSON.parse(job.tags || '[]');
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
