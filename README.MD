# SeekEasy

Calculate the salary range for jobs advertised on [Seek](https://seek.com.au).

#### Job page:
![Demo - job page](demo.png?raw=true)
#### Search page:
![Demo - search page](demo-search-page.png?raw=true)
#### Search page filters:
![Demo - search page filters](demo-search-page-filters.png?raw=true)


## Installation in Chrome
1. Download this repository
2. Go to the chrome://extensions/ page
3. Click on the "Load unpacked" button
4. Select the `src` directory from the downloaded repo.
5. The extension should now be installed and active.

## Usage
Go to [Seek](https://seek.co.nz) and perform a job search.
Click on a job to view the job details.  
You should see a new section at the top of the page with the estimated salary range.
The notes and tags section should appear below the salary range.  If not, try refreshing the page.
Enter any notes you want to remember about the job into the notes textarea field and click 'Save'.
One at a time, in the tags field, enter any tags you want to apply to the job and press 'Enter' to save them.
You should then see the salary, notes and tags appear on any search pages where the job is listed.
A filter should show at the top of the search page to filter by tags.  The first select element contains the 
tags you want to include, and the second select element contains the tags you want to exclude.  The exclusions 
override the inclusions, i.e. if a job is included by one tag but excluded by another, the job will be hidden. 
Note that filtering is very buggy at the moment and needs work.

### TODO:
- [x] Display data on job search/list page
- [x] Add ability to create tags & filter by them (Implemented, but a bit broken.  Needs work)
- [ ] Add ability to filter by job 'viewed' status
- [ ] Improve/centralise the tag system
- [ ] Fix loading of notes and tags when initially loading job view page
- [ ] Fix 'recent jobs' not displaying in extension popup

### Privacy
All searches are performed within your own browser and are not stored or shared to anyone else.

To enforce this our [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) uses the `connect-src` directive to restrict communication to Seek's job search API at `*.seek.com.au`.

### Disclaimer

This extension is not connected with, or approved by, Seek Limited.

### Acknowledgements

Forked from [cheesestringer's salary-seeker](https://github.com/cheesestringer/salary-seeker) extension.
