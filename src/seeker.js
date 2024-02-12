const selectors = {
    salaryRange: "salary-range-value",
    legacySalaryRange: "legacy-salary-range-value",
};

const addPlaceholder = (job, message) => {
    const elements = document.querySelectorAll("span");
    for (const element of elements) {
        if (element.innerText.includes('Posted')) {
            const div = document.createElement("div");
            div.style.marginTop = "10px";

            const span = document.createElement("span");

            if (job) {
                span.id = selectors.salaryRange;
                span.innerText = `Salary (estimated): ${job.range}`;
                span.style.fontSize = "16px";
                span.style.lineHeight = "24px";
                span.style.fontFamily = "SeekSans, \"SeekSans Fallback\", Arial, sans-serif";

                div.append(span);

                const notesTextArea = document.createElement("textarea");
                notesTextArea.id = selectors.salaryRange + "-notes-textarea";
                notesTextArea.style.width = "100%";
                notesTextArea.style.height = "100px";
                notesTextArea.style.marginTop = "10px";
                notesTextArea.value = job.notes;

                const saveButton = document.createElement("button");
                saveButton.type = "button";
                saveButton.className = "btn btn-primary save-button";
                saveButton.id = selectors.salaryRange + "-notes-save-button";
                saveButton.innerText = "Save";

                saveButton.onclick = () => {
                    job.notes = document.getElementById(selectors.salaryRange + "-notes-textarea").value;
                    updateJob(job);
                }

                div.append(notesTextArea);
                div.append(saveButton);
            }

            if (message) {
                const messageSpan = document.createElement("span");
                messageSpan.innerText = message;
                messageSpan.style.color = "red";
                messageSpan.style.fontSize = "14px";
                messageSpan.style.lineHeight = "24px";
                messageSpan.style.fontFamily = "SeekSans, \"SeekSans Fallback\", Arial, sans-serif";

                div.append(messageSpan);
            }

            element.parentElement.before(div);
        }
    }
};

// Seek seems to be doing a/b testing so try and support both for now
const showSalary = async (job, message = '') => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        addPlaceholder(job, message);
    } catch (exception) {
    }
    try {
        updateLegacyPlaceholder(job, message);
    } catch (exception) {
    }
}

const addLegacyPlaceholder = () => {
    const infoSections = document.querySelectorAll('[aria-labelledby="jobInfoHeader"]');
    for (const section of infoSections) {
        const items = section.querySelectorAll("dd");
        const salaryRange = items[1].cloneNode(true);
        salaryRange.querySelector("strong").innerText = "Salary";

        const salaryRangePlaceholder = salaryRange.querySelector("span span span");
        if (salaryRangePlaceholder) {
            salaryRangePlaceholder.id = selectors.legacySalaryRange;
            salaryRangePlaceholder.innerText = "Calculating...";
        } else {
            const span = document.createElement("span");
            span.id = selectors.legacySalaryRange;
            span.innerText = "Calculating...";
            span.style.fontSize = "14px";
            salaryRange.appendChild(span);
        }

        items[1].parentNode.insertBefore(salaryRange, items[1].nextSibling);
    }
};

const updateLegacyPlaceholder = (job, message) => {
    // Wait for a max of 2 seconds for career insights to load before adding the placeholder.
    let elapsed = 0;
    const interval = setInterval(() => {
        const insights = document.querySelector("div[data-automation='dynamic-lmis']");
        if (insights || elapsed >= 2000) {
            clearInterval(interval);
            addLegacyPlaceholder();

            const elements = document.querySelectorAll(`#${selectors.legacySalaryRange}`);
            for (const element of elements) {
                element.innerText = job.range;
            }
        }

        elapsed += 100;
    }, 100);
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-placeholder") {
        console.log(`Salary range: ${request.result.range}`);
        request.result.range ? showSalary(request.result) : showSalary(null, "Error downloading salary.");
    }

    if (request.message === "update-notes") {
        console.log(`NOTES: ${request.result}`);
        request.result ? showSalary(request.result) : showSalary(null, "Error showing notes.");
    }
});

function updateJob(job) {
    console.log(`NOTES2: ${job}`);
    chrome.runtime.sendMessage({
        message: "update-job-data",
        result: job,
    });
}
