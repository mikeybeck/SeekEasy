chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "update-search-placeholder") {
        console.log(`Salary range: ${request.result}`);
        request.result ? showInfo(request.result) : showInfo("Error downloading salary.");
    }
});

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
