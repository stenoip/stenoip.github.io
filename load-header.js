function loadHeader() {
    // Use the Fetch API to get the content of the header.html file
    // Note: Requires a fetch polyfill for IE11
    fetch('header.html')
        .then(function(response) {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.text();
        })
        .then(function(htmlContent) {
            // Find the element where the header should be placed
            var headerContainer = document.getElementById('header-placeholder');
            
            // Check if the container exists
            if (headerContainer) {
                // Insert the fetched HTML content
                headerContainer.innerHTML = htmlContent;
            } else {
                console.error("Header placeholder element with id 'header-placeholder' not found.");
            }
        })
        .catch(function(error) {
            console.error('There was a problem loading the header:', error);
        });
}

// Call the function once the entire page is loaded
document.addEventListener('DOMContentLoaded', loadHeader);
