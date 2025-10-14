function loadHeader() {
    // Use the Fetch API to get the content of the header.html file
    fetch('header.html')
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            // Find the element where the header should be placed
            const headerContainer = document.getElementById('header-placeholder');
            
            // Check if the container exists
            if (headerContainer) {
                // Insert the fetched HTML content (including the <style> block)
                headerContainer.innerHTML = htmlContent;
            } else {
                console.error("Header placeholder element with id 'header-placeholder' not found.");
            }
        })
        .catch(error => {
            console.error('There was a problem loading the header:', error);
        });
}

// Call the function once the entire page is loaded
document.addEventListener('DOMContentLoaded', loadHeader);
