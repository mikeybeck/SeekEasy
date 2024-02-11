const constants = {
    cacheKey: "jobs",
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-search-placeholder") {
        console.log(`Salary range (search page): ${request.result}`);
        // const cachedJobs = getCachedJobs();
        const cachedJobs = getCachedJobs(async (jobs) => {
            // console.table(jobs);
            // getJobsOnPage().forEach(job => {
            //     const existingJobIndex = jobs.findIndex(x => x.id === job.id);
            //     if (existingJobIndex === -1) {
            //         jobs.push(job);
            //     } else {
            //         jobs[existingJobIndex] = job;
            //     }
            // });

            // return jobs;
            updateSearchPage(jobs);
        });

        console.table(cachedJobs);
        request.result ? showInfo(request.result) : showInfo("Error downloading salary.");
    }
});

const getCachedJobs = (callback) => {
    return chrome.storage.local.get(constants.cacheKey, result => {
        let cache = result[constants.cacheKey] || [];
        console.log('cached jobs');
        console.table(cache);
        // const existingJobIndex = cache.findIndex(x => x.id === jobId);

        callback(cache);
    });
}

const updateSearchPage = (jobs) => {
    console.log('Updating search page');
    const elements = document.querySelectorAll("article[data-job-id]");
    console.table(elements);
    for (const element of elements) {
        const job = JSON.parse(element.getAttribute("data-job-id"));
        console.log(`Job: ${job}`);
        const existingJobIndex = jobs.findIndex(x => x.id == job);
        console.log(`Existing job index: ${existingJobIndex}`);
        if (existingJobIndex !== -1) {
            // const cachedJob = jobs[existingJobIndex];
            // addSearchPlaceholder(cachedJob.salary, cachedJob);
            // TODO: Add data to job
        }
    }
}

const getJobsOnPage = () => {
    const jobs = [];
    const elements = document.querySelectorAll("div[data-search-sol-meta]");
    for (const element of elements) {
        const job = JSON.parse(element.getAttribute("data-search-sol-meta"));
        jobs.push(job);
    }

    return jobs;
}


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

const showInfo = async (value, notes = '') => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        addSearchPlaceholder(value, notes);
    } catch (exception) {
    }
}

const addSearchPlaceholder = (text, job) => {
    console.log('Adding search placeholder');
    const elements = document.querySelectorAll("span");
    for (const element of elements) {
        if (element.innerText.includes('Posted')) {
            const div = document.createElement("div");
            div.style.marginTop = "10px";

            const span = document.createElement("span");

            if (text !== null) {
                span.id = selectors.salaryRange;
                span.innerText = `Salary (estimated): ${text}`;
                span.style.fontSize = "16px";
                span.style.lineHeight = "24px";
                span.style.fontFamily = "SeekSans, \"SeekSans Fallback\", Arial, sans-serif";

                div.append(span);
            }

            if (job) {
                // const notesSpan = document.createElement("span");
                // notesSpan.id = selectors.salaryRange + "-notes";
                // notesSpan.innerText = `Notes: ${job.notes}`;
                // notesSpan.style.fontSize = "16px";
                // notesSpan.style.lineHeight = "24px";
                // notesSpan.style.fontFamily = "SeekSans, \"SeekSans Fallback\", Arial, sans-serif";
                //
                // div.append(notesSpan);

                const notesTextArea = document.createElement("textarea");
                notesTextArea.id = selectors.salaryRange + "-notes-textarea";
                notesTextArea.style.width = "100%";
                notesTextArea.style.height = "100px";
                notesTextArea.style.marginTop = "10px";
                notesTextArea.value = job.notes;

                // Insert button: <button type="button" className="btn btn-primary save-button" id="saveButton">Save</button>
                const saveButton = document.createElement("button");
                saveButton.type = "button";
                saveButton.className = "btn btn-primary save-button";
                saveButton.id = selectors.salaryRange +  "-notes-save-button";
                saveButton.innerText = "Save";

                saveButton.onclick = () => {
                    job.notes = document.getElementById(selectors.salaryRange + "-notes-textarea").value;
                    updateNotes(job);
                }

                div.append(notesTextArea);
                div.append(saveButton);
            }

            element.parentElement.before(div);
        }
    }
};
