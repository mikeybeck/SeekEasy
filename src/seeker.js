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
                notesTextArea.placeholder = "Add notes here...";
                notesTextArea.value = job.notes || "";

                const saveButton = document.createElement("button");
                saveButton.type = "button";
                saveButton.className = "btn btn-primary save-button";
                saveButton.id = selectors.salaryRange + "-notes-save-button";
                saveButton.innerText = "Save";

                saveButton.onclick = () => {
                    job.notes = document.getElementById(selectors.salaryRange + "-notes-textarea").value;
                    updateJobInfo(job);
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


            // Add CSS
            var styles = `
                .tags-input { 
                    display: block; 
                    position: relative; 
                    border: 1px solid #ccc; 
                    border-radius: 4px; 
                    padding: 5px; 
                    box-shadow: 2px 2px 5px #00000033; 
                } 
          
                .tags-input ul { 
                    list-style: none; 
                    padding: 0; 
                    margin: 0; 
                } 
          
                .tags-input li { 
                    display: inline-block; 
                    background-color: #f2f2f2; 
                    color: #333; 
                    border-radius: 20px; 
                    padding: 5px 10px; 
                    margin-right: 5px; 
                    margin-bottom: 5px; 
                } 
          
                .tags-input input[type="text"] { 
                    border: none; 
                    outline: none; 
                    padding: 5px; 
                    font-size: 14px; 
                } 
          
                .tags-input input[type="text"]:focus { 
                    outline: none; 
                } 
          
                .tags-input .delete-button { 
                    background-color: transparent; 
                    border: none; 
                    color: #999; 
                    cursor: pointer; 
                    margin-left: 5px; 
                } 
            `;

            var styleSheet = document.createElement("style");
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet);

            const tagsDiv = document.createElement("div");
            tagsDiv.className = "tags-input";
            const tagsList = document.createElement("ul");
            tagsList.id = "tags";

            // Add tags input box
            const tagsInput = document.createElement("input");
            tagsInput.id = selectors.salaryRange + "-tags-input";
            tagsInput.style.width = "100%";
            tagsInput.style.height = "30px";
            tagsInput.style.marginTop = "10px";
            tagsInput.placeholder = "Add tags here...";
            tagsInput.type = "text";
            tagsInput.value = "";

            displayTags(job, tagsList);

            // Add an event listener for keydown on the input element
            tagsInput.addEventListener('keydown', function (event) {
                // Check if the key pressed is 'Enter'
                if (event.key === 'Enter') {
                    console.log(tagsInput.value);
                    // Prevent the default action of the keypress
                    // event (submitting the form)
                    event.preventDefault();
                    // Create a new list item element for the tag
                    const tag = document.createElement('li');
                    // Get the trimmed value of the input element
                    const tagContent = tagsInput.value.trim();
                    // If the trimmed value is not an empty string
                    if (tagContent !== '') {
                        // Set the text content of the tag to the trimmed value
                        tag.innerText = tagContent;
                        // Add a delete button to the tag
                        tag.outerHTML += '<button class="delete-button">X</button>';
                        // Append the tag to the tags list
                        tagsList.appendChild(tag);
                        // Clear the input element's value
                        tagsInput.value = '';

                        addTagToJob(job, tagContent);
                    }
                }
            });

            // Add an event listener for click on the tags list
            tagsList.addEventListener('click', function (event) {
                // If the clicked element has the class 'delete-button'
                if (event.target.classList.contains('delete-button')) {
                    // Use node index of the tag to determine which tag to remove. This seems to be the most reliable
                    // way to do this.  Tags *should* always be in the same order (I think).
                    const index = Array.prototype.indexOf.call(tagsList.children, event.target.parentNode);
                    removeTagFromJob(job, index);
                    // Remove the parent element (the tag)
                    event.target.parentNode.remove();
                }
            });

            tagsDiv.appendChild(tagsList);
            tagsDiv.appendChild(tagsInput);
            div.appendChild(tagsDiv);

            element.parentElement.before(div);
        }
    }
};

const displayTags = (job, tagsList) => {
    const tags = JSON.parse(job.tags);
    tagsList.innerHTML = "";
    tags.forEach(tag => {
        const tagElement = document.createElement("li");
        tagElement.innerText = tag;
        tagElement.innerHTML += '<button class="delete-button">X</button>';
        tagsList.appendChild(tagElement);
    });
}

const addTagToJob = (job, tag) => {
    if (job.tags) {
        let tags = JSON.parse(job.tags);
        tags.push(tag);
        job.tags = JSON.stringify(tags);
    } else {
        job.tags = JSON.stringify([tag]);
    }
    updateJobInfo(job);
}

const removeTagFromJob = (job, tagIndex) => {
    let tags = JSON.parse(job.tags);
    tags.splice(tagIndex, 1);
    job.tags = JSON.stringify(tags);
    updateJobInfo(job);
}

// const saveTags = (job, tags) => {
//     const tags = document.getElementById(selectors.salaryRange + "-tags-input").value;
//     job.tags = tags;
//     updateJobInfo(job);
// }

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

function updateJobInfo(job) {
    console.log(`NOTES2: ${job}`);
    chrome.runtime.sendMessage({
        message: "update-job-info",
        result: job,
    });
}
