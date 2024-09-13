// Helper function to filter and reorder homework items based on completion status and subjects
function filterHomeworks() {
    const filterFinished = document.getElementById('filter-finished').checked;
    const filterUnfinished = document.getElementById('filter-unfinished').checked;
    
    const filterMath = document.getElementById('filter-math').checked;
    const filterEnglish = document.getElementById('filter-english').checked;
    const filterChemistry = document.getElementById('filter-chemistry').checked;
    const filterPhysics = document.getElementById('filter-physics').checked;
    const filterEconomics = document.getElementById('filter-economics').checked;

    const homeworkItems = document.querySelectorAll('.homework-item');
    
    homeworkItems.forEach(item => {
        const statusCheckbox = item.querySelector('.homework-status');
        const status = statusCheckbox.checked ? 'finished' : 'unfinished';
        const subject = item.getAttribute('data-subject');

        // Filter by completion status
        let showByStatus = (!filterFinished && !filterUnfinished) || 
                            (filterFinished && status === 'finished') || 
                            (filterUnfinished && status === 'unfinished');

        // Filter by subject
        let showBySubject = (!filterMath && !filterEnglish && !filterChemistry && !filterPhysics && !filterEconomics) ||
                            (filterMath && subject === 'Math') ||
                            (filterEnglish && subject === 'English') ||
                            (filterChemistry && subject === 'Chemistry') ||
                            (filterPhysics && subject === 'Physics') ||
                            (filterEconomics && subject === 'Economics');

        // Show or hide the item based on filters
        if (showByStatus && showBySubject) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Toggle Finished/Unfinished checkbox to ensure they are mutually exclusive
document.getElementById('filter-finished').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('filter-unfinished').checked = false;
    }
    filterHomeworks();
});

document.getElementById('filter-unfinished').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('filter-finished').checked = false;
    }
    filterHomeworks();
});

// Subject filter checkboxes
const subjectFilters = document.querySelectorAll('.category input[type="checkbox"]');
subjectFilters.forEach(filter => {
    filter.addEventListener('change', filterHomeworks);
});

// Track changes in each homework item's finished/unfinished status
document.querySelectorAll('.homework-status').forEach(checkbox => {
    checkbox.addEventListener('change', filterHomeworks);
});

// Expand functionality for each homework item
document.querySelectorAll('.expand a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Expand homework details...');
    });
});

// Community buttons actions
document.getElementById('need-help-btn').addEventListener('click', function() {
    alert('Redirect to help page...');
});

document.getElementById('write-blog-btn').addEventListener('click', function() {
    alert('Redirect to blog writing page...');
});
