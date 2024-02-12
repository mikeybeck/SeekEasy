const constants = {
    cacheKey: "jobs",
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-search-placeholder") {
        console.log(`Salary range (search page): ${request.result}`);
        getCachedJobs(async (cachedJobs) => {
            updateSearchPage(cachedJobs);
            displayFilter();
            await restoreSelectedOptions();
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

const displayFilter = async (loops = 0) => {
    const numJobsElement = document.querySelectorAll("h1[data-automation=totalJobsMessage]");
    if (numJobsElement.length === 0) {
        if (loops > 10) {
            console.log("Unable to find total jobs text after 10 seconds.  Exiting.");
            return;
        }

        console.log("No total jobs text found yet.  Unable to add filters. Will try again in 1 second.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        displayFilter(loops + 1);
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

        const tagFilterShow = document.createElement("select");
        tagFilterShow.id = "tagFilterShow";
        tagFilterShow.multiple = true;
        // Add tags to filter
        for (const tag of uniqueTags) {
            const option = document.createElement("option");
            option.value = tag;
            option.text = tag;
            tagFilterShow.appendChild(option);
        }

        const tagFilterHide = document.createElement("select");
        tagFilterHide.id = "tagFilterHide";
        tagFilterHide.multiple = true;
        // Add tags to filter
        for (const tag of uniqueTags) {
            const option = document.createElement("option");
            option.value = tag;
            option.text = tag;
            tagFilterHide.appendChild(option);
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

        // Clear filters button
        const clearFilterButton = document.createElement("button");
        clearFilterButton.innerHTML = "Clear filter";
        clearFilterButton.onclick = () => {
            clearFilter(true);
        }

        const filterShowToggle = document.createElement("input");
        filterShowToggle.type = "checkbox";
        filterShowToggle.id = "filterShowToggle";
        filterShowToggle.value = "show";

        const filterShowToggleLabel = document.createElement("label");
        filterShowToggleLabel.htmlFor = "filterShowToggle";
        filterShowToggleLabel.innerText = "Hide filtered jobs";
        filterShowToggleLabel.style.marginLeft = "5px";
        filterShowToggleLabel.style.fontSize = "10px";

        // Add checkbox to hide untagged jobs
        const hideUntaggedJobsToggle = document.createElement("input");
        hideUntaggedJobsToggle.type = "checkbox";
        hideUntaggedJobsToggle.id = "hideUntaggedJobsToggle";
        hideUntaggedJobsToggle.value = "show";

        const hideUntaggedJobsToggleLabel = document.createElement("label");
        hideUntaggedJobsToggleLabel.htmlFor = "hideUntaggedJobsToggle";
        hideUntaggedJobsToggleLabel.innerText = "Hide untagged jobs";
        hideUntaggedJobsToggleLabel.style.marginLeft = "5px";
        hideUntaggedJobsToggleLabel.style.fontSize = "10px";

        filters.appendChild(tagFilterShow);
        filters.appendChild(tagFilterHide);
        filters.appendChild(filterButton);
        filters.appendChild(clearFilterButton);
        // filters.appendChild(filterShowToggle);
        // filters.appendChild(filterShowToggleLabel);
        filters.appendChild(hideUntaggedJobsToggle);
        filters.appendChild(hideUntaggedJobsToggleLabel);

        numJobsElement[0].appendChild(filters);
    });
}

const clearFilter = (clearSelected = false) => {
    if (clearSelected) {
        document.getElementById('tagFilterShow').selectedIndex = -1;
        document.getElementById('tagFilterHide').selectedIndex = -1;
    }

    const jobElements = document.querySelectorAll("article[data-job-id]");
    for (const element of jobElements) {
        element.style.backgroundColor = "black";
        element.style.display = "block";
    }
}

const storeSelectedOptions = (optionsShowSelectedIndexes, optionsHideSelectedIndexes) => {
    console.log('Storing selected options');
    chrome.storage.local.set({ 'selectedOptionsShow': optionsShowSelectedIndexes, 'selectedOptionsHide': optionsHideSelectedIndexes });
    console.log('Stored selected options');
}

const restoreSelectedOptions = async () => {
    console.log('Restoring selected options');

    chrome.storage.local.get(['selectedOptionsShow', 'selectedOptionsHide'], async function (result) {
        await waitForElementToExist('#tagFilterShow', function (element) {
            console.log('Element:', element);
            for (var i = 0; i < element.options.length; i++) {
                element.options[i].selected = result.selectedOptionsShow.includes(i);
            }
        });

        await waitForElementToExist('#tagFilterHide', function (element) {
            console.log('Element:', element);
            for (var i = 0; i < element.options.length; i++) {
                element.options[i].selected = result.selectedOptionsHide.includes(i);
            }
        });
    });
    console.log('Restored selected options');
}

async function waitForElementToExist(selector, callback) {
    if (document.querySelector(selector)) {
        console.log('The element exists');
        return callback(document.querySelector(selector));
    }

    const intervalID = setInterval(() => {
        if (document.querySelector(selector)) {
            console.log('The element exists');

            clearInterval(intervalID);

            callback(document.querySelector(selector));
        }
    }, 500);
}

const applyFilter = () => {
    clearFilter();

    var optionsShow = document.getElementById('tagFilterShow').options,
        optionsHide = document.getElementById('tagFilterHide').options,
        tags = [],
        optionsShowSelectedIndexes = [],
        optionsHideSelectedIndexes = [];

    for (var i = 0, len = optionsShow.length; i < len; i++) {
        var opt = optionsShow[i];

        if (opt.selected) {
            tags.push(opt.value);
            optionsShowSelectedIndexes.push(i);
        }
    }

    // Remove tags to hide
    for (var i = 0, len = optionsHide.length; i < len; i++) {
        var opt = optionsHide[i];

        if (opt.selected) {
            tags = tags.filter(x => x !== opt.value);
            optionsHideSelectedIndexes.push(i);
        }
    }

    storeSelectedOptions(optionsShowSelectedIndexes, optionsHideSelectedIndexes);

    // Find all job IDs with the selected tags
    const jobIds = [];
    getCachedJobs(async (cachedJobs) => {
        for (const job of cachedJobs) {
            const jobTags = JSON.parse(job.tags || '[]');
            for (const tag of tags) {
                if (jobTags.includes(tag)) {
                    jobIds.push(job.id);
                    break;
                }
            }
        }

        // Hide all jobs that don't match the filter (currently using background colour to indicate for test purposes)
        const jobElements = document.querySelectorAll("article[data-job-id]");
        for (const element of jobElements) {
            element.style.backgroundColor = "black";
            const job = JSON.parse(element.getAttribute("data-job-id"));
            console.log(jobIds);
            console.log(job);
            // const filterShowToggle = document.getElementById('filterShowToggle').checked;
            // const showJob = filterShowToggle === false && jobIds.includes(job.toString()) ||
            //     filterShowToggle === true && !jobIds.includes(job.toString());
            const showJob = jobIds.includes(job.toString());
            const hideUntaggedJobsToggle = document.getElementById('hideUntaggedJobsToggle').checked;
            const jobTags = JSON.parse(cachedJobs.find(x => x.id == job)?.tags || '[]');
            const showUntaggedJob = hideUntaggedJobsToggle === false && jobTags.length === 0;
            if (showJob || showUntaggedJob) {
                // element.style.backgroundColor = "black";
                // element.style.display = "block";
            } else {
                // element.style.display = "none";
                element.style.backgroundColor = "lightgrey";
                element.style.display = "none";
            }
        }
    });
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
